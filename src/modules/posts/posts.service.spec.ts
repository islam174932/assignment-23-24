import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PostsService } from './posts.service';
import { Post } from './schemas/post.schema';
import { NotificationsService } from '../notifications/notifications.service';

function chainable(resolvedValue: unknown) {
  return {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
  };
}

describe('PostsService', () => {
  let service: PostsService;
  let postModel: any;
  let notificationsService: jest.Mocked<NotificationsService>;

  const authorId = new Types.ObjectId().toString();
  const otherUserId = new Types.ObjectId().toString();

  beforeEach(async () => {
    postModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getModelToken(Post.name), useValue: postModel },
        {
          provide: NotificationsService,
          useValue: { createLikeNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(PostsService);
    notificationsService = module.get(NotificationsService);
  });

  it('creates a post tied to the given author', async () => {
    postModel.create.mockResolvedValue({
      content: 'hello world',
      author: authorId,
    });

    const result = await service.create(authorId, { content: 'hello world' });

    expect(postModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'hello world' }),
    );
    expect(result).toBeDefined();
  });

  it('throws NotFoundException when the post does not exist', async () => {
    postModel.findById.mockReturnValue(chainable(null));

    await expect(service.findOne('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('prevents a non-owner from updating a post', async () => {
    const fakePost = {
      author: { _id: authorId },
      save: jest.fn(),
    };
    postModel.findById.mockReturnValue(chainable(fakePost));

    await expect(
      service.update('post-id', otherUserId, { content: 'edited' }),
    ).rejects.toThrow(ForbiddenException);
    expect(fakePost.save).not.toHaveBeenCalled();
  });

  it('allows the owner to update their post', async () => {
    const fakePost: any = {
      author: { _id: authorId },
      content: 'old content',
      save: jest.fn().mockResolvedValue(undefined),
    };
    postModel.findById.mockReturnValue(chainable(fakePost));

    const result = await service.update('post-id', authorId, {
      content: 'new content',
    });

    expect(fakePost.save).toHaveBeenCalledTimes(1);
    expect(result.content).toBe('new content');
  });

  it('adds a like and notifies the author when a new user likes the post', async () => {
    const postId = new Types.ObjectId().toString();
    const fakePost: any = {
      _id: postId,
      author: { _id: authorId },
      likedBy: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    postModel.findById.mockReturnValue(chainable(fakePost));

    await service.toggleLike(postId, otherUserId);

    expect(fakePost.likedBy).toHaveLength(1);
    expect(notificationsService.createLikeNotification).toHaveBeenCalledWith(
      authorId,
      otherUserId,
      postId,
    );
  });

  it('removes a like on a second toggle without notifying again', async () => {
    const postId = new Types.ObjectId().toString();
    const otherUserObjectId = new Types.ObjectId(otherUserId);
    const fakePost: any = {
      _id: postId,
      author: { _id: authorId },
      likedBy: [otherUserObjectId],
      save: jest.fn().mockResolvedValue(undefined),
    };
    postModel.findById.mockReturnValue(chainable(fakePost));

    await service.toggleLike(postId, otherUserId);

    expect(fakePost.likedBy).toHaveLength(0);
    expect(notificationsService.createLikeNotification).not.toHaveBeenCalled();
  });
});
