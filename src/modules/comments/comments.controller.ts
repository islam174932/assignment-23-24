import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post as HttpPost,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @HttpPost()
  create(
    @Param('postId') postId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, userId, dto);
  }

  @Public()
  @Get()
  findForPost(@Param('postId') postId: string) {
    return this.commentsService.findForPost(postId);
  }

  @Delete(':commentId')
  remove(
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.commentsService.remove(commentId, userId);
  }
}
