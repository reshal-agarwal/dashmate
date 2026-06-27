import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType = 
  | 'wallet_topup'
  | 'wallet_deduction'
  | 'wallet_refund'
  | 'credits_earned'
  | 'credits_spent'
  | 'credits_expired'
  | 'courier_earning'
  | 'courier_payout'
  | 'restaurant_payout'
  | 'platform_fee'
  | 'referral_bonus'
  | 'first_order_bonus';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  creditsBalanceAfter?: number;
  reference: {
    id: mongoose.Types.ObjectId;
    model: 'Order' | 'User' | 'Coupon' | 'ManualPayout' | 'WithdrawalRequest';
  };
  description: string;
  status: 'completed' | 'failed' | 'reversed';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'wallet_topup', 'wallet_deduction', 'wallet_refund',
      'credits_earned', 'credits_spent', 'credits_expired',
      'courier_earning', 'courier_payout', 'restaurant_payout',
      'platform_fee', 'referral_bonus', 'first_order_bonus'
    ],
    required: true,
  },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  creditsBalanceAfter: Number,
  reference: {
    id: { type: Schema.Types.ObjectId, required: true },
    model: { type: String, enum: ['Order', 'User', 'Coupon', 'ManualPayout', 'WithdrawalRequest'], required: true },
  },
  description: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ['completed', 'failed', 'reversed'], default: 'completed' },
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ 'reference.id': 1, 'reference.model': 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);