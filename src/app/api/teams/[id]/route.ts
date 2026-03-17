import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Member, WeeklySchedule } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const team = await prisma.generatedTeam.findUnique({
    where: { id },
    include: { memberLinks: { include: { member: true } } },
  });
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  return NextResponse.json({
    id: team.id,
    name: team.name,
    sessionId: team.sessionId,
    presetId: team.presetId,
    createdAt: team.createdAt,
    members: team.memberLinks.map((link) => ({
      member: {
        ...link.member,
        weeklySchedule: link.member.weeklySchedule as WeeklySchedule,
      } as Member,
      manuallySwapped: link.manuallySwapped,
    })),
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const team = await prisma.generatedTeam.findUnique({ where: { id } });
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  await prisma.generatedTeam.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
