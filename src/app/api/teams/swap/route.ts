import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/authUtils";

const SwapSchema = z.object({
  teamIdA: z.string(),
  memberIdA: z.string(),
  teamIdB: z.string(),
  memberIdB: z.string(),
});

const SENIOR_LEVELS = ["Senior", "Lead"];

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const body = await req.json();
  const parsed = SwapSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { teamIdA, memberIdA, teamIdB, memberIdB } = parsed.data;

  const [teamA, teamB] = await Promise.all([
    prisma.generatedTeam.findUnique({ where: { id: teamIdA } }),
    prisma.generatedTeam.findUnique({ where: { id: teamIdB } }),
  ]);
  if (!teamA || !teamB) {
    return NextResponse.json({ error: "One or both teams not found." }, { status: 404 });
  }

  const [linkA, linkB] = await Promise.all([
    prisma.teamMemberLink.findUnique({ where: { teamId_memberId: { teamId: teamIdA, memberId: memberIdA } } }),
    prisma.teamMemberLink.findUnique({ where: { teamId_memberId: { teamId: teamIdB, memberId: memberIdB } } }),
  ]);
  if (!linkA || !linkB) {
    return NextResponse.json({ error: "One or both member assignments not found." }, { status: 404 });
  }

  // Swap: delete old links and re-create with swapped teams
  await prisma.$transaction([
    prisma.teamMemberLink.delete({ where: { teamId_memberId: { teamId: teamIdA, memberId: memberIdA } } }),
    prisma.teamMemberLink.delete({ where: { teamId_memberId: { teamId: teamIdB, memberId: memberIdB } } }),
    prisma.teamMemberLink.create({ data: { teamId: teamIdB, memberId: memberIdA, manuallySwapped: true } }),
    prisma.teamMemberLink.create({ data: { teamId: teamIdA, memberId: memberIdB, manuallySwapped: true } }),
  ]);

  // Advisory skill-imbalance warning (non-blocking per PRD §3.3)
  const [mA, mB] = await Promise.all([
    prisma.member.findUnique({ where: { id: memberIdA } }),
    prisma.member.findUnique({ where: { id: memberIdB } }),
  ]);

  const warning =
    mA && mB && SENIOR_LEVELS.includes(mA.skillLevel) !== SENIOR_LEVELS.includes(mB.skillLevel)
      ? {
          type: "SKILL_IMBALANCE",
          message:
            "This swap may create a skill imbalance — one team may gain more senior members than the other.",
        }
      : null;

  return NextResponse.json({ success: true, warning });
}
