import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { Request } from 'express';

let redisClient: ReturnType<typeof createClient> | null = null;

export const initRedis = async (url: string): Promise<void> => {
  redisClient = createClient({ url });
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  await redisClient.connect();
};

export const getRedisClient = (): ReturnType<typeof createClient> | null => redisClient;

const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) => {
  const store = redisClient 
    ? new RedisStore({
        sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
      })
    : undefined;

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: options.message,
        requestId: '',
      },
      meta: { timestamp: new Date().toISOString() },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || 'unknown'),
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    store,
    handler: (req, res) => {
      const requestId = req.headers['x-request-id'] as string || 
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: options.message,
          requestId,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    },
  });
};

export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests, please try again later',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again later',
});

export const userRateLimiter = (max: number, windowMs: number, message: string) =>
  createRateLimiter({
    windowMs,
    max,
    message,
    keyGenerator: (req) => (req as any).user?._id?.toString() || req.ip || 'unknown',
  });

export const orderRateLimiter = userRateLimiter(10, 60 * 1000, 'Too many orders placed');
export const courierActionRateLimiter = userRateLimiter(20, 60 * 1000, 'Too many courier actions');
export const creditConversionRateLimiter = userRateLimiter(5, 60 * 1000, 'Too many credit conversions');
export const apiWriteRateLimiter = userRateLimiter(50, 60 * 1000, 'Too many write operations');