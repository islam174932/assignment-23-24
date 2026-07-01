import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  LikeNotification,
  CommentNotification,
  FollowNotification,
} from './schemas/notification-types.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(LikeNotification.name)
    private likeNotificationModel: Model<LikeNotification>,
    @InjectModel(CommentNotification.name)
    private commentNotificationModel: Model<CommentNotification>,
    @InjectModel(FollowNotification.name)
    private followNotificationModel: Model<FollowNotification>,
  ) {}

  createLikeNotification(recipient: string, sender: string, post: string) {
    if (recipient === sender) return null;
    return this.likeNotificationModel.create({
      recipient: new Types.ObjectId(recipient),
      sender: new Types.ObjectId(sender),
      post: new Types.ObjectId(post),
    });
  }

  createCommentNotification(
    recipient: string,
    sender: string,
    post: string,
    comment: string,
  ) {
    if (recipient === sender) return null;
    return this.commentNotificationModel.create({
      recipient: new Types.ObjectId(recipient),
      sender: new Types.ObjectId(sender),
      post: new Types.ObjectId(post),
      comment: new Types.ObjectId(comment),
    });
  }

  createFollowNotification(recipient: string, sender: string) {
    if (recipient === sender) return null;
    return this.followNotificationModel.create({
      recipient: new Types.ObjectId(recipient),
      sender: new Types.ObjectId(sender),
    });
  }

  findForUser(userId: string) {
    // Querying the base model returns documents from every discriminator
    // (LIKE, COMMENT, FOLLOW) since they all live in the same collection.
    return this.notificationModel
      .find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'username')
      .exec();
  }

  markAsRead(notificationId: string) {
    return this.notificationModel
      .findByIdAndUpdate(notificationId, { read: true }, { new: true })
      .exec();
  }
}
