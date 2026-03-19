import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authUtils";
import type { Member, WeeklySchedule } from "@/lib/types";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const sessionId = req.nextUrl.searchParams.get("sessionId");

  const teams = await prisma.generatedTeam.findMany({
    where: sessionId ? { sessionId } : {},
    include: {
      memberLinks: {
        include: { member: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    teams.map((t) => ({
      id: t.id,
      name: t.name,
      sessionId: t.sessionId,
      presetId: t.presetId,
      createdAt: t.createdAt,
      members: t.memberLinks.map((link) => ({
        member: {
          ...link.member,
          weeklySchedule: link.member.weeklySchedule as WeeklySchedule,
          updatedAt: link.member.updatedAt.toISOString(),
        } as unknown as Member,
        manuallySwapped: link.manuallySwapped,
      })),
    }))
  );
}
