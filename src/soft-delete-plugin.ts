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

  schema.static('restore', async function (id) {
    const deletedTemplate = await this.findById(id);
    if (!deletedTemplate.isDeleted) {
      return deletedTemplate;
    }
    deletedTemplate.$isDeleted(false);
    deletedTemplate.isDeleted = false;
    deletedTemplate.deletedAt = null;
    return await deletedTemplate.save();
  });

  schema.static('softDelete', async function (id) {
    const template = await this.findById(id);
    if (template.isDeleted) {
      return template;
    }
    template.$isDeleted(true);
    template.isDeleted = true;
    template.deletedAt = new Date();
    return await template.save();
  });
};

