import mongoose, { PipelineStage } from "mongoose";
import { SoftDeleteModel, softDeletePlugin } from "../src";
import { overwriteAggregatePipeline } from "../src/utils";

//post model
interface Post extends mongoose.Document {
  title: string;
}
const postSchema = new mongoose.Schema({
    title: String,
  });
postSchema.plugin(softDeletePlugin);
const postModel = mongoose.model<Post, SoftDeleteModel<Post>>('Post', postSchema);

//comment model
interface Comment extends mongoose.Document {
  content: string;
  postId: string;
}
const commentSchema = new mongoose.Schema({
  content: String,
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  }
});
commentSchema.plugin(softDeletePlugin);

describe('utils', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test?directConnection=true');
  });
  it('should overwrite match stage with isDeleted query', () => {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          user: '123',
        }
      }
    ]
    const result = overwriteAggregatePipeline(pipeline);
    expect(result).toEqual([
      {
        $match: {
          user: '123',
          isDeleted: false,
        }
      }
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  })
});

