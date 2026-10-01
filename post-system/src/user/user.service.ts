import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany({
      include: { _count: { select: { posts: true } } },
    });
  }

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  async createUser(data: { name: string; phone: string }) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException(
        'Body missing. Send JSON with "Content-Type: application/json".',
      );
    }
    if (typeof data.name !== 'string' || !data.name.trim()) {
      throw new BadRequestException('Field "name" (non-empty string) is required.');
    }
    if (typeof data.phone !== 'string' || !data.phone.trim()) {
      throw new BadRequestException('Field "phone" (non-empty string) is required.');
    }
    return this.prisma.user.create({
      data: { name: data.name, phone: data.phone },
    });
  }

  async updateUser(id: string, data: { name?: string; phone?: string }) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException(
        'Body missing. Send JSON with "Content-Type: application/json".',
      );
    }
    const update: { name?: string; phone?: string } = {};
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || !data.name.trim()) {
        throw new BadRequestException(
          'Field "name" must be a non-empty string.',
        );
      }
      update.name = data.name;
    }
    if (data.phone !== undefined) {
      if (typeof data.phone !== 'string' || !data.phone.trim()) {
        throw new BadRequestException(
          'Field "phone" must be a non-empty string.',
        );
      }
      update.phone = data.phone;
    }
    await this.findUserById(id);
    return this.prisma.user.update({ where: { id }, data: update });
  }

  async removeUser(id: string) {
    const user = await this.findUserById(id);
    if (user._count.posts > 0) {
      throw new ConflictException(
        `Cannot delete user "${id}": ${user._count.posts} post(s) still reference it. Delete them first.`,
      );
    }
    return this.prisma.user.delete({ where: { id } });
  }
}
