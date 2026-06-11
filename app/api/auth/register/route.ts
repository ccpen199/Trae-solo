import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
    confirmPassword: z.string(),
    role: z.enum(["JOB_SEEKER", "EMPLOYER"]).default("JOB_SEEKER"),
    companyName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密码不一致",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone || null,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        avatar: null,
      },
    });

    if (data.role === "JOB_SEEKER") {
      await prisma.jobSeeker.create({
        data: {
          userId: user.id,
          tags: [],
          skills: [],
        },
      });

      await prisma.candidateProfile.create({
        data: {
          jobSeekerId: user.id,
          industryTags: [],
          skillTags: [],
          preferredLocations: [],
          preferredIndustries: [],
          preferredRoles: [],
          modelVersion: "v1.0",
        },
      });
    } else if (data.role === "EMPLOYER") {
      let company;
      if (data.companyName) {
        company = await prisma.company.create({
          data: {
            name: data.companyName,
            benefits: [],
          },
        });
      } else {
        company = await prisma.company.create({
          data: {
            name: `${data.name}的公司`,
            benefits: [],
          },
        });
      }

      await prisma.employer.create({
        data: {
          userId: user.id,
          companyId: company.id,
        },
      });
    }

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
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "输入数据格式错误" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
