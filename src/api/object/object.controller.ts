import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { ObjectService } from './object.service';
import { UpdateObjectDto } from './dto/update-object.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums';
import { RoleGuard } from 'src/common/guards/role.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';

@UseGuards(AuthGuard, RoleGuard)
@Controller('object')
export class ObjectController {
  constructor(private readonly objectService: ObjectService) {}

  @Roles(Role.SUPERADMIN)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(
            null,
            join(__dirname, '..', '..', '..', '..', 'uploads', 'objects'),
          );
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async createObject(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.objectService.createObject(user, file, body);
  }

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

  @Roles(Role.SUPERADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateObjectDto,
  ) {
    return this.objectService.updateObjectById(user, id, dto);
  }

  @Roles(Role.SUPERADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.objectService.removeObjectById(user, id);
  }
}
