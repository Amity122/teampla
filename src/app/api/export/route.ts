import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCSV, formatPlainText, formatSlack } from "@/lib/export";
import { ExportRequestSchema } from "@/lib/validators";
import type { Member, Team, WeeklySchedule } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ExportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { sessionId, format } = parsed.data;

  const dbTeams = await prisma.generatedTeam.findMany({
    where: { sessionId },
    include: { memberLinks: { include: { member: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (dbTeams.length === 0) {
    return NextResponse.json(
      { error: `No saved teams found for session '${sessionId}'.` },
      { status: 404 }
    );
  }

  const teams: Team[] = dbTeams.map((t) => ({
    id: t.id,
    name: t.name,
    sessionId: t.sessionId,
    presetId: t.presetId,
    createdAt: t.createdAt.toISOString(),
    members: t.memberLinks.map((link) => ({
      member: {
        ...link.member,
        weeklySchedule: link.member.weeklySchedule as WeeklySchedule,
        updatedAt: link.member.updatedAt.toISOString(),
      } as Member,
      manuallySwapped: link.manuallySwapped,
    })),
  }));

  if (format === "csv") {
    return new NextResponse(formatCSV(teams), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=teams.csv",
      },
    });
  }

  const content = format === "slack" ? formatSlack(teams) : formatPlainText(teams);
  return new NextResponse(content, { headers: { "Content-Type": "text/plain" } });
}
