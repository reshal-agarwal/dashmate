import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/userModel';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface CourierLocationData {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  orderId?: string;
}

interface CourierStatusData {
  isOnline: boolean;
  geohash?: string;
}

const userSockets = new Map<string, Set<string>>();
const courierLocations = new Map<string, { lat: number; lng: number; heading?: number; speed?: number; updatedAt: number }>();

export interface SocketIOExtended extends Server {
  emitToStudent: (userId: string, event: string, data: any) => void;
  emitToCourier: (userId: string, event: string, data: any) => void;
  emitToRestaurant: (restaurantId: string, event: string, data: any) => void;
  emitToOrder: (orderId: string, event: string, data: any) => void;
  emitToNearbyCouriers: (geohash: string, event: string, data: any) => void;
  emitToAdmins: (event: string, data: any) => void;
  getCourierLocation: (courierId: string) => { lat: number; lng: number; heading?: number; speed?: number; updatedAt: number } | null;
  isUserOnline: (userId: string) => boolean;
}

export function initSocket(httpServer: HttpServer): SocketIOExtended {
  const io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  }) as SocketIOExtended;

  // Auth middleware for all namespaces
  const authMiddleware = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret) as { user: { id: string } };
      const user = await User.findById(decoded.user.id).select('role courier.isVerified courier.isOnline restaurant') as any;
      
      if (!user) {
        return next(new Error('User not found'));
      }

      const userId = user._id.toString();
      socket.userId = userId;
      socket.userRole = user.role;
      (socket as any).user = user;
      
      // Track socket for user
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);

      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  };

  // Student namespace
  const studentNs = io.of('/student');
  studentNs.use(authMiddleware);
  studentNs.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Student connected: ${socket.userId}`);
    
    socket.join(`student:${socket.userId}`);
    
    socket.on('order:subscribe', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });
    
    socket.on('order:unsubscribe', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      cleanupSocket(socket);
    });
  });

  // Courier namespace
  const courierNs = io.of('/courier');
  courierNs.use(authMiddleware);
  courierNs.on('connection', (socket: AuthenticatedSocket) => {
    const user = (socket as any).user;
    
    if (user.role !== 'courier' && user.role !== 'admin') {
      socket.disconnect();
      return;
    }

    if (user.role === 'courier' && !user.courier?.isVerified) {
      socket.emit('error', { code: 'COURIER_NOT_VERIFIED', message: 'Courier not verified' });
      socket.disconnect();
      return;
    }

    console.log(`Courier connected: ${socket.userId}`);
    
    socket.join(`courier:${socket.userId}`);
    
    // Location updates - throttled
    let lastLocationUpdate = 0;
    socket.on('courier:location:update', (data: CourierLocationData) => {
      const now = Date.now();
      if (now - lastLocationUpdate < 5000) return; // 5s throttle
      lastLocationUpdate = now;

      courierLocations.set(socket.userId!, { ...data, updatedAt: now });
      
      // Broadcast to relevant order rooms
      if (data.orderId) {
        studentNs.to(`order:${data.orderId}`).emit('courier:location', {
          courierId: socket.userId,
          lat: data.lat,
          lng: data.lng,
          heading: data.heading,
          speed: data.speed,
        });
      }
    });

    socket.on('courier:status:toggle', (data: CourierStatusData) => {
      // Update user in DB (handled via REST API, this is just for real-time)
      socket.broadcast.to(`couriers:nearby:${data.geohash || 'all'}`).emit('courier:status', {
        courierId: socket.userId,
        isOnline: data.isOnline,
      });
    });

    socket.on('courier:join:area', (geohash: string) => {
      socket.join(`couriers:nearby:${geohash}`);
    });

    socket.on('courier:leave:area', (geohash: string) => {
      socket.leave(`couriers:nearby:${geohash}`);
    });

    socket.on('disconnect', () => {
      cleanupSocket(socket);
      courierLocations.delete(socket.userId!);
    });
  });

  // Restaurant namespace
  const restaurantNs = io.of('/restaurant');
  restaurantNs.use(authMiddleware);
  restaurantNs.on('connection', (socket: AuthenticatedSocket) => {
    const user = (socket as any).user;
    
    if (user.role !== 'restaurant_owner' && user.role !== 'admin') {
      socket.disconnect();
      return;
    }

    const restaurantId = user.restaurant?.toString();
    if (!restaurantId) {
      socket.disconnect();
      return;
    }

    console.log(`Restaurant connected: ${restaurantId}`);
    
    socket.join(`restaurant:${restaurantId}`);

    socket.on('disconnect', () => {
      cleanupSocket(socket);
    });
  });

  // Admin namespace
  const adminNs = io.of('/admin');
  adminNs.use(authMiddleware);
  adminNs.on('connection', (socket: AuthenticatedSocket) => {
    const user = (socket as any).user;
    
    if (user.role !== 'admin') {
      socket.disconnect();
      return;
    }

    console.log(`Admin connected: ${socket.userId}`);
    
    socket.join('admin:all');

    socket.on('disconnect', () => {
      cleanupSocket(socket);
    });
  });

  function cleanupSocket(socket: AuthenticatedSocket): void {
    if (socket.userId) {
      const sockets = userSockets.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    }
    console.log(`Socket disconnected: ${socket.id} (user: ${socket.userId})`);
  }

  // Utility functions for emitting events
  io.emitToStudent = (userId: string, event: string, data: any) => {
    studentNs.to(`student:${userId}`).emit(event, data);
  };

  io.emitToCourier = (userId: string, event: string, data: any) => {
    courierNs.to(`courier:${userId}`).emit(event, data);
  };

  io.emitToRestaurant = (restaurantId: string, event: string, data: any) => {
    restaurantNs.to(`restaurant:${restaurantId}`).emit(event, data);
  };

  io.emitToOrder = (orderId: string, event: string, data: any) => {
    studentNs.to(`order:${orderId}`).emit(event, data);
    courierNs.to(`order:${orderId}`).emit(event, data);
    restaurantNs.to(`order:${orderId}`).emit(event, data);
  };

  io.emitToNearbyCouriers = (geohash: string, event: string, data: any) => {
    courierNs.to(`couriers:nearby:${geohash}`).emit(event, data);
  };

  io.emitToAdmins = (event: string, data: any) => {
    adminNs.to('admin:all').emit(event, data);
  };

  io.getCourierLocation = (courierId: string) => courierLocations.get(courierId) || null;
  io.isUserOnline = (userId: string) => userSockets.has(userId);

  return io;
}

export function getSocketIO(): SocketIOExtended | null {
  // This will be set after initSocket is called
  return (global as any).io || null;
}