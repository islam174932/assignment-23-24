import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import {
  LikeNotification,
  LikeNotificationSchema,
  CommentNotification,
  CommentNotificationSchema,
  FollowNotification,
  FollowNotificationSchema,
} from './schemas/notification-types.schema';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
        discriminators: [
          { name: LikeNotification.name, schema: LikeNotificationSchema },
          { name: CommentNotification.name, schema: CommentNotificationSchema },
          { name: FollowNotification.name, schema: FollowNotificationSchema },
        ],
      },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
