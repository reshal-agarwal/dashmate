import { Request, Response } from 'express';
import { User, IUser } from '../models/userModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import { config } from '../config';
import { AppError, UnauthorizedError, ConflictError } from '../utils/errors';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

const sendSms = async (phone: string, otp: string): Promise<boolean> => {
  console.log(`--- SMS ---`);
  console.log(`To: ${phone}`);
  console.log(`OTP: ${otp}`);
  console.log(`-----------`);
  return true;
};

const createToken = (userId: string): string => {
  return jwt.sign(
    { user: { id: userId } },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );
};

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const { registerNumber, phone, name, password, roomNumber, hostelBlock } = req.body;

    const existingUser = await User.findOne({ $or: [{ phone }, { registerNumber }] });
    
    if (existingUser && existingUser.isVerified) {
      throw new ConflictError('User already exists with this phone or register number');
    }

    const otp = otpGenerator.generate(6, { 
      upperCaseAlphabets: false, 
      specialChars: false,
      lowerCaseAlphabets: false 
    });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (existingUser && !existingUser.isVerified) {
      existingUser.registerNumber = registerNumber;
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.roomNumber = roomNumber;
      existingUser.hostelBlock = hostelBlock;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      user = await existingUser.save();
    } else {
      user = await User.create({
        registerNumber,
        phone,
        name,
        password: hashedPassword,
        roomNumber,
        hostelBlock,
        otp,
        otpExpires,
        isVerified: false,
      });
    }

    await sendSms(phone, otp);

    res.status(201).json({
      success: true,
      data: { message: 'User registered. OTP sent to your phone.' },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone }) as any;
    if (!user) throw new AppError('NOT_FOUND', 'User not found');
    
    if (user.isVerified) throw new AppError('CONFLICT', 'User already verified');
    
    if (user.otp !== otp) throw new AppError('VALIDATION_ERROR', 'Invalid OTP');
    
    if (user.otpExpires && new Date() > user.otpExpires) {
      throw new AppError('VALIDATION_ERROR', 'OTP expired. Please register again.');
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.creditsLastActivityAt = new Date();
    await user.save();

    const userId = user._id.toString();
    const token = createToken(userId);

    res.json({
      success: true,
      data: {
        message: 'Phone verified successfully!',
        token,
        user: {
          id: userId,
          name: user.name,
          registerNumber: user.registerNumber,
          role: user.role,
          walletBalance: user.walletBalance,
          creditsBalance: user.creditsBalance,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { registerNumber, password } = req.body;

    const user = await User.findOne({ registerNumber }).select('+password') as any;
    if (!user) throw new UnauthorizedError('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedError('Invalid credentials');

    if (!user.isVerified) {
      throw new UnauthorizedError('Account not verified. Please verify your phone number.');
    }

    const userId = user._id.toString();
    const token = createToken(userId);

    res.json({
      success: true,
      data: {
        message: 'Logged in successfully!',
        token,
        user: {
          id: userId,
          name: user.name,
          registerNumber: user.registerNumber,
          role: user.role,
          walletBalance: user.walletBalance,
          creditsBalance: user.creditsBalance,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    const { phone } = req.body;

    const user = await User.findOne({ phone }) as any;
    if (!user) throw new AppError('NOT_FOUND', 'User not found');
    
    if (user.isVerified) throw new AppError('CONFLICT', 'User already verified');

    const otp = otpGenerator.generate(6, { 
      upperCaseAlphabets: false, 
      specialChars: false,
      lowerCaseAlphabets: false 
    });
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendSms(phone, otp);

    res.json({
      success: true,
      data: { message: 'New OTP sent to your phone.' },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { phone } = req.body;

    const user = await User.findOne({ phone }) as any;
    if (!user) {
      res.json({
        success: true,
        data: { message: 'If the phone number exists, an OTP has been sent.' },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }

    const otp = otpGenerator.generate(6, { 
      upperCaseAlphabets: false, 
      specialChars: false,
      lowerCaseAlphabets: false 
    });
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendSms(phone, otp);

    res.json({
      success: true,
      data: { message: 'Password reset OTP sent.' },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { phone, otp, newPassword } = req.body;

    const user = await User.findOne({ phone }).select('+password') as any;
    if (!user) throw new AppError('NOT_FOUND', 'User not found');
    
    if (user.otp !== otp) throw new AppError('VALIDATION_ERROR', 'Invalid OTP');
    
    if (user.otpExpires && new Date() > user.otpExpires) {
      throw new AppError('VALIDATION_ERROR', 'OTP expired');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      data: { message: 'Password reset successfully.' },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          registerNumber: user.registerNumber,
          phone: user.phone,
          name: user.name,
          role: user.role,
          roomNumber: user.roomNumber,
          hostelBlock: user.hostelBlock,
          walletBalance: user.walletBalance,
          creditsBalance: user.creditsBalance,
          pointsBalance: user.pointsBalance,
          courier: user.courier,
          restaurant: user.restaurant,
          preferences: user.preferences,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, roomNumber, hostelBlock, preferences } = req.body;
    const user = req.user!;

    if (name) user.name = name;
    if (roomNumber !== undefined) user.roomNumber = roomNumber;
    if (hostelBlock !== undefined) user.hostelBlock = hostelBlock;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          roomNumber: user.roomNumber,
          hostelBlock: user.hostelBlock,
          preferences: user.preferences,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  async applyCourier(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { vehicleType, vehicleNumber, licenseNumber, kycDocuments } = req.body;
    const user = req.user!;

    if (user.role === 'courier' && user.courier?.kycStatus === 'pending') {
      throw new ConflictError('Courier application already pending');
    }

    if (user.role === 'courier' && user.courier?.kycStatus === 'approved') {
      throw new ConflictError('Already an approved courier');
    }

    user.role = 'courier';
    user.courier = {
      isVerified: false,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      kycStatus: 'pending',
      kycDocuments,
      bankDetails: {},
      rating: 5.0,
      totalDeliveries: 0,
      cancelledDeliveries: 0,
      isOnline: false,
      earningsToday: 0,
      earningsThisWeek: 0,
      earningsTotal: 0,
    };
    await user.save();

    res.json({
      success: true,
      data: { message: 'Courier application submitted. Awaiting admin verification.' },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  async getCourierStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    
    res.json({
      success: true,
      data: {
        isCourier: user.role === 'courier',
        kycStatus: user.courier?.kycStatus || 'none',
        isVerified: user.courier?.isVerified || false,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
}