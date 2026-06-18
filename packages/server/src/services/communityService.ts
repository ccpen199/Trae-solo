import prisma from '../config/prisma';
import logger from '../utils/logger';

export interface CreatePostParams {
  userId: string;
  title: string;
  content: string;
  images?: any;
}

export interface CreateCommentParams {
  postId: string;
  userId: string;
  content: string;
}

export interface PostQueryParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  status?: string;
}

export const createPost = async (params: CreatePostParams) => {
  const { userId, title, content, images } = params;

  const post = await prisma.communityPost.create({
    data: {
      userId,
      title,
      content,
      images,
    },
  });

  return post;
};

export const getPostList = async (params: PostQueryParams) => {
  const { page = 1, pageSize = 10, userId, status = 'published' } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (userId) {
    where.userId = userId;
  }
  if (status) {
    where.status = status;
  }

  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.communityPost.count({ where }),
  ]);

  return {
    list: posts,
    total,
    page,
    pageSize,
  };
};

export const getPostById = async (postId: string) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: {
      user: { select: { id: true, nickname: true, avatar: true } },
    },
  });

  if (!post) {
    throw new Error('帖子不存在');
  }

  return post;
};

export const createComment = async (params: CreateCommentParams) => {
  const { postId, userId, content } = params;

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      content,
    },
  });

  await prisma.communityPost.update({
    where: { id: postId },
    data: { comments: { increment: 1 } },
  });

  return comment;
};

export const getCommentsByPostId = async (postId: string, page: number = 1, pageSize: number = 20) => {
  const skip = (page - 1) * pageSize;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      skip,
      take: pageSize,
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  return {
    list: comments,
    total,
    page,
    pageSize,
  };
};

export const likePost = async (postId: string) => {
  const post = await prisma.communityPost.update({
    where: { id: postId },
    data: { likes: { increment: 1 } },
  });

  return post;
};

export const likeComment = async (commentId: string) => {
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { likes: { increment: 1 } },
  });

  return comment;
};

export default {
  createPost,
  getPostList,
  getPostById,
  createComment,
  getCommentsByPostId,
  likePost,
  likeComment,
};
