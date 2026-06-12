import { cookies } from "next/headers";
import * as jose from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const JWT_COOKIE_NAME = "recruitment_os_token";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-key-change-in-production"
);

export type UserRole = "JOB_SEEKER" | "EMPLOYER" | "HR" | "ADMIN";

export interface JWTPayload {
  userId: string;
  role: UserRole;
  email: string;
  [key: string]: unknown;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  cookies().set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearAuthCookie() {
  cookies().set(JWT_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function getCurrentUser() {
  const token = cookies().get(JWT_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      jobSeeker: true,
      employer: {
        include: { company: true },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    name: user.name,
    avatar: user.avatar,
    jobSeeker: user.jobSeeker,
    employer: user.employer,
  };
}

export async function requireAuth(requiredRoles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("未登录");
  }
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    throw new Error("无权限访问");
  }
  return user;
}
