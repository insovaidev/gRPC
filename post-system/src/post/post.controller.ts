import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { PostService, LeadPayload } from './post.service';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // REST endpoint for sellers publishing a new post/ad
  @Post()
  async create(@Body()
  body: { title: string; price: number; category: string; userId: string }) {
    return this.postService.createPost(body);
  }

  @Get()
  findAll() {
    return this.postService.findAllPosts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findPostById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; price?: number; category?: string },
  ) {
    return this.postService.updatePost(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.removePost(id);
  }

  // gRPC Streaming handler mapped to 'StreamNewLeads' in lead.proto
  @GrpcMethod('LeadStreamService', 'StreamNewLeads')
  streamNewLeads(data: { filter_category?: string }): Observable<LeadPayload> {
    console.log(
      `[gRPC Server] CRM client connected. Filter category: "${data.filter_category || 'ALL'}"`,
    );
    return this.postService.getLeadStream(data.filter_category);
  }
}
