import mongoose from 'mongoose';
import { User } from './models';


describe('soft delete plugin', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://0.0.0.0:27017/test');
  })

  afterAll(async () => {
    await User.deleteMany();
    await mongoose.disconnect();
  })

  beforeEach(async () => {
    await User.deleteMany();
  });


  test('softDelete should be successed', async () => {
    // create one user
    const user = await new User({ name: 'peter', age: 20, email: 'peter@gmail.com' }).save();
    expect(user.name).toBe('peter');

    // get this user before we perform soft delete
    const userBeforeDelete = await User.find({ _id: user._id });
    expect(userBeforeDelete?.length).toBe(1);

    // perform soft delete
    const softDeleteResp = await User.softDelete({ _id: user._id });
    expect(softDeleteResp.deleted).toBe(1);

    // get this user after we performed soft delete
    const userAfterDelete = await User.find({ _id: user._id });
    expect(userAfterDelete?.length).toBe(0);
    
    const usersCount = await User.countDocuments();
    expect(usersCount).toBe(0);

    //soft deleted documents should not be updated by updateOne
    const updatedUser = await User.updateOne({ _id: user._id }, { $set: { name: 'james' } });
    expect(updatedUser.modifiedCount).toBe(0);

    //soft deleted documents should not be updated by updateMany
    const updatedUsers = await User.updateMany({ _id: user._id }, { $set: { name: 'james2' } });
    expect(updatedUsers.modifiedCount).toBe(0);

    const allUserIds = await User.distinct('_id');
    expect(allUserIds.length).toBe(0);

    const allUserIdsWithDeleted = await User.distinct('_id', { isDeleted: true });
    expect(allUserIdsWithDeleted.length).toBe(1);
  });

  test('restore should be successed', async () => {
    // create one user
    const user = await new User({ name: 'peter', age: 20, email: 'peter@gmail.com' }).save();
    expect(user.name).toBe('peter');

    // perform soft delete
    const softDeleteResp = await User.softDelete({ _id: user._id });
    expect(softDeleteResp.deleted).toBe(1);

    // get this user after we performed soft delete
    const userAfterDelete = await User.find({ _id: user._id });
    expect(userAfterDelete?.length).toBe(0);

    // restore this user
    const restoreResp = await User.restore({ _id: user._id });
    expect(restoreResp.restored).toBe(1);

    // get this user after we perform restore
    const userAfterRestore = await User.find({ _id: user._id });
    expect(userAfterRestore?.length).toBe(1);
  });

  test('findDeleted should be successed', async () => {
    // create one user
    const user = await new User({ name: 'peter', age: 20, email: 'peter@gmail.com' }).save();
    expect(user.name).toBe('peter');

    // perform soft delete
    const softDeleteResp = await User.softDelete({ _id: user._id });
    expect(softDeleteResp.deleted).toBe(1);

    // get this user after we performed soft delete
    const userAfterDelete = await User.find({ _id: user._id });
    expect(userAfterDelete?.length).toBe(0);

    // get soft deleted user
    const deletedUsers = await User.findDeleted();
    expect(deletedUsers.length).toBe(1);
  });

  test('updateMany should be successed', async () => {
    // create one user
    const user = await new User({ name: 'peter', age: 20, email: 'peter@gmail.com' }).save();
    expect(user.name).toBe('peter');

    // update many
    const updateResp = await User.updateMany({ name: 'peter' }, { $set: { name: 'james' } });
    expect(updateResp.modifiedCount).toBe(1);

    // get updated user
    const updatedUser = await User.find({ name: 'james' });
    expect(updatedUser.length).toBe(1);
  });
});

