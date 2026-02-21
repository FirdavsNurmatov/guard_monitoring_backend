import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ObjectService } from './object.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';

@UseGuards(AuthGuard, RoleGuard)
@Controller('object')
export class ObjectController {
  constructor(private readonly objectService: ObjectService) {}

  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Get()
  async findAllObjects(@CurrentUser() user: any) {
    return this.objectService.findAllObjects(user);
  }

  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.OPERATOR)
  @Get(':id')
  async findOneObjectById(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.objectService.findOneObjectById(user, id);
  }
}
