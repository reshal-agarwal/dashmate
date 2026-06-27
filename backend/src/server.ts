import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { config } from './config';
import { initSocket } from './socket';
import { initCronJobs } from './jobs';
import { initRedis } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { protect } from './middleware/auth';
import authRoutes from './routes/auth';
import studentRoutes from './routes/student';
import courierRoutes from './routes/courier';
import restaurantRoutes from './routes/restaurant';
import adminRoutes from './routes/admin';

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', protect, studentRoutes);
app.use('/api/v1/courier', protect, courierRoutes);
app.use('/api/v1/restaurant', protect, restaurantRoutes);
app.use('/api/v1/admin', protect, adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    if (config.redis.url) {
      await initRedis(config.redis.url);
      console.log('Connected to Redis');
    }

    initSocket(httpServer);
    console.log('Socket.io initialized');

    initCronJobs();

    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Frontend URL: ${config.frontendUrl}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  httpServer.close();
  process.exit(0);
});