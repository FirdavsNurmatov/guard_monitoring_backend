import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(AuthGuard, RoleGuard)
@Roles(Role.ADMIN)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  createUser(@CurrentUser() user: any, @Body() createGuardDto: CreateUserDto) {
    return this.userService.createUser(user, createGuardDto);
  }

  @Get('guards')
  findAllGuards(@CurrentUser() user: any) {
    return this.userService.findAllGuards(user);
  }

  @Get('guard/:id')
  findGuardById(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.findGuardById(user, id);
  }

  @Patch(':id')
  updateUser(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGuardDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(user, id, updateGuardDto);
  }

  @Delete(':id')
  removeUser(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.userService.inactiveUser(user, id);
  }

  @Delete('/delete/:id')
  deleteUser(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(user, id);
  }

}
