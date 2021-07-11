import {Document, SaveOptions} from "mongoose";
import * as mongoose from "mongoose";

export interface SoftDeleteModel<T extends Document> extends mongoose.Model<T> {
  findDeleted(): T[];
  restore(query: Record<string, any>): { restored: number };
  softDelete(query: Record<string, any>, options?: SaveOptions): { deleted: number };
}
