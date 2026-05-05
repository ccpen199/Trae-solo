import { Request, Response } from "express";
import { userService } from "../services/userService";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response";
import { UserRole } from "../utils/enums";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json(errorResponse("Username and password are required", "VALIDATION_ERROR"));
    }

    const result = await userService.login(username, password);

    const { user, token } = result;
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.json(
      successResponse(
        { user: userWithoutPassword, token },
        "Login successful"
      )
    );
  } catch (error: any) {
    res
      .status(401)
      .json(errorResponse(error.message || "Login failed", "LOGIN_FAILED"));
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email } = req.body;

    if (!username || !password || !fullName) {
      return res
        .status(400)
        .json(
          errorResponse("Username, password and full name are required", "VALIDATION_ERROR")
        );
    }

    const user = await userService.createUser(
      username,
      password,
      fullName,
      email,
      UserRole.TESTER
    );

    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res
      .status(201)
      .json(successResponse(userWithoutPassword, "User registered successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Registration failed", "REGISTRATION_FAILED"));
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    }

    const user = await userService.findById(req.user.userId);

    if (!user) {
      return res.status(404).json(errorResponse("User not found", "USER_NOT_FOUND"));
    }

    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      projects: user.projects,
      groups: user.groups,
      createdAt: user.createdAt,
    };

    res.json(successResponse(userWithoutPassword, "User retrieved successfully"));
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get user", "INTERNAL_ERROR"));
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse("Authentication required", "AUTH_REQUIRED"));
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json(
          errorResponse("Old password and new password are required", "VALIDATION_ERROR")
        );
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json(
          errorResponse("New password must be at least 6 characters", "VALIDATION_ERROR")
        );
    }

    await userService.changePassword(req.user.userId, oldPassword, newPassword);

    res.json(successResponse(null, "Password changed successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to change password", "PASSWORD_CHANGE_FAILED"));
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const role = req.query.role as UserRole | undefined;
    const search = req.query.search as string | undefined;

    const skip = (page - 1) * pageSize;

    const result = await userService.findAll({
      skip,
      take: pageSize,
      role,
      search,
    });

    const usersWithoutPassword = result.users.map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));

    res.json(
      paginatedResponse(usersWithoutPassword, page, pageSize, result.total)
    );
  } catch (error: any) {
    res
      .status(500)
      .json(errorResponse(error.message || "Failed to get users", "INTERNAL_ERROR"));
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email, role } = req.body;

    if (!username || !password || !fullName) {
      return res
        .status(400)
        .json(
          errorResponse("Username, password and full name are required", "VALIDATION_ERROR")
        );
    }

    const user = await userService.createUser(
      username,
      password,
      fullName,
      email,
      role || UserRole.VIEWER
    );

    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res
      .status(201)
      .json(successResponse(userWithoutPassword, "User created successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to create user", "USER_CREATE_FAILED"));
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, isActive } = req.body;

    const user = await userService.updateUser(id, {
      fullName,
      email,
      role,
      isActive,
    });

    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.json(successResponse(userWithoutPassword, "User updated successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to update user", "USER_UPDATE_FAILED"));
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.userId === id) {
      return res
        .status(400)
        .json(errorResponse("Cannot delete your own account", "VALIDATION_ERROR"));
    }

    const userRepository = require("../config/database").AppDataSource.getRepository(
      require("../models/User").User
    );

    const user = await userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json(errorResponse("User not found", "USER_NOT_FOUND"));
    }

    await userRepository.remove(user);

    res.json(successResponse(null, "User deleted successfully"));
  } catch (error: any) {
    res
      .status(400)
      .json(errorResponse(error.message || "Failed to delete user", "USER_DELETE_FAILED"));
  }
};
