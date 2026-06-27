import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawalRequest extends Document {
  user: mongoose.Types.ObjectId;
  type: 'courier' | 'restaurant';
  amount: number;
  bankDetails: {
    upiId?: string;
    accountNumber?: string;
    ifsc?: string;
    accountHolderName?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawalRequest>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['courier', 'restaurant'], required: true },
  amount: { type: Number, required: true, min: 100 },
  bankDetails: {
    upiId: { type: String, match: /^[\w.-]+@[\w.-]+$/ },
    accountNumber: String,
    ifsc: String,
    accountHolderName: String,
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' },
  processedAt: Date,
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String, maxlength: 500 },
}, { timestamps: true });

withdrawalSchema.index({ user: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: 1 });

export const WithdrawalRequest = mongoose.model<IWithdrawalRequest>('WithdrawalRequest', withdrawalSchema);