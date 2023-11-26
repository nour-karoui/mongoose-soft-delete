import mongoose, { CallbackError, SaveOptions } from "mongoose";

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
    deletedBy: {
      type: String,
      default: null,
    },
  });

  // @ts-ignore
  schema.pre(
    "find",
    async function (this, next: (err?: CallbackError) => void) {
      if (this.getFilter().isDeleted === true) {
        return next();
      }
      this.setQuery({ ...this.getFilter(), isDeleted: { $ne: true } });
      next();
    }
  );

  // @ts-ignore
  schema.pre(
    "countDocuments",
    async function (this, next: (err?: CallbackError) => void) {
      if (this.getFilter().isDeleted === true) {
        return next();
      }
      this.setQuery({ ...this.getFilter(), isDeleted: { $ne: true } });
      next();
    }
  );

  // @ts-ignore
  schema.pre(
    "count" as any,
    async function (this, next: (err?: CallbackError) => void) {
      if (this.getFilter().isDeleted === true) {
        return next();
      }
      this.setQuery({ ...this.getFilter(), isDeleted: { $ne: true } });
      next();
    }
  );

  schema.static("findDeleted", async function () {
    return this.find({ isDeleted: true });
  });

  schema.static("findAll", async function () {
    return this.find({ $or: [{ isDeleted: true }, { isDeleted: false }] });
  });

  schema.static("restore", async function (query) {
    // add {isDeleted: true} because the method find is set to filter the non deleted documents only,
    // so if we don't add {isDeleted: true}, it won't be able to find it
    const updatedQuery = {
      ...query,
      isDeleted: true,
    };
    const deletedTemplates = await this.find(updatedQuery);
    if (!deletedTemplates) {
      return Error("element not found");
    }
    let restored = 0;
    for (const deletedTemplate of deletedTemplates) {
      if (deletedTemplate.isDeleted) {
        deletedTemplate.$isDeleted(false);
        deletedTemplate.isDeleted = false;
        deletedTemplate.deletedAt = null;
        deletedTemplate.deletedBy = null;
        await deletedTemplate
          .save()
          .then(() => restored++)
          .catch((e: mongoose.Error) => {
            throw new Error(e.name + " " + e.message);
          });
      }
    }
    return { restored };
  });

  schema.static("restoreById", async function (id) {
    // add {isDeleted: true} because the method find is set to filter the non deleted documents only,
    // so if we don't add {isDeleted: true}, it won't be able to find it
    const updatedQuery = {
      _id: id,
      isDeleted: true,
    };
    const deletedTemplates = await this.find(updatedQuery);
    if (!deletedTemplates) {
      return Error("element not found");
    }
    let restored = 0;
    for (const deletedTemplate of deletedTemplates) {
      if (deletedTemplate.isDeleted) {
        deletedTemplate.$isDeleted(false);
        deletedTemplate.isDeleted = false;
        deletedTemplate.deletedAt = null;
        deletedTemplate.deletedBy = null;
        await deletedTemplate
          .save()
          .then(() => restored++)
          .catch((e: mongoose.Error) => {
            throw new Error(e.name + " " + e.message);
          });
      }
    }
    return { restored };
  });

  schema.static(
    "softDelete",
    async function (query, options?: SaveOptions, deletedBy?: string) {
      const templates = await this.find(query);
      if (!templates) {
        return Error("Element not found");
      }
      let deleted = 0;
      for (const template of templates) {
        if (!template.isDeleted) {
          template.$isDeleted(true);
          template.isDeleted = true;
          template.deletedAt = new Date();
          template.deletedBy = deletedBy || null;
          await template
            .save(options)
            .then(() => deleted++)
            .catch((e: mongoose.Error) => {
              throw new Error(e.name + " " + e.message);
            });
        }
      }
      return { deleted };
    }
  );

  schema.static("softDeleteById", async function (id, deletedBy?: string) {
    const template = await this.findById(id);

    if (!template) {
      return new Error("Element not found");
    }
    if (!template.isDeleted) {
      template.$isDeleted(true);
      template.isDeleted = true;
      template.deletedAt = new Date();
      template.deletedBy = deletedBy || null;
      await template.save().catch((e: mongoose.Error) => {
        throw new Error(e.name + " " + e.message);
      });

      return { deleted: 1 };
    } else {
      return { deleted: 0, message: "Element already soft-deleted" };
    }
  });
};
