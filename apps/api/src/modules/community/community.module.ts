import { Module } from '@nestjs/common';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  controllers: [TopicController, PostController, CommentController],
  providers: [TopicService, PostService, CommentService],
  exports: [TopicService, PostService, CommentService],
})
export class CommunityModule {}
