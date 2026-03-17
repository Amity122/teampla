import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTeams } from "@/lib/randomizer";
import { GenerateTeamsRequestSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/authUtils";
import type { Member, WeeklySchedule } from "@/lib/types";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const body = await req.json();
  const parsed = GenerateTeamsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { config, presetId, persist } = parsed.data;

  // Fetch members
  const rawMembers = config.memberIds?.length
    ? await prisma.member.findMany({ where: { id: { in: config.memberIds } } })
    : await prisma.member.findMany();

  const members: Member[] = rawMembers.map((m) => ({
    ...m,
    weeklySchedule: m.weeklySchedule as WeeklySchedule,
    updatedAt: m.updatedAt.toISOString(),
  }));

  const result = generateTeams(members, config);

  if (persist) {
    await prisma.$transaction(
      result.teams.flatMap((team) => [
        prisma.generatedTeam.create({
          data: {
            id: team.id,
            name: team.name,
            sessionId: result.sessionId,
            presetId: presetId ?? null,
          },
        }),
        ...team.members.map(({ member, manuallySwapped }) =>
          prisma.teamMemberLink.create({
            data: { teamId: team.id, memberId: member.id, manuallySwapped },
          })
        ),
      ])
    );
  }

  return NextResponse.json(result);
}
