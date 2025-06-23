import mongoose, { Document, Schema } from 'mongoose';
import { softDeletePlugin } from '../../src/soft-delete-plugin';
import { SoftDeleteModel } from '../../src/soft-delete-model';

export interface IUser extends Document {
  name: string;
  email: string;
  age: number;
  isDeleted: boolean;
  deletedAt: Date | null;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true,
});
UserSchema.plugin(softDeletePlugin);

export const User = mongoose.model<IUser, SoftDeleteModel<IUser>>('User', UserSchema); 