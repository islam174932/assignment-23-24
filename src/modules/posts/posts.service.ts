import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  create(authorId: string, dto: CreatePostDto) {
    return this.postModel.create({
      content: dto.content,
      author: new Types.ObjectId(authorId),
    });
  }

  findAll() {
    return this.postModel
      .find()
      .sort({ createdAt: -1 })
      .populate('author', 'username')
      .exec();
  }

  async findOne(id: string): Promise<PostDocument> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username')
      .exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<PostDocument> {
    const post = await this.findOne(id);
    this.assertOwnership(post, userId);

    Object.assign(post, dto);
    await post.save();
    return post;
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findOne(id);
    this.assertOwnership(post, userId);
    await post.deleteOne();
  }

  async toggleLike(id: string, userId: string): Promise<PostDocument> {
    const post = await this.findOne(id);
    const userObjectId = new Types.ObjectId(userId);
    const alreadyLiked = post.likedBy.some((liker) =>
      liker.equals(userObjectId),
    );

    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter(
        (liker) => !liker.equals(userObjectId),
      );
    } else {
      post.likedBy.push(userObjectId);
      const authorId =
        (post.author as any)?._id?.toString() ?? post.author.toString();
      await this.notificationsService.createLikeNotification(
        authorId,
        userId,
        post._id.toString(),
      );
    }

    await post.save();
    return post;
  }

  private assertOwnership(post: PostDocument, userId: string) {
    const authorId =
      (post.author as any)?._id?.toString() ?? post.author.toString();
    if (authorId !== userId) {
      throw new ForbiddenException('You can only modify your own posts');
    }
  }
}
