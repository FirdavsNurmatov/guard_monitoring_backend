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
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('guards')
  createGuard(@Body() createGuardDto: CreateUserDto) {
    return this.adminService.createGuard(createGuardDto);
  }

  @Get('logs/:id')
  findAllLogsByMapId(
    @Param('id') id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.adminService.findAllLogsWithQuery({
      page: +page,
      limit: +limit,
    });
  }

  @Get('logs')
  findAllLogs() {
    return this.adminService.findAllLogs();
  }

  @Get('guards/positions')
  async getGuardPositions() {
    return this.adminService.getGuardPositions();
  }

  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('guards')
  findAllGuards() {
    return this.adminService.findAllGuards();
  }

  @Get('guards/:id')
  findGuardById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findGuardById(id);
  }

  @Patch('guards/:id')
  updateGuard(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGuardDto: UpdateGuardDto,
  ) {
    return this.adminService.updateGuard(id, updateGuardDto);
  }

  @Delete('guards/:id')
  removeGuard(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeGuard(id);
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
    }),
  )
  async createObject(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.adminService.createObject(file, body.name);
  }

  @Get('objects')
  async findAllObjects() {
    return this.adminService.findAllObjects();
  }

  @Get('object/:id')
  async findOneObjectById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOneObjectById(id);
  }

  @Get('first-object')
  async findFirstObject() {
    return this.adminService.findFirstObject();
  }

  @Patch('object/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateObjectDto) {
    return this.adminService.updateObjectById(id, dto);
  }

  @Delete('object/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeObjectById(id);
  }

  // Checkpoints
  @Get('checkpoints')
  async getCheckpoints() {
    return this.adminService.findAllCheckpoints();
  }

  @Post('checkpoints')
  async createCheckpoint(@Body() dto: CreateCheckpointDto) {
    return this.adminService.createCheckpoint(dto);
  }

  @Patch('checkpoints/:id')
  async updateCheckpoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCheckpointDto,
  ) {
    return this.adminService.updateCheckpoint(id, dto);
  }

  @Delete('checkpoints/:id')
  async deleteCheckpoint(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteCheckpoint(id);
  }
}
