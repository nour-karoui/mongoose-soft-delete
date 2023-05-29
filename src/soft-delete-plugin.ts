import mongoose, { CallbackError, FilterQuery } from 'mongoose';
import { SoftDeleteModel } from './soft-delete-model';

type Model = SoftDeleteModel<mongoose.Document>;
export function softDeletePlugin<T extends mongoose.Schema>(schema: T) {
  schema.add({
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: () => new Date(),
    },
  });

  // @ts-ignore
  schema.pre('find',
    async function(this, next: (err?: CallbackError) => void) {
      if (this.getFilter().isDeleted === true) {
        return next();
      }
      this.setQuery({ ...this.getFilter(), isDeleted: { $ne: true } });
      next();
    },
  );

  // @ts-ignore
  schema.pre('count',
    async function(this, next: (err?: CallbackError) => void) {
      if (this.getFilter().isDeleted === true) {
        return next();
      }
      this.setQuery({ ...this.getFilter(), isDeleted: { $ne: true } });
      next();
    })

  // @ts-ignore
  schema.pre('countDocuments',
    async function(this, next: (err?: CallbackError) => void) {
      if (this.getFilter().isDeleted === true) {
        return next();
      }
      this.setQuery({ ...this.getFilter(), isDeleted: { $ne: true } });
      next();
    })

  schema.static('findDeleted', function() {
    return this.find({ isDeleted: true }).exec();
  });

  schema.static('restore', async function(query: FilterQuery<T>, orFail?: (e: Error) => unknown) {
    const findDeletedDocsQuery = {
      isDeleted: true,
      ...query,
    };
    const { modifiedCount } = await this.updateMany(findDeletedDocsQuery, {
      $set: {
        isDeleted: false,
        deletedAt: null
      }
    }).orFail(orFail).exec();


    return { restored: modifiedCount };
  });

  schema.static('softDelete', async function(query, orFail?: (e: Error) => unknown) {
    const queryFilter = {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
        { isDeleted: null }
      ],
      ...query,
    };

    console.log(queryFilter)

    const { modifiedCount } = await this.updateMany(queryFilter, {
      $set: {
        isDeleted: true,
        deletedAt: new Date()
      }
    }).orFail(orFail).exec();

    return {
      deleted: modifiedCount
    };
  });

  schema.static('softDeleteById', async function(id: string | mongoose.Types.ObjectId, orFail?: (e: Error) => unknown) {
    await (this as Model).softDelete(
      { _id: new mongoose.Types.ObjectId(id) },
      orFail
    )
  });

  schema.static('restoreById', async function(id: string | mongoose.Types.ObjectId, orFail?: (e: Error) => unknown) {
    await (this as Model).restore(
      { _id: new mongoose.Types.ObjectId(id) },
      orFail
    )
  });

};

