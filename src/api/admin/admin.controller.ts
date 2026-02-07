import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums';
import { CheckinDto } from './dto/checkin/checkin.dto';
import { CreateGpsLogDto } from './dto/gps/create-gps-log.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('guardlist')
  guardsList() {
    return this.adminService.guardList();
  }

  @Post('checkin')
  guardCheckin(@Body() dto: CheckinDto) {
    return this.adminService.checkin(dto);
  }

  @Post('gps')
  create(@Body() body: CreateGpsLogDto) {
    if (!body.userId || !body.location?.lat || !body.location?.lng) {
      return { error: 'userId va location (lat,lng) kerak' };
    }
    return this.adminService.create(body);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('gps/:userId')
  findLatest(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.findLatest(
      user,
      Number(userId),
      Number(limit) || 50,
    );
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('logs')
  findAllLogsByObjectId(
    @CurrentUser() user: any,
    @Query('objectId') objectId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.adminService.findAllLogsWithQuery({
      user,
      objectId: +objectId,
      page: +page,
      limit: +limit,
    });
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Get('monitoringLogs')
  findAllLogs(
    @CurrentUser() user: any,
    @Query('objectId') objectId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.adminService.findAllLogs(user, +objectId, +page, +limit);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Get('users')
  findAllUsers(@CurrentUser() user: any) {
    return this.adminService.findAllUsers(user);
  }
}
