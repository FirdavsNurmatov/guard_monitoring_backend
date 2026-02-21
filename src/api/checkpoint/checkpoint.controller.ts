import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { CheckpointService } from './checkpoint.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(AuthGuard, RoleGuard)
@Controller('checkpoint')
export class CheckpointController {
  constructor(private readonly checkpointService: CheckpointService) {}

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
}
