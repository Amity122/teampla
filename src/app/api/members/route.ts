import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberCreateSchema } from "@/lib/validators";
import type { WeeklySchedule } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const skillLevel = searchParams.get("skillLevel");
  const shift = searchParams.get("shift");
  const primaryTeam = searchParams.get("primaryTeam");
  const maxProjects = searchParams.get("maxProjects");

  const members = await prisma.member.findMany({
    where: {
      ...(skillLevel ? { skillLevel } : {}),
      ...(shift ? { shift } : {}),
      ...(primaryTeam ? { primaryTeam } : {}),
      ...(maxProjects != null
        ? { activeProjectCount: { lte: parseInt(maxProjects, 10) } }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    members.map((m) => ({ ...m, weeklySchedule: m.weeklySchedule as WeeklySchedule }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = MemberCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.member.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "A member with this email already exists." }, { status: 409 });
  }

  const member = await prisma.member.create({ data: parsed.data });
  return NextResponse.json(member, { status: 201 });
}
