import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameById } from "@/app/lib/games-store";
import { GAME_STATUS_LABELS } from "@/app/lib/game";

type GameDetailPageProps = {
  params: Promise<{ id: string }>;
};

// อ่านจาก games-store (ไฟล์ JSON ฝั่ง server) ชุดเดียวกับที่ /api/games ใช้
// เกมที่เพิ่ม/แก้ไขผ่านฟอร์มในหน้า /games จะมีหน้ารายละเอียดที่นี่ได้จริง ไม่ใช่แค่เกมตั้งต้น
export async function generateMetadata({
  params,
}: GameDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) {
    return { title: "ไม่พบเกมนี้" };
  }

  return { title: game.name };
}

export default async function GameDetailPage({
  params,
}: GameDetailPageProps) {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) {
    notFound();
  }

  return (
    <main className="game-detail-page">
      <Link href="/games" className="back-link">
        ← กลับไปที่ Game Backlog
      </Link>

      <span className={`status-badge status-${game.status}`}>
        {GAME_STATUS_LABELS[game.status]}
      </span>

      <h1>{game.name}</h1>

      <dl className="game-detail-list">
        <div>
          <dt>แพลตฟอร์ม</dt>
          <dd>🎮 {game.platform}</dd>
        </div>

        <div>
          <dt>จำนวนชั่วโมงที่คาดว่าจะใช้เล่น</dt>
          <dd>⏱️ {game.hours} ชั่วโมง</dd>
        </div>

        <div>
          <dt>สถานะ</dt>
          <dd>{GAME_STATUS_LABELS[game.status]}</dd>
        </div>
      </dl>
    </main>
  );
}
