import { Document, SaveOptions } from "mongoose";
import * as mongoose from "mongoose";

export interface SoftDeleteModel<T extends Document> extends mongoose.Model<T> {
  findDeleted(): Promise<T[]>;
  restore(query: Record<string, any>): Promise<{ restored: number }>;
  restoreById(id: Record<string, any>): Promise<{ restored: number }>;
  softDelete(
    query: Record<string, any>,
    options?: SaveOptions,
    deletedBy?: string
  ): Promise<{ deleted: number }>;
  softDeleteById(
    id: Record<string, any>,
    deletedBy?: string
  ): Promise<{ deleted: number }>;
}
