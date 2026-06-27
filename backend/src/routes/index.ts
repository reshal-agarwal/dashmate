import authRoutes from './auth';
import studentRoutes from './student';
import courierRoutes from './courier';
import restaurantRoutes from './restaurant';
import adminRoutes from './admin';

import { Router } from 'express';

const router = Router();

router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/courier', courierRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

export default router;