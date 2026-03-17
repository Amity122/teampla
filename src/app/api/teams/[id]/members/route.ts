import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/authUtils";

type Params = { params: Promise<{ id: string }> };

const BodySchema = z.array(z.string());

export async function PATCH(req: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const { id } = await params;
  const team = await prisma.generatedTeam.findUnique({ where: { id } });
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Body must be an array of member IDs." }, { status: 422 });
  }

  await prisma.$transaction([
    prisma.teamMemberLink.deleteMany({ where: { teamId: id } }),
    ...parsed.data.map((memberId) =>
      prisma.teamMemberLink.create({ data: { teamId: id, memberId } })
    ),
  ]);

  return NextResponse.json({ success: true });
}
