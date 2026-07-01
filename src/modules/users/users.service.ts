import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: data.email });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    return this.userModel.create(data);
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async follow(currentUserId: string, targetUserId: string): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new ConflictException('You cannot follow yourself');
    }

    const target = await this.userModel.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User to follow was not found');
    }

    await this.userModel.updateOne(
      { _id: currentUserId },
      { $addToSet: { following: new Types.ObjectId(targetUserId) } },
    );
    await this.userModel.updateOne(
      { _id: targetUserId },
      { $addToSet: { followers: new Types.ObjectId(currentUserId) } },
    );

    await this.notificationsService.createFollowNotification(
      targetUserId,
      currentUserId,
    );
  }

  async unfollow(currentUserId: string, targetUserId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: currentUserId },
      { $pull: { following: new Types.ObjectId(targetUserId) } },
    );
    await this.userModel.updateOne(
      { _id: targetUserId },
      { $pull: { followers: new Types.ObjectId(currentUserId) } },
    );
  }
}
