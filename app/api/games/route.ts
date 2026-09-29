import { NextRequest, NextResponse } from "next/server";
import { createGame, readGames } from "@/app/lib/games-store";
import { validateGamePayload, type GameInput } from "@/app/lib/game";

// GET /api/games — รายการเกมทั้งหมด
export async function GET() {
  const games = await readGames();
  return NextResponse.json({ games });
}

// POST /api/games — เพิ่มเกมใหม่
export async function POST(request: NextRequest) {
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

  const game = await createGame(input);

  return NextResponse.json({ game }, { status: 201 });
}
