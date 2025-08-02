import mongoose, { Document, Schema, Types } from 'mongoose';
import { softDeletePlugin } from '../../src/soft-delete-plugin';
import { SoftDeleteModel } from '../../src/soft-delete-model';

export interface IComment extends Document {
  content: string;
  author: Types.ObjectId;
  post: Types.ObjectId;
  parentComment?: Types.ObjectId;
  likes: number;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
}

const CommentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});
CommentSchema.plugin(softDeletePlugin);

export const Comment = mongoose.model<IComment, SoftDeleteModel<IComment>>('Comment', CommentSchema); 