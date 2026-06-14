import { AppDataSource } from '../data-source';
import { CommunityPost } from '../entities/CommunityPost';
import { PostComment } from '../entities/PostComment';

const postRepository = AppDataSource.getRepository(CommunityPost);
const commentRepository = AppDataSource.getRepository(PostComment);

interface PostData {
  title: string;
  content: string;
  tags?: string[];
  images?: string[];
}

interface CommentData {
  content: string;
  parentId?: number;
}

interface PostFilters {
  tag?: string;
  keyword?: string;
  userId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const communityService = {
  async createPost(userId: number, postData: PostData) {
    try {
      const tags = postData.tags || [];
      const contentTags = postData.content.match(/#[^\s#]+/g) || [];
      const extractedTags = contentTags.map((tag: string) => tag.slice(1));
      const allTags = [...new Set([...tags, ...extractedTags])];

      const post = postRepository.create({
        userId,
        title: postData.title,
        content: postData.content,
        tags: allTags,
        images: postData.images,
        status: 'published'
      });

      const savedPost = await postRepository.save(post);
      return {
        success: true,
        message: '发帖成功',
        data: savedPost
      };
    } catch (error) {
      return {
        success: false,
        message: '发帖失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getPostList(filters: PostFilters = {}) {
    try {
      const queryBuilder = postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user');

      if (filters.tag) {
        queryBuilder.andWhere('post.tags LIKE :tag', { tag: `%${filters.tag}%` });
      }

      if (filters.keyword) {
        queryBuilder.andWhere(
          '(post.title LIKE :keyword OR post.content LIKE :keyword)',
          { keyword: `%${filters.keyword}%` }
        );
      }

      if (filters.userId) {
        queryBuilder.andWhere('post.userId = :userId', { userId: filters.userId });
      }

      if (filters.status) {
        queryBuilder.andWhere('post.status = :status', { status: filters.status });
      } else {
        queryBuilder.andWhere('post.status = :status', { status: 'published' });
      }

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const skip = (page - 1) * pageSize;

      queryBuilder.skip(skip).take(pageSize).orderBy('post.createdAt', 'DESC');

      const [posts, total] = await queryBuilder.getManyAndCount();

      const postsWithUser = posts.map((post: any) => {
        const { password, ...userWithoutPassword } = post.user || {};
        return { ...post, user: userWithoutPassword };
      });

      return {
        success: true,
        data: {
          list: postsWithUser,
          total,
          page,
          pageSize
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取帖子列表失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async getPostDetail(postId: number) {
    try {
      const post = await postRepository.findOne({
        where: { id: postId },
        relations: ['user', 'comments', 'comments.user']
      });

      if (!post) {
        return {
          success: false,
          message: '帖子不存在'
        };
      }

      const { password, ...userWithoutPassword } = post.user || {};
      const commentsWithUser = post.comments.map((comment: any) => {
        const { password, ...commentUser } = comment.user || {};
        return { ...comment, user: commentUser };
      });

      return {
        success: true,
        data: {
          ...post,
          user: userWithoutPassword,
          comments: commentsWithUser
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取帖子详情失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async addComment(userId: number, postId: number, commentData: CommentData) {
    try {
      const post = await postRepository.findOne({
        where: { id: postId, status: 'published' }
      });

      if (!post) {
        return {
          success: false,
          message: '帖子不存在或已删除'
        };
      }

      const comment = commentRepository.create({
        userId,
        postId,
        content: commentData.content,
        parentId: commentData.parentId,
        status: 'published'
      });

      const savedComment = await commentRepository.save(comment);

      post.commentsCount = (post.commentsCount || 0) + 1;
      await postRepository.save(post);

      return {
        success: true,
        message: '评论成功',
        data: savedComment
      };
    } catch (error) {
      return {
        success: false,
        message: '评论失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async likePost(userId: number, postId: number) {
    try {
      const post = await postRepository.findOne({
        where: { id: postId, status: 'published' }
      });

      if (!post) {
        return {
          success: false,
          message: '帖子不存在或已删除'
        };
      }

      post.likes = (post.likes || 0) + 1;
      await postRepository.save(post);

      return {
        success: true,
        message: '点赞成功',
        data: { likes: post.likes }
      };
    } catch (error) {
      return {
        success: false,
        message: '点赞失败',
        data: error instanceof Error ? error.message : error
      };
    }
  },

  async deletePost(userId: number, postId: number) {
    try {
      const post = await postRepository.findOne({
        where: { id: postId, userId }
      });

      if (!post) {
        return {
          success: false,
          message: '帖子不存在或无权删除'
        };
      }

      post.status = 'deleted';
      await postRepository.save(post);

      return {
        success: true,
        message: '帖子删除成功'
      };
    } catch (error) {
      return {
        success: false,
        message: '帖子删除失败',
        data: error instanceof Error ? error.message : error
      };
    }
  }
};
