export type GameStatus = "not-started" | "playing" | "completed";

export type Game = {
  id: string;
  name: string;
  platform: string;
  // จำนวนชั่วโมงที่คาดว่าจะใช้เล่น (ต้องเป็นจำนวนเต็มบวก)
  hours: number;
  status: GameStatus;
};
