import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  restaurant: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  price: number;
  originalPrice?: number;
  images: string[];
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  spiceLevel: 0 | 1 | 2 | 3;
  preparationTime: number;
  stock: number;
  soldCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, minlength: 1, maxlength: 100 },
  description: { type: String, maxlength: 1000 },
  category: { type: String, required: true, minlength: 1, maxlength: 50 },
  price: { type: Number, required: true, min: 0, max: 10000 },
  originalPrice: { type: Number, min: 0, max: 10000 },
  images: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  spiceLevel: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  preparationTime: { type: Number, default: 10, min: 1, max: 120 },
  stock: { type: Number, default: -1, min: -1 },
  soldCount: { type: Number, default: 0 },
  tags: [{ type: String }],
}, { timestamps: true });

productSchema.index({ restaurant: 1, isAvailable: 1 });
productSchema.index({ restaurant: 1, category: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);