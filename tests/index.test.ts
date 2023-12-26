import mongoose from "mongoose";
import { softDeletePlugin, SoftDeleteModel } from "../src/index";

interface User extends mongoose.Document {
  name: string;
}
const UserSchema = new mongoose.Schema({
  name: String,
});
UserSchema.plugin(softDeletePlugin);
const userModel = mongoose.model<User, SoftDeleteModel<User>>(
  "User",
  UserSchema
);

describe("soft delete plugin", () => {
  beforeAll(async () => {
    const url = "'mongodb://0.0.0.0:27017/test'";
    await mongoose.connect(url);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await userModel.deleteMany();
  });

  test("softDelete should be successed", async () => {
    // create one user
    const user = await new userModel({ name: "peter" }).save();
    expect(user.name).toBe("peter");

    // get this user before we perform soft delete
    const userBeforeDelete = await userModel.find({ _id: user._id });
    expect(userBeforeDelete?.length).toBe(1);

    // perform soft delete
    const softDeleteResp = await userModel.softDelete({ _id: user._id });
    expect(softDeleteResp.deleted).toBe(1);

    // get this user after we performed soft delete
    const userAfterDelete = await userModel.find({ _id: user._id });
    expect(userAfterDelete?.length).toBe(0);
  });

  test("softDelete should be successed on findOne", async () => {
    // create one user
    const user = await new userModel({ name: "peter" }).save();
    expect(user.name).toBe("peter");

    // get this user before we perform soft delete
    const userBeforeDelete = await userModel.findOne({ _id: user._id });
    expect(userBeforeDelete?.name).toBe("peter");

    // perform soft delete
    const softDeleteResp = await userModel.softDelete({ _id: user._id });
    expect(softDeleteResp.deleted).toBe(1);

    // get this user after we performed soft delete
    const userAfterDelete = await userModel.findOne({ _id: user._id });
    expect(userAfterDelete).toBe(null);
  });

  test("softDelete should be successed on findOneAndUpdate", async () => {
    // create one user
    const user = await new userModel({ name: "peter" }).save();
    expect(user.name).toBe("peter");

    // get this user before we perform soft delete
    const userBeforeDelete = await userModel.findOneAndUpdate(
      { _id: user._id },
      { name: "mahdad" },
      { new: true }
    );
    expect(userBeforeDelete?.name).toBe("mahdad");

    // perform soft delete
    const softDeleteResp = await userModel.softDelete({ _id: user._id });
    expect(softDeleteResp.deleted).toBe(1);

    // get this user after we performed soft delete
    const userAfterDelete = await userModel.findOneAndUpdate(
      { _id: user._id },
      { name: "mahdad" }
    );
    expect(userAfterDelete).toBe(null);
  });

  test("restore should be successed", async () => {
    // create one user
    const user = await new userModel({ name: "peter" }).save();
    expect(user.name).toBe("peter");

    // perform soft delete
    const softDeleteResp = await userModel.softDelete({ _id: user._id });
    expect(softDeleteResp.deleted).toBe(1);

    // get this user after we performed soft delete
    const userAfterDelete = await userModel.find({ _id: user._id });
    expect(userAfterDelete?.length).toBe(0);

    // restore this user
    const restoreResp = await userModel.restore({ _id: user._id });
    expect(restoreResp.restored).toBe(1);

    // get this user after we perform restore
    const userAfterRestore = await userModel.find({ _id: user._id });
    expect(userAfterRestore?.length).toBe(1);
  });

  test("findDeleted should be successed", async () => {
    // create one user
    const user = await new userModel({ name: "peter" }).save();
    expect(user.name).toBe("peter");

    // perform soft delete
    const softDeleteResp = await userModel.softDelete({ _id: user._id });
    expect(softDeleteResp.deleted).toBe(1);

    // get this user after we performed soft delete
    const userAfterDelete = await userModel.find({ _id: user._id });
    expect(userAfterDelete?.length).toBe(0);

    // get soft deleted user
    const deletedUsers = await userModel.findDeleted();
    expect(deletedUsers.length).toBe(1);
  });
});
