import { Request, Response } from 'express';
import { success, error, serverError } from '../utils/response';
import { communityService } from '../services';
import Joi from 'joi';

export const createPostSchema = Joi.object({
  title: Joi.string().required().max(100).messages({
    'any.required': '标题不能为空',
    'string.max': '标题不能超过100个字符',
  }),
  content: Joi.string().required().messages({
    'any.required': '内容不能为空',
  }),
  images: Joi.any().optional(),
});

export const createCommentSchema = Joi.object({
  content: Joi.string().required().messages({
    'any.required': '评论内容不能为空',
  }),
});

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const post = await communityService.createPost({
      ...req.body,
      userId,
    });
    success(res, post, '发布成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getPostList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, pageSize, userId } = req.query;
    const result = await communityService.getPostList({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      userId: userId as string,
    });
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getPostDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const post = await communityService.getPostById(postId);
    success(res, post);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { postId } = req.params;

    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const comment = await communityService.createComment({
      postId,
      userId,
      content: req.body.content,
    });
    success(res, comment, '评论成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { page, pageSize } = req.query;

    const result = await communityService.getCommentsByPostId(
      postId,
      page ? parseInt(page as string) : undefined,
      pageSize ? parseInt(pageSize as string) : undefined
    );
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const likePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const post = await communityService.likePost(postId);
    success(res, post, '点赞成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const likeComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const comment = await communityService.likeComment(commentId);
    success(res, comment, '点赞成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export default {
  createPost,
  getPostList,
  getPostDetail,
  createComment,
  getComments,
  likePost,
  likeComment,
};
