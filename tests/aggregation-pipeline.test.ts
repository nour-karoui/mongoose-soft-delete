import mongoose, { PipelineStage } from 'mongoose';
import { User, Post, Comment, IUser, IPost, IComment } from './models';
import { overwriteAggregatePipeline } from '../src/utils';

describe('Aggregation Pipeline Soft Delete Tests', () => {
  let testUser1: IUser;
  let testUser2: IUser;
  let testPost1: IPost;
  let testPost2: IPost;
  let testComment1: IComment;
  let testComment2: IComment;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/test?directConnection=true');
  });

  beforeEach(async () => {
    // Clean up collections
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});

    // Create test users
    testUser1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    });

    testUser2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      age: 25,
    });

    // Create test posts
    testPost1 = await Post.create({
      title: 'First Post',
      content: 'This is the first post content',
      author: testUser1._id,
      tags: ['tech', 'programming'],
      isPublished: true,
    });

    testPost2 = await Post.create({
      title: 'Second Post',
      content: 'This is the second post content',
      author: testUser2._id,
      tags: ['lifestyle', 'travel'],
      isPublished: true,
    });

    // Create test comments
    testComment1 = await Comment.create({
      content: 'Great post!',
      author: testUser2._id,
      post: testPost1._id,
    });

    testComment2 = await Comment.create({
      content: 'Thanks for sharing',
      author: testUser1._id,
      post: testPost2._id,
    });
  });

  afterAll(async () => {
    await User.deleteMany();
    await Post.deleteMany();
    await Comment.deleteMany();
    await mongoose.disconnect();
  });

  describe('$lookup with soft deleted documents', () => {
    it('should filter out soft deleted users from post aggregation', async () => {
      // Soft delete one user
      await User.softDelete({ _id: testUser1._id });

      // Aggregate posts with their authors
      const postsWithAuthors = await Post.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorDetails',
          },
        },
        {
          $project: {
            title: 1,
            authorDetails: 1,
          },
        },
      ]);

      expect(postsWithAuthors).toHaveLength(2);
      
      // Post by deleted user should have empty authorDetails
      const postByDeletedUser = postsWithAuthors.find(
        (post) => post.title === 'First Post'
      );
      expect(postByDeletedUser.authorDetails).toHaveLength(0);

      // Post by active user should have authorDetails
      const postByActiveUser = postsWithAuthors.find(
        (post) => post.title === 'Second Post'
      );
      expect(postByActiveUser.authorDetails).toHaveLength(1);
      expect(postByActiveUser.authorDetails[0].name).toBe('Jane Smith');
    });

    it('should filter out soft deleted posts from comment aggregation', async () => {
      // Soft delete one post
      await Post.softDelete({ _id: testPost1._id });

      // Aggregate comments with their posts
      const commentsWithPosts = await Comment.aggregate([
        {
          $lookup: {
            from: 'posts',
            localField: 'post',
            foreignField: '_id',
            as: 'postDetails',
          },
        },
        {
          $project: {
            content: 1,
            postDetails: 1,
          },
        },
      ]);

      expect(commentsWithPosts).toHaveLength(2);

      // Comment on deleted post should have empty postDetails
      const commentOnDeletedPost = commentsWithPosts.find(
        (comment) => comment.content === 'Great post!'
      );
      expect(commentOnDeletedPost.postDetails).toHaveLength(0);

      // Comment on active post should have postDetails
      const commentOnActivePost = commentsWithPosts.find(
        (comment) => comment.content === 'Thanks for sharing'
      );
      expect(commentOnActivePost.postDetails).toHaveLength(1);
      expect(commentOnActivePost.postDetails[0].title).toBe('Second Post');
    });

    it('should handle multiple lookups with soft deleted documents', async () => {
      // Soft delete one user and one post
      await User.softDelete({ _id: testUser1._id });
      await Post.softDelete({ _id: testPost2._id });

      // Complex aggregation with multiple lookups
      const commentsWithDetails = await Comment.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorDetails',
          },
        },
        {
          $lookup: {
            from: 'posts',
            localField: 'post',
            foreignField: '_id',
            as: 'postDetails',
          },
        },
        {
          $project: {
            content: 1,
            authorDetails: 1,
            postDetails: 1,
          },
        },
      ]);

      expect(commentsWithDetails).toHaveLength(2);

      // Check first comment (author deleted, post active)
      const firstComment = commentsWithDetails.find(
        (comment) => comment.content === 'Great post!'
      );
      expect(firstComment.authorDetails).toHaveLength(1); // User2 is active
      expect(firstComment.postDetails).toHaveLength(1); // Post1 is active

      // Check second comment (author active, post deleted)
      const secondComment = commentsWithDetails.find(
        (comment) => comment.content === 'Thanks for sharing'
      );
      expect(secondComment.authorDetails).toHaveLength(0); // User1 is deleted
      expect(secondComment.postDetails).toHaveLength(0); // Post2 is deleted
    });
  });

  describe('$match with soft deleted documents', () => {
    it('should exclude soft deleted documents in match stage', async () => {
      // Soft delete one user
      await User.softDelete({ _id: testUser1._id });

      // Aggregate with match stage
      const activeUsers = await User.aggregate([
        {
          $match: {
            age: { $gte: 25 },
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            age: 1,
          },
        },
      ]);

      // Should only return active user
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].name).toBe('Jane Smith');
    });

    it('should allow explicit search for deleted documents', async () => {
      // Soft delete one user
      await User.softDelete({ _id: testUser1._id });

      // Explicitly search for deleted documents
      const deletedUsers = await User.aggregate([
        {
          $match: {
            isDeleted: true,
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            isDeleted: 1,
          },
        },
      ]);

      // Should return the deleted user
      expect(deletedUsers).toHaveLength(1);
      expect(deletedUsers[0].name).toBe('John Doe');
      expect(deletedUsers[0].isDeleted).toBe(true);
    });
  });

  describe('Complex aggregation scenarios', () => {
    it('should handle nested comments with soft deleted parents', async () => {
      // Create a nested comment
      const nestedComment = await Comment.create({
        content: 'Reply to first comment',
        author: testUser1._id,
        post: testPost1._id,
        parentComment: testComment1._id,
      });

      // Soft delete the parent comment
      await Comment.softDelete({ _id: testComment1._id });

      // Aggregate comments with their parent comments
      const commentsWithParents = await Comment.aggregate([
        {
          $lookup: {
            from: 'comments',
            localField: 'parentComment',
            foreignField: '_id',
            as: 'parentCommentDetails',
          },
        },
        {
          $project: {
            content: 1,
            parentCommentDetails: 1,
          },
        },
      ]);

      // Find the nested comment
      const nestedCommentResult = commentsWithParents.find(
        (comment) => comment.content === 'Reply to first comment'
      );

      // Should have empty parentCommentDetails since parent is soft deleted
      expect(nestedCommentResult.parentCommentDetails).toHaveLength(0);
    });

    it('should work with grouping and soft deleted documents', async () => {
      // Soft delete one post
      await Post.softDelete({ _id: testPost1._id });

      // Group comments by post
      const commentsByPost = await Comment.aggregate([
        {
          $lookup: {
            from: 'posts',
            localField: 'post',
            foreignField: '_id',
            as: 'postDetails',
          },
        },
        {
          $match: {
            'postDetails.0': { $exists: true }, // Only comments with existing posts
          },
        },
        {
          $group: {
            _id: '$post',
            commentCount: { $sum: 1 },
            postTitle: { $first: { $arrayElemAt: ['$postDetails.title', 0] } },
          },
        },
      ]);

      // Should only have one group (for the active post)
      expect(commentsByPost).toHaveLength(1);
      expect(commentsByPost[0].postTitle).toBe('Second Post');
      expect(commentsByPost[0].commentCount).toBe(1);
    });
  });

  describe('utils', () => {
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
  });
}); 