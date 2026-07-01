'use client';

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

let studentSocket: Socket | null = null;
let courierSocket: Socket | null = null;
let restaurantSocket: Socket | null = null;
let adminSocket: Socket | null = null;

function createSocket(namespace: string, token: string): Socket {
  return io(`${WS_URL}${namespace}`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
}

export function connectSockets(token: string, role: string) {
  disconnectSockets();

  studentSocket = createSocket('/student', token);
  studentSocket.on('connect', () => console.log(`[Socket] Student connected`));
  studentSocket.on('connect_error', (err) => console.error('[Socket] Student error:', err.message));

  if (role === 'courier') {
    courierSocket = createSocket('/courier', token);
    courierSocket.on('connect', () => console.log(`[Socket] Courier connected`));
  }

  if (role === 'restaurant_owner') {
    restaurantSocket = createSocket('/restaurant', token);
    restaurantSocket.on('connect', () => console.log(`[Socket] Restaurant connected`));
  }

  if (role === 'admin') {
    adminSocket = createSocket('/admin', token);
    adminSocket.on('connect', () => console.log(`[Socket] Admin connected`));
  }
}

export function disconnectSockets() {
  studentSocket?.disconnect();
  courierSocket?.disconnect();
  restaurantSocket?.disconnect();
  adminSocket?.disconnect();
  studentSocket = null;
  courierSocket = null;
  restaurantSocket = null;
  adminSocket = null;
}

export function getStudentSocket(): Socket | null {
  return studentSocket;
}

export function getCourierSocket(): Socket | null {
  return courierSocket;
}

export function getRestaurantSocket(): Socket | null {
  return restaurantSocket;
}

export function getAdminSocket(): Socket | null {
  return adminSocket;
}

export function subscribeToOrder(orderId: string) {
  studentSocket?.emit('order:subscribe', orderId);
}

export function unsubscribeFromOrder(orderId: string) {
  studentSocket?.emit('order:unsubscribe', orderId);
}
