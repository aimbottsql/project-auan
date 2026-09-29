// Server-only "ฐานข้อมูล" แบบไฟล์ JSON สำหรับเกม — ให้ /games (client, ผ่าน API)
// และ /games/[id] (Server Component) อ่าน/เขียนข้อมูลชุดเดียวกันได้จริง ข้อมูลจึงอยู่รอด
// ข้าม refresh/navigate (ต่างจากเก็บไว้ใน React state เฉยๆ)
//
// หมายเหตุ: เขียนไฟล์ลงดิสก์ตรงๆแบบนี้ใช้ได้เฉพาะตอนรันบนเซิร์ฟเวอร์ที่มี filesystem เขียนได้
// (เช่นรันเองบนเครื่อง/VM) ถ้าจะ deploy ขึ้น serverless (เช่น Vercel) ต้องเปลี่ยนไปใช้ฐานข้อมูลจริงแทน
import { promises as fs } from "fs";
import path from "path";
import type { Game } from "@/app/types/game";
import { initialGames } from "@/app/data/games";

const DATA_FILE = path.join(process.cwd(), "data", "games.json");

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(initialGames, null, 2),
      "utf-8"
    );
  }
}

export async function readGames(): Promise<Game[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Game[];
}

async function writeGames(games: Game[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(games, null, 2), "utf-8");
}

export async function getGameById(id: string): Promise<Game | undefined> {
  const games = await readGames();
  return games.find((game) => game.id === id);
}

export async function createGame(input: Omit<Game, "id">): Promise<Game> {
  const games = await readGames();
  const game: Game = { ...input, id: crypto.randomUUID() };
  await writeGames([...games, game]);
  return game;
}

export async function updateGame(
  id: string,
  input: Omit<Game, "id">
): Promise<Game | undefined> {
  const games = await readGames();
  const index = games.findIndex((game) => game.id === id);

  if (index === -1) return undefined;

  const updated: Game = { ...input, id };
  games[index] = updated;
  await writeGames(games);

  return updated;
}

export async function deleteGame(id: string): Promise<boolean> {
  const games = await readGames();
  const next = games.filter((game) => game.id !== id);

  if (next.length === games.length) return false;

  await writeGames(next);
  return true;
}
