import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('userId') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  updateMe(@CurrentUser('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post(':id/follow')
  follow(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.usersService.follow(userId, id);
  }

  @Delete(':id/follow')
  unfollow(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.usersService.unfollow(userId, id);
  }
}
