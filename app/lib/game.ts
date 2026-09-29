import type { Game, GameStatus } from "@/app/types/game";

// แพลตฟอร์มให้เลือกในฟอร์ม (ป้องกันพิมพ์ชื่อแพลตฟอร์มมั่ว)
export const GAME_PLATFORMS = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X/S",
  "Nintendo Switch",
  "Mobile",
] as const;

export const GAME_STATUSES: GameStatus[] = [
  "not-started",
  "playing",
  "completed",
];

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  "not-started": "ยังไม่เริ่ม",
  playing: "กำลังเล่น",
  completed: "เล่นจบแล้ว",
};

// ตรวจสอบข้อมูลเกมที่จะบันทึก ใช้ร่วมกันทั้งฝั่ง client (ฟอร์ม) และฝั่ง API route
// (payload ตรงนี้เป็นรูปแบบหลังแปลงค่าแล้ว เช่น hours เป็น number ไม่ใช่ string จากฟอร์ม)
export function validateGamePayload(input: {
  name: unknown;
  platform: unknown;
  hours: unknown;
  status: unknown;
}): string | null {
  if (typeof input.name !== "string" || !input.name.trim()) {
    return "กรุณากรอกชื่อเกม";
  }

  if (typeof input.platform !== "string" || !input.platform) {
    return "กรุณาเลือกแพลตฟอร์ม";
  }

  if (
    typeof input.hours !== "number" ||
    !Number.isInteger(input.hours) ||
    input.hours <= 0
  ) {
    return "จำนวนชั่วโมงต้องเป็นจำนวนเต็มบวก";
  }

  if (
    typeof input.status !== "string" ||
    !GAME_STATUSES.includes(input.status as GameStatus)
  ) {
    return "สถานะไม่ถูกต้อง";
  }

  return null;
}

export type GameInput = Omit<Game, "id">;
