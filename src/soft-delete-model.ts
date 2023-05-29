import { Document, SaveOptions } from "mongoose";
import * as mongoose from "mongoose";

export interface SoftDelete {
  isDeleted: boolean;
  deletedAt: Date | null;
}

export type SoftDeleteDocument = SoftDelete & Document;

export interface SoftDeleteModel<T extends Document> extends mongoose.Model<T> {
  findDeleted(): Promise<T[]>;

  /**
   * Finds the documents that matches the given query and restore them if `isDeleted` was set to true
  */
  restore(query: mongoose.FilterQuery<T>, orFail?: (e: Error) => unknown): Promise<{ restored: number }>;

  /**
   * Finds the document with the given ID and restores it if `isDeleted` was true
   */
  restoreById(id: string | mongoose.Types.ObjectId, orFail?: (e: Error) => unknown): Promise<void>;

  /**
   * Finds the documents with the given query and update the "isDeleted" & "deletedAt" properties
   * If no document is found it will return `{ deleted: 0 }`
  */
  softDelete(query: mongoose.FilterQuery<T>, orFail?: (e: Error) => unknown): Promise<{ deleted: number }>;

  /**
   * Finds one document with the given id and udpate if one exists and it has not been deleted yet
   */
  softDeleteById(id: string | mongoose.Types.ObjectId, orFail?: (e: Error) => unknown): Promise<void>;
}
