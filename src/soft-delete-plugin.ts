import mongoose, { CallbackError } from 'mongoose';

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

  // @ts-ignore
  schema.pre('find',
    async function (this, next: (err?: CallbackError) => void) {
      if (this.getFilter().isDeleted === true) {
        return next();
      }
      this.setQuery({ ...this.getFilter(), isDeleted: false });
      next();
    },
  );

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
    const deletedTemplate = await this.find(updatedQuery);
    if (!deletedTemplate) {
      return Error('element not found');
    }
    if (!deletedTemplate.isDeleted) {
      return deletedTemplate;
    }
    deletedTemplate.$isDeleted(false);
    deletedTemplate.isDeleted = false;
    deletedTemplate.deletedAt = null;
    return await deletedTemplate.save();
  });

  schema.static('softDelete', async function (query) {
    const template = await this.find(query);
    if (!template) {
      return Error('Element not found');
    }
    if (template.isDeleted) {
      return template;
    }
    template.$isDeleted(true);
    template.isDeleted = true;
    template.deletedAt = new Date();
    return await template.save();
  });
};

