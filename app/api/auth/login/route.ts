import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["JOB_SEEKER", "EMPLOYER"]).default("JOB_SEEKER"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        jobSeeker: true,
        employer: { include: { company: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    if (user.role !== data.role) {
      return NextResponse.json(
        { error: `该账号不是${data.role === "EMPLOYER" ? "企业" : "求职者"}账号` },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(data.password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await createToken({
      userId: user.id,
      role: user.role as "JOB_SEEKER" | "EMPLOYER" | "HR" | "ADMIN",
      email: user.email,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入数据格式错误" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
