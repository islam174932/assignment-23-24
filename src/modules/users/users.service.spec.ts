import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let notificationsService: jest.Mocked<NotificationsService>;

  const currentUserId = new Types.ObjectId().toString();
  const targetUserId = new Types.ObjectId().toString();

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        {
          provide: NotificationsService,
          useValue: { createFollowNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    notificationsService = module.get(NotificationsService);
  });

  it('rejects following yourself', async () => {
    await expect(service.follow(currentUserId, currentUserId)).rejects.toThrow(
      ConflictException,
    );
    expect(userModel.updateOne).not.toHaveBeenCalled();
  });

  it('rejects following a user that does not exist', async () => {
    userModel.findById.mockResolvedValue(null);

    await expect(service.follow(currentUserId, targetUserId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates both users and fires a notification on successful follow', async () => {
    userModel.findById.mockResolvedValue({ _id: targetUserId });

    await service.follow(currentUserId, targetUserId);

    expect(userModel.updateOne).toHaveBeenCalledTimes(2);
    expect(notificationsService.createFollowNotification).toHaveBeenCalledWith(
      targetUserId,
      currentUserId,
    );
  });

  it('pulls both sides of the relationship on unfollow', async () => {
    await service.unfollow(currentUserId, targetUserId);

    expect(userModel.updateOne).toHaveBeenCalledTimes(2);
    expect(userModel.updateOne).toHaveBeenNthCalledWith(
      1,
      { _id: currentUserId },
      { $pull: { following: expect.any(Types.ObjectId) } },
    );
  });
});
