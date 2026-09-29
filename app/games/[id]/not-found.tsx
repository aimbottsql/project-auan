import Link from "next/link";

export default function GameNotFound() {
  return (
    <main className="games-page">
      <section className="empty-state">
        <div className="empty-icon">🎮</div>
        <h2>ไม่พบเกมนี้</h2>
        <p>เกมที่คุณหาอาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
        <Link href="/games">
          <button type="button">กลับไปที่ Game Backlog</button>
        </Link>
      </section>
    </main>
  );
}
