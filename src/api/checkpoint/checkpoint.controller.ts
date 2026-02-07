import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CheckpointService } from './checkpoint.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(AuthGuard, RoleGuard)
@Controller('checkpoint')
export class CheckpointController {
  constructor(private readonly checkpointService: CheckpointService) {}

  @Roles(Role.SUPERADMIN)
  @Post()
  async createCheckpoint(
    @CurrentUser() user: any,
    @Body() dto: CreateCheckpointDto,
  ) {
    return this.checkpointService.createCheckpoint(user, dto);
  }

  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get()
  async getCheckpoints(
    @CurrentUser() user: any,
    @Query('objectId') objectId: number,
  ) {
    return this.checkpointService.findAllCheckpoints(user, +objectId);
  }

  @Roles(Role.SUPERADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkpointService.findOne(+id);
  }

  @Roles(Role.SUPERADMIN)
  @Patch(':id')
  async updateCheckpoint(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCheckpointDto,
  ) {
    return this.checkpointService.updateCheckpoint(user, id, dto);
  }

  @Roles(Role.SUPERADMIN)
  @Delete(':id')
  async deleteCheckpoint(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.checkpointService.deleteCheckpoint(user, id);
  }
}
