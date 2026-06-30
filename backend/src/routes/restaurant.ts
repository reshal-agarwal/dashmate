import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { restaurantController } from '../controllers/restaurantController';

const router = Router();

router.use(protect, authorize('restaurant_owner', 'admin'));

router.get('/dashboard', restaurantController.getDashboard);
router.get('/profile', restaurantController.getProfile);
router.put('/profile', restaurantController.updateProfile);

router.post('/upload', restaurantController.uploadImage);

router.get('/products', restaurantController.getProducts);
router.post('/products', restaurantController.createProduct);
router.get('/products/:id', restaurantController.getProduct);
router.put('/products/:id', restaurantController.updateProduct);
router.delete('/products/:id', restaurantController.deleteProduct);
router.put('/products/:id/toggle', restaurantController.toggleProduct);
router.post('/products/bulk-toggle', restaurantController.bulkToggleProducts);

router.get('/orders', restaurantController.getOrders);
router.get('/orders/:id', restaurantController.getOrder);
router.put('/orders/:id/confirm', restaurantController.confirmOrder);
router.put('/orders/:id/start-prep', restaurantController.startPrep);
router.put('/orders/:id/ready', restaurantController.markReady);
router.put('/orders/:id/cancel', restaurantController.cancelOrder);

router.get('/analytics', restaurantController.getAnalytics);
router.get('/payouts/history', restaurantController.getPayoutHistory);
router.post('/payouts/request', restaurantController.requestPayout);

export default router;