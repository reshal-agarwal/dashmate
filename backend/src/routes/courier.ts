import { Router } from 'express';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import { courierController } from '../controllers/courierController';

const router = Router();

router.get('/dashboard', courierController.getDashboard);
router.put('/status', courierController.toggleOnline);
router.put('/location', courierController.updateLocation);

router.get('/orders/available', courierController.getAvailableOrders);
router.post('/orders/:id/accept', courierController.acceptOrder);
router.post('/orders/:id/pickup', courierController.pickupOrder);
router.post('/orders/:id/deliver', courierController.deliverOrder);
router.put('/orders/:id/cancel', courierController.cancelOrder);

router.get('/orders/active', courierController.getActiveOrder);
router.get('/orders/history', courierController.getOrderHistory);

router.get('/earnings', courierController.getEarnings);
router.post('/payout/request', courierController.requestPayout);
router.get('/payout/history', courierController.getPayoutHistory);

router.get('/profile', courierController.getProfile);
router.put('/profile', courierController.updateProfile);

export default router;