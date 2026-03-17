import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PresetUpdateSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/authUtils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const { id } = await params;
  const preset = await prisma.preset.findUnique({ where: { id } });
  if (!preset) return NextResponse.json({ error: "Preset not found." }, { status: 404 });
  return NextResponse.json(preset);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const { id } = await params;
  const preset = await prisma.preset.findUnique({ where: { id } });
  if (!preset) return NextResponse.json({ error: "Preset not found." }, { status: 404 });

  const body = await req.json();
  const parsed = PresetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  if (parsed.data.name && parsed.data.name !== preset.name) {
    const conflict = await prisma.preset.findUnique({ where: { name: parsed.data.name } });
    if (conflict) {
      return NextResponse.json({ error: "A preset with this name already exists." }, { status: 409 });
    }
  }

  const updated = await prisma.preset.update({
    where: { id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.config ? { config: parsed.data.config } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const { id } = await params;
  const preset = await prisma.preset.findUnique({ where: { id } });
  if (!preset) return NextResponse.json({ error: "Preset not found." }, { status: 404 });

  await prisma.preset.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
