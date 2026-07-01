import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Notification } from './notification.schema';

// Each of these extends the base Notification schema and is registered as
// a Mongoose discriminator, so all three share one MongoDB collection while
// still having their own extra fields and their own model class.

@Schema()
export class LikeNotification extends Notification {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;
}
export const LikeNotificationSchema =
  SchemaFactory.createForClass(LikeNotification);

@Schema()
export class CommentNotification extends Notification {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment', required: true })
  comment: Types.ObjectId;
}
export const CommentNotificationSchema =
  SchemaFactory.createForClass(CommentNotification);

@Schema()
export class FollowNotification extends Notification {}
export const FollowNotificationSchema =
  SchemaFactory.createForClass(FollowNotification);
