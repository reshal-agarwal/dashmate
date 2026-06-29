import { Router } from 'express';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { courierController } from '../controllers/courierController';
import { applyCourierSchema, pickupOrderSchema, deliverOrderSchema, cancelCourierOrderSchema, payoutRequestSchema } from '../validators/courier';

const router = Router();

router.post('/apply', authorize('student'), validate(applyCourierSchema), courierController.applyCourier);
router.get('/application', courierController.getApplication);

router.get('/dashboard', courierController.getDashboard);
router.put('/status', courierController.toggleOnline);
router.put('/location', courierController.updateLocation);

router.get('/orders/available', courierController.getAvailableOrders);
router.post('/orders/:id/accept', courierController.acceptOrder);
router.post('/orders/:id/pickup', validate(pickupOrderSchema), courierController.pickupOrder);
router.post('/orders/:id/deliver', validate(deliverOrderSchema), courierController.deliverOrder);
router.put('/orders/:id/cancel', validate(cancelCourierOrderSchema), courierController.cancelOrder);

router.get('/orders/active', courierController.getActiveOrder);
router.get('/orders/history', courierController.getOrderHistory);

router.get('/earnings', courierController.getEarnings);
router.post('/payout/request', validate(payoutRequestSchema), courierController.requestPayout);
router.get('/payout/history', courierController.getPayoutHistory);

router.get('/profile', courierController.getProfile);
router.put('/profile', courierController.updateProfile);

export default router;