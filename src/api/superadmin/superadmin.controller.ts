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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Role } from 'src/common/enums';
import { Roles } from 'src/common/decorators/role.decorator';
import { SuperadminService } from './superadmin.service';
import { extname, join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateOrganizationDto } from './dto/organization/create-organization.dto';
import { UpdateOrganizationDto } from './dto/organization/edit-organization.dto';
import { CreateAdminDto } from './dto/admin/create-admin.dto';
import { UpdateAdminDto } from './dto/admin/update-admin.dto';
import { CreateCheckpointDto } from './dto/checkpoint/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/checkpoint/update-checkpoint.dto';
import { CreateObjectDto } from './dto/object/create-object.dto';
import { UpdateObjectDto } from './dto/object/update-object.dto';

@UseGuards(AuthGuard, RoleGuard)
@Roles(Role.SUPERADMIN)
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Post('object/:id/image')
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

      fileFilter: (req, file, cb) => {
        // 1️⃣ mimetype tekshirish
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Faqat rasm fayllariga ruxsat beriladi'),
            false,
          );
        }

        // 2️⃣ extension tekshirish (double protection)
        const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
        const ext = extname(file.originalname).toLowerCase();

        if (!allowedExt.includes(ext)) {
          return cb(new BadRequestException('Noto‘g‘ri rasm formati'), false);
        }

        cb(null, true);
      },

      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  uploadObjectImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    return this.superadminService.uploadObjectImage(file, +id);
  }

  @Delete('object/:id/image')
  removeObjectImage(@Param('id') id: string) {
    return this.superadminService.removeObjectImage(+id);
  }

  @Post('organization')
  createOrganization(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.superadminService.createOrganization(createOrganizationDto);
  }

  @Get('organizations')
  findAllOrganizations(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.superadminService.findAllOrganizations(
      Number(page),
      Number(limit),
    );
  }

  @Patch('organization/:id')
  updateOrganization(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.superadminService.updateOrganization(
      +id,
      updateOrganizationDto,
    );
  }

  @Patch('organization/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'INACTIVE' },
  ) {
    return this.superadminService.updateOrganizationStatus(+id, body.status);
  }

  @Delete('organization/:id')
  removeOrganization(@Param('id') id: string) {
    return this.superadminService.removeOrganization(+id);
  }

  @Post('object')
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

      fileFilter: (req, file, cb) => {
        // 1️⃣ mimetype tekshirish
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Faqat rasm fayllariga ruxsat beriladi'),
            false,
          );
        }

        // 2️⃣ extension tekshirish (double protection)
        const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
        const ext = extname(file.originalname).toLowerCase();

        if (!allowedExt.includes(ext)) {
          return cb(new BadRequestException('Noto‘g‘ri rasm formati'), false);
        }

        cb(null, true);
      },

      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  createObject(
    @UploadedFile() file: Express.Multer.File,
    @Body() createObjectDto: any,
  ) {
    if (!createObjectDto.organizationId)
      throw new BadRequestException('Organization id required');
    return this.superadminService.createObject(file, createObjectDto);
  }

  @Get('objects')
  findAllObjects(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.superadminService.findAllObjects(Number(page), Number(limit));
  }

  @Get('object/:id')
  findOneObject(@Param('id') id: string) {
    return this.superadminService.findOneObject(+id);
  }

  @Patch('object/:id')
  updateObject(
    @Param('id') id: string,
    @Body() updateObjectDto: UpdateObjectDto,
  ) {
    return this.superadminService.updateObject(+id, updateObjectDto);
  }

  @Delete('object/:id')
  removeObject(@Param('id') id: string) {
    return this.superadminService.removeObject(+id);
  }

  @Post('checkpoint')
  createCheckpoint(@Body() createCheckpointDto: CreateCheckpointDto) {
    return this.superadminService.createCheckpoint(createCheckpointDto);
  }

  @Patch('checkpoint/:id')
  updateCheckpoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCheckpointDto: UpdateCheckpointDto,
  ) {
    return this.superadminService.updateCheckpoint(id, updateCheckpointDto);
  }

  @Delete('checkpoint/:id')
  deleteCheckpoint(@Param('id', ParseIntPipe) id: number) {
    return this.superadminService.deleteCheckpoint(id);
  }

  @Post('admin')
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.superadminService.createAdmin(createAdminDto);
  }

  @Get('admins')
  findAllAdmins(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.superadminService.findAllAdmins(Number(page), Number(limit));
  }

  @Patch('admin/:id')
  updateAdmin(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.superadminService.updateAdmin(+id, updateAdminDto);
  }

  @Delete('admin/:id')
  removeAdmin(@Param('id') id: string) {
    return this.superadminService.removeAdmin(+id);
  }
}
