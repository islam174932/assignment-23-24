import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private readonly postsService: PostsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
    // Ensures the post actually exists before attaching a comment to it.
    const post = await this.postsService.findOne(postId);

    const comment = await this.commentModel.create({
      text: dto.text,
      author: new Types.ObjectId(authorId),
      post: new Types.ObjectId(postId),
    });

    const authorOfPost =
      (post.author as any)?._id?.toString() ?? post.author.toString();
    await this.notificationsService.createCommentNotification(
      authorOfPost,
      authorId,
      postId,
      comment._id.toString(),
    );

    return comment;
  }

  findForPost(postId: string) {
    return this.commentModel
      .find({ post: postId })
      .sort({ createdAt: -1 })
      .populate('author', 'username')
      .exec();
  }

  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await comment.deleteOne();
  }
}
