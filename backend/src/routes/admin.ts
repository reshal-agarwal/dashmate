import { Router } from 'express';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import { adminController } from '../controllers/adminController';

const router = Router();

router.get('/dashboard', adminController.getDashboard);

router.get('/restaurants', adminController.getRestaurants);
router.post('/restaurants', adminController.createRestaurant);
router.get('/restaurants/:id', adminController.getRestaurant);
router.put('/restaurants/:id', adminController.updateRestaurant);
router.put('/restaurants/:id/verify', adminController.verifyRestaurant);
router.delete('/restaurants/:id', adminController.deleteRestaurant);

router.get('/couriers', adminController.getCouriers);
router.get('/couriers/:id', adminController.getCourier);
router.put('/couriers/:id/verify', adminController.verifyCourier);
router.put('/couriers/:id/toggle', adminController.toggleCourier);

router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrder);
router.put('/orders/:id/refund', adminController.refundOrder);

router.get('/disputes', adminController.getDisputes);
router.put('/disputes/:id/resolve', adminController.resolveDispute);

router.get('/withdrawals', adminController.getWithdrawals);
router.put('/withdrawals/:id/process', adminController.processWithdrawal);

router.post('/coupons', adminController.createCoupon);
router.get('/coupons', adminController.getCoupons);
router.put('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

router.get('/analytics', adminController.getAnalytics);
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

export default router;