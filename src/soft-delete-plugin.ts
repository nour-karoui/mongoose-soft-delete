import mongoose, { MongooseQueryMiddleware, SaveOptions } from 'mongoose';
import { overwriteAggregatePipeline } from './utils';

const QUERY_HOOK_METHODS: MongooseQueryMiddleware[] = [
  'find',
  'findOne',
  'countDocuments',
  'updateMany',
  'updateOne',
  'findOneAndUpdate',
  'distinct',
];

// Mongoose 8 removed Query.prototype.count. Keep the hook for mongoose 7.
if (typeof (mongoose.Query.prototype as any).count === 'function') {
  QUERY_HOOK_METHODS.push('count' as MongooseQueryMiddleware);
}

export const softDeletePlugin = (schema: mongoose.Schema) => {
  schema.add({
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  });

  // Mongoose 9 does not give a next() callback to pre middleware.
  schema.pre(QUERY_HOOK_METHODS, function () {
    if (this.getFilter().isDeleted === true) {
      return;
    }
    this.setQuery({ ...this.getFilter(), isDeleted: { $ne: true } });
  });

  schema.pre('aggregate', function () {
    if (this.options.skipHook) return;
    overwriteAggregatePipeline(this.pipeline());
  });

  schema.static('findDeleted', async function () {
    return this.find({ isDeleted: true });
  });

  schema.static('restore', async function (query) {

    // add {isDeleted: true} because the method find is set to filter the non deleted documents only,
    // so if we don't add {isDeleted: true}, it won't be able to find it
    const updatedQuery = {
      ...query,
      isDeleted: true
    };
    const deletedTemplates = await this.find(updatedQuery);
    if (!deletedTemplates) {
      return Error('element not found');
    }
    let restored = 0;
    for (const deletedTemplate of deletedTemplates) {
      if (deletedTemplate.isDeleted) {
        deletedTemplate.$isDeleted(false);
        deletedTemplate.isDeleted = false;
        deletedTemplate.deletedAt = null;
        await deletedTemplate.save().then(() => restored++).catch((e: mongoose.Error) => { throw new Error(e.name + ' ' + e.message) });
      }
    }
    return { restored };
  });

  schema.static('softDelete', async function (query, options?: SaveOptions) {
    const templates = await this.find(query);
    if (!templates) {
      return Error('Element not found');
    }
    let deleted = 0;
    for (const template of templates) {
      if (!template.isDeleted) {
        template.$isDeleted(true);
        template.isDeleted = true;
        template.deletedAt = new Date();
        await template.save(options).then(() => deleted++).catch((e: mongoose.Error) => { throw new Error(e.name + ' ' + e.message) });
      }
    }
    return { deleted };
  });
};

