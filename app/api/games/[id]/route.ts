import { NextRequest, NextResponse } from "next/server";
import { deleteGame, getGameById, updateGame } from "@/app/lib/games-store";
import { validateGamePayload, type GameInput } from "@/app/lib/game";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/games/[id]
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) {
    return NextResponse.json({ error: "ไม่พบเกมนี้" }, { status: 404 });
  }

  return NextResponse.json({ game });
}

// PUT /api/games/[id] — แก้ไขเกม
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const error = validateGamePayload(body);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const input: GameInput = {
    name: body.name.trim(),
    platform: body.platform,
    hours: body.hours,
    status: body.status,
  };

  const game = await updateGame(id, input);

  if (!game) {
    return NextResponse.json({ error: "ไม่พบเกมนี้" }, { status: 404 });
  }

  return NextResponse.json({ game });
}

// DELETE /api/games/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;
  const ok = await deleteGame(id);

  if (!ok) {
    return NextResponse.json({ error: "ไม่พบเกมนี้" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
