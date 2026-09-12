export type BandMember = {
  name: string;
  role: string;
  image: string;
};

export type Band = {
  id: number;
  name: string;
  genre: string;
  description: string;
  image: string;
  foundedYear: number;
  members: BandMember[];
  // ไม่บังคับ: ถ้ารู้ Spotify Artist ID อยู่แล้วจะแม่นยำกว่าการค้นหาด้วยชื่อ
  spotifyId?: string;
  // รายชื่อเพลงที่ใส่ไว้ล่วงหน้า ใช้โชว์แทนตอนที่ Spotify API ใช้งานไม่ได้
  // (เช่น ตอนที่ยังรอ Spotify sync สถานะ Premium ของแอป) พอ API กลับมาใช้ได้
  // ระบบจะสลับไปโชว์ข้อมูลจริงจาก Spotify ให้อัตโนมัติ
  fallbackTracks?: string[];
};