import mongoose, { CallbackError, MongooseQueryMiddleware, SaveOptions } from 'mongoose';
import { overwriteAggregatePipeline } from './utils';

const QUERY_HOOK_METHODS: MongooseQueryMiddleware[] = [
  'find',
  'findOne',
  'count',
  'countDocuments',
  'updateMany',
  'updateOne',
  'findOneAndUpdate',
  'distinct',
];

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

  // Add query middleware to filter out soft deleted documents
  QUERY_HOOK_METHODS.forEach(method => {
    schema.pre(method, function(next) {
      const filter = this.getFilter();
      if (filter.isDeleted === true) {
        return next();
      }
      // Modify the filter to exclude soft deleted documents
      const newFilter = { ...filter, isDeleted: { $ne: true } };
      this.setQuery(newFilter);
      next();
    });
  });

  schema.pre('aggregate', function (next) {
    if (this.options.skipHook) return next();
    overwriteAggregatePipeline(this.pipeline());
    next();
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
    if (!deletedTemplates || deletedTemplates.length === 0) {
      return { restored: 0 };
    }
    let restored = 0;
    for (const deletedTemplate of deletedTemplates) {
      if (deletedTemplate.isDeleted) {
        deletedTemplate.isDeleted = false;
        deletedTemplate.deletedAt = null;
        await deletedTemplate.save().then(() => restored++).catch((e: mongoose.Error) => { throw new Error(e.name + ' ' + e.message) });
      }
    }
    return { restored };
  });

  schema.static('softDelete', async function (query, options?: SaveOptions) {
    const templates = await this.find(query);
    if (!templates || templates.length === 0) {
      return { deleted: 0 };
    }
    let deleted = 0;
    for (const template of templates) {
      if (!template.isDeleted) {
        template.isDeleted = true;
        template.deletedAt = new Date();
        await template.save(options).then(() => deleted++).catch((e: mongoose.Error) => { throw new Error(e.name + ' ' + e.message) });
      }
    }
    return { deleted };
  });
};

