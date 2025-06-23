import mongoose, { Document, Schema, Types } from 'mongoose';
import { softDeletePlugin } from '../../src/soft-delete-plugin';
import { SoftDeleteModel } from '../../src/soft-delete-model';

export interface IPost extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  tags: string[];
  likes: number;
  isPublished: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
}

const PostSchema = new Schema<IPost>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});
PostSchema.plugin(softDeletePlugin);

export const Post = mongoose.model<IPost, SoftDeleteModel<IPost>>('Post', PostSchema); 