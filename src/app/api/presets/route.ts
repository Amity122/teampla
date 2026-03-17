import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PresetCreateSchema } from "@/lib/validators";

export async function GET() {
  const presets = await prisma.preset.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(presets);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = PresetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.preset.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ error: "A preset with this name already exists." }, { status: 409 });
  }

  const preset = await prisma.preset.create({
    data: { name: parsed.data.name, config: parsed.data.config },
  });
  return NextResponse.json(preset, { status: 201 });
}
