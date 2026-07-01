import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CommentsService } from './comments.service';
import { Comment } from './schemas/comment.schema';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentModel: any;
  let postsService: jest.Mocked<PostsService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const postId = new Types.ObjectId().toString();
  const authorId = new Types.ObjectId().toString();
  const postAuthorId = new Types.ObjectId().toString();

  beforeEach(async () => {
    commentModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getModelToken(Comment.name), useValue: commentModel },
        {
          provide: PostsService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { createCommentNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CommentsService);
    postsService = module.get(PostsService);
    notificationsService = module.get(NotificationsService);
  });

  it('creates a comment and notifies the post author', async () => {
    postsService.findOne.mockResolvedValue({
      author: { _id: postAuthorId },
    } as any);
    const createdComment = {
      _id: new Types.ObjectId().toString(),
      text: 'nice post',
    };
    commentModel.create.mockResolvedValue(createdComment);

    const result = await service.create(postId, authorId, {
      text: 'nice post',
    });

    expect(postsService.findOne).toHaveBeenCalledWith(postId);
    expect(commentModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'nice post' }),
    );
    expect(notificationsService.createCommentNotification).toHaveBeenCalledWith(
      postAuthorId,
      authorId,
      postId,
      createdComment._id,
    );
    expect(result).toBe(createdComment);
  });

  it('throws NotFoundException when deleting a comment that does not exist', async () => {
    commentModel.findById.mockResolvedValue(null);

    await expect(service.remove('missing-id', authorId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('prevents deleting a comment you do not own', async () => {
    commentModel.findById.mockResolvedValue({
      author: { toString: () => postAuthorId },
      deleteOne: jest.fn(),
    });

    await expect(service.remove('comment-id', authorId)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows the owner to delete their comment', async () => {
    const deleteOne = jest.fn().mockResolvedValue(undefined);
    commentModel.findById.mockResolvedValue({
      author: { toString: () => authorId },
      deleteOne,
    });

    await service.remove('comment-id', authorId);

    expect(deleteOne).toHaveBeenCalledTimes(1);
  });
});
