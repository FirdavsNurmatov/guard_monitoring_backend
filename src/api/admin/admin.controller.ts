import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateGuardDto } from './dto/user/update-guard.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/common/enums';
import { CreateCheckpointDto } from './dto/checkpoint/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/checkpoint/update-checkpoint.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { CreateUserDto } from './dto/user/create-guard.dto';
import { UpdateObjectDto } from './dto/object/update-map.dto';

@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(Role.ADMIN)
  @Post('guards')
  createGuard(@Body() createGuardDto: CreateUserDto) {
    return this.adminService.createGuard(createGuardDto);
  }

  @Roles(Role.ADMIN)
  @Get('logs')
  findAllLogsByMapId(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.adminService.findAllLogsWithQuery({
      page: +page,
      limit: +limit,
    });
  }

  @Roles(Role.ADMIN)
  @Get('logs')
  findAllLogs() {
    return this.adminService.findAllLogs();
  }

  @Roles(Role.ADMIN)
  @Get('guards/positions')
  async getGuardPositions() {
    return this.adminService.getGuardPositions();
  }

  @Roles(Role.ADMIN)
  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Roles(Role.ADMIN)
  @Get('guards')
  findAllGuards() {
    return this.adminService.findAllGuards();
  }

  @Roles(Role.ADMIN)
  @Get('guards/:id')
  findGuardById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findGuardById(id);
  }

  @Roles(Role.ADMIN)
  @Patch('guards/:id')
  updateGuard(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGuardDto: UpdateGuardDto,
  ) {
    return this.adminService.updateGuard(id, updateGuardDto);
  }

  @Roles(Role.ADMIN)
  @Delete('guards/:id')
  removeGuard(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeGuard(id);
  }

  @Roles(Role.ADMIN)
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
    }),
  )
  async createObject(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.adminService.createObject(file, body.name);
  }

  @Roles(Role.ADMIN)
  @Get('objects')
  async findAllObjects() {
    return this.adminService.findAllObjects();
  }

  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('object/:id')
  async findOneObjectById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOneObjectById(id);
  }

  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('first-object')
  async findFirstObject() {
    return this.adminService.findFirstObject();
  }

  @Roles(Role.ADMIN, Role.OPERATOR)
  @Patch('object/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateObjectDto) {
    return this.adminService.updateObjectById(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('object/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeObjectById(id);
  }

  // Checkpoints
  @Roles(Role.ADMIN, Role.OPERATOR)
  @Get('checkpoints')
  async getCheckpoints() {
    return this.adminService.findAllCheckpoints();
  }

  @Roles(Role.ADMIN)
  @Post('checkpoints')
  async createCheckpoint(@Body() dto: CreateCheckpointDto) {
    return this.adminService.createCheckpoint(dto);
  }

  @Roles(Role.ADMIN)
  @Patch('checkpoints/:id')
  async updateCheckpoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCheckpointDto,
  ) {
    return this.adminService.updateCheckpoint(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('checkpoints/:id')
  async deleteCheckpoint(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteCheckpoint(id);
  }
}
