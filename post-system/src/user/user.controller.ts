import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() body: { name: string; phone: string }) {
    return this.userService.createUser(body);
  }

  @Get()
  findAll() {
    return this.userService.findAllUsers();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findUserById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string },
  ) {
    return this.userService.updateUser(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.removeUser(id);
  }
}
