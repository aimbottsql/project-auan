import type { Game } from "@/app/types/game";

// ข้อมูลเกมตั้งต้น — ใช้เป็นค่าเริ่มต้นของ State ในหน้ารายการ
// และเป็นแหล่งข้อมูลของหน้ารายละเอียด /games/[id] (Server Component)
export const initialGames: Game[] = [
  {
    id: "1",
    name: "Elden Ring",
    platform: "PC",
    hours: 60,
    status: "playing",
  },
  {
    id: "2",
    name: "Hades II",
    platform: "PC",
    hours: 25,
    status: "not-started",
  },
  {
    id: "3",
    name: "Baldur's Gate 3",
    platform: "PlayStation 5",
    hours: 90,
    status: "completed",
  },
  {
    id: "4",
    name: "The Legend of Zelda: Tears of the Kingdom",
    platform: "Nintendo Switch",
    hours: 70,
    status: "playing",
  },
  {
    id: "5",
    name: "Stardew Valley",
    platform: "PC",
    hours: 40,
    status: "completed",
  },
  {
    id: "6",
    name: "Hollow Knight",
    platform: "Nintendo Switch",
    hours: 35,
    status: "not-started",
  },
];
