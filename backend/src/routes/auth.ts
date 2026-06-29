import { Router } from 'express';
import { validateBody } from '../middleware/validate';
import { registerSchema, verifyOtpSchema, loginSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } from '../validators';
import { protect } from '../middleware/auth';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/verify-otp', validateBody(verifyOtpSchema), authController.verifyOtp);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/resend-otp', validateBody(resendOtpSchema), authController.resendOtp);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

router.get('/me', protect, authController.getMe);
router.put('/profile', protect, validateBody(updateProfileSchema), authController.updateProfile);
router.get('/courier-status', protect, authController.getCourierStatus);

export default router;