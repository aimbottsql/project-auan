"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Game, GameStatus } from "@/app/types/game";
import {
  GAME_PLATFORMS,
  GAME_STATUSES,
  GAME_STATUS_LABELS,
} from "@/app/lib/game";
import { useGamesStore } from "@/app/lib/games-store-client";

type GameFormState = {
  name: string;
  platform: string;
  // เก็บเป็น string เพราะเป็น controlled input ต้องยอมให้ช่องว่างระหว่างพิมพ์ได้
  hours: string;
  status: GameStatus;
};

type FormErrors = Partial<Record<keyof GameFormState, string>>;

const emptyForm: GameFormState = {
  name: "",
  platform: "",
  hours: "",
  status: "not-started",
};

function validate(form: GameFormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "กรุณากรอกชื่อเกม";
  }

  if (!form.platform) {
    errors.platform = "กรุณาเลือกแพลตฟอร์ม";
  }

  if (!form.hours.trim()) {
    errors.hours = "กรุณากรอกจำนวนชั่วโมง";
  } else {
    const hoursValue = Number(form.hours);

    if (!Number.isInteger(hoursValue) || hoursValue <= 0) {
      errors.hours = "จำนวนชั่วโมงต้องเป็นจำนวนเต็มบวก";
    }
  }

  return errors;
}

export default function GamesPage() {
  // รายการเกม + ค้นหา/กรอง/ยืนยันลบ อยู่ใน Zustand store กลาง (ดู app/lib/games-store-client.ts)
  const games = useGamesStore((state) => state.games);
  const isLoading = useGamesStore((state) => state.isLoading);
  const storeError = useGamesStore((state) => state.error);
  const keyword = useGamesStore((state) => state.keyword);
  const statusFilter = useGamesStore((state) => state.statusFilter);
  const pendingDeleteId = useGamesStore((state) => state.pendingDeleteId);

  const fetchGames = useGamesStore((state) => state.fetchGames);
  const addGame = useGamesStore((state) => state.addGame);
  const editGame = useGamesStore((state) => state.editGame);
  const removeGame = useGamesStore((state) => state.removeGame);
  const setStatus = useGamesStore((state) => state.setStatus);
  const setKeyword = useGamesStore((state) => state.setKeyword);
  const setStatusFilter = useGamesStore((state) => state.setStatusFilter);
  const requestDelete = useGamesStore((state) => state.requestDelete);
  const cancelDelete = useGamesStore((state) => state.cancelDelete);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // ฟอร์มเพิ่ม/แก้ไขเกม — Controlled Input ที่เก็บทุกฟิลด์ไว้ใน State ก้อนเดียว
  const [form, setForm] = useState<GameFormState>(emptyForm);

  // ข้อความแจ้งเตือนของแต่ละฟิลด์ที่ไม่ผ่านการตรวจสอบ
  const [errors, setErrors] = useState<FormErrors>({});

  // ข้อความ error ตอนบันทึกไม่สำเร็จ (เช่น เรียก API ไม่ผ่าน) แยกจาก error รายฟิลด์
  const [submitError, setSubmitError] = useState<string | null>(null);

  // id ของเกมที่กำลังแก้ไขอยู่ (null = กำลังเพิ่มเกมใหม่)
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleFieldChange<K extends keyof GameFormState>(
    field: K,
    value: GameFormState[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(form);
    setErrors(validationErrors);
    setSubmitError(null);

    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      platform: form.platform,
      hours: Number(form.hours),
      status: form.status,
    };

    try {
      if (editingId) {
        await editGame(editingId, payload);
      } else {
        await addGame(payload);
      }

      handleCancelEdit();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"
      );
    }
  }

  // แก้ไข: ดึงค่าเดิมของเกมกลับเข้าฟอร์ม
  function handleEdit(game: Game) {
    setForm({
      name: game.name,
      platform: game.platform,
      hours: String(game.hours),
      status: game.status,
    });
    setEditingId(game.id);
    setErrors({});
    setSubmitError(null);
  }

  async function handleConfirmDelete(id: string) {
    try {
      await removeGame(id);
      if (editingId === id) handleCancelEdit();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "ลบไม่สำเร็จ");
    }
  }

  function handleCancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setSubmitError(null);
  }

  // Derived state: จำนวนชั่วโมงรวมของเกมที่ยังไม่เริ่ม (คำนวณจาก games ทุกครั้งที่ render ไม่ได้เก็บเป็น state)
  const notStartedHours = useMemo(
    () =>
      games
        .filter((game) => game.status === "not-started")
        .reduce((sum, game) => sum + game.hours, 0),
    [games]
  );

  // กรองตามคำค้นหา + สถานะ พร้อมกัน
  const displayedGames = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return games.filter((game) => {
      const matchesKeyword =
        !normalizedKeyword ||
        game.name.toLowerCase().includes(normalizedKeyword);
      const matchesStatus =
        statusFilter === "all" || game.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [games, keyword, statusFilter]);

  return (
    <main className="games-page">
      <section className="games-hero">
        <img
          src="/images/games/monchhichi.gif"
          alt=""
          className="games-mascot"
          width={72}
          height={72}
        />

        <p className="eyebrow">MY GAME BACKLOG</p>
        <h1>Game Backlog</h1>
        <p className="subtitle">บันทึกรายการเกมที่สนใจจะเล่น 🎮</p>

        <div className="follow-summary">
          ⏱️ เกมที่ยังไม่เริ่ม รวม <strong>{notStartedHours}</strong> ชั่วโมง
        </div>
      </section>

      <section className="game-form-section">
        <form className="game-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "แก้ไขเกม" : "เพิ่มเกมใหม่"}</h2>

          <div className="field">
            <label htmlFor="game-name">ชื่อเกม</label>
            <input
              id="game-name"
              type="text"
              value={form.name}
              onChange={(event) =>
                handleFieldChange("name", event.target.value)
              }
              placeholder="เช่น Elden Ring"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="field">
            <label htmlFor="game-platform">แพลตฟอร์ม</label>
            <select
              id="game-platform"
              value={form.platform}
              onChange={(event) =>
                handleFieldChange("platform", event.target.value)
              }
            >
              <option value="">-- เลือกแพลตฟอร์ม --</option>
              {GAME_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            {errors.platform && (
              <span className="field-error">{errors.platform}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="game-hours">จำนวนชั่วโมงที่คาดว่าจะใช้เล่น</label>
            <input
              id="game-hours"
              type="number"
              min={1}
              step={1}
              value={form.hours}
              onChange={(event) =>
                handleFieldChange("hours", event.target.value)
              }
              placeholder="เช่น 40"
            />
            {errors.hours && (
              <span className="field-error">{errors.hours}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="game-status">สถานะ</label>
            <select
              id="game-status"
              value={form.status}
              onChange={(event) =>
                handleFieldChange("status", event.target.value as GameStatus)
              }
            >
              {GAME_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {GAME_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {submitError && <p className="field-error">{submitError}</p>}

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editingId ? "บันทึกการแก้ไข" : "+ เพิ่มเกม"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancelEdit}
              >
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="games-toolbar">
        <div className="search-box">
          <span>🔎</span>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="ค้นหาชื่อเกม..."
            aria-label="ค้นหาเกม"
          />
          {keyword && <button onClick={() => setKeyword("")}>✕</button>}
        </div>

        <div className="filter-bar">
          <label htmlFor="status-filter">กรองตามสถานะ</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as GameStatus | "all")
            }
          >
            <option value="all">ทั้งหมด</option>
            {GAME_STATUSES.map((status) => (
              <option key={status} value={status}>
                {GAME_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {isLoading && <p className="games-status-text">กำลังโหลดรายการเกม...</p>}

      {storeError && !isLoading && (
        <p className="games-status-text error">{storeError}</p>
      )}

      {!isLoading && !storeError && displayedGames.length === 0 && (
        <section className="empty-state">
          <img
            src="/images/games/monchhichi.gif"
            alt=""
            className="games-mascot games-mascot-lg"
            width={110}
            height={110}
          />
          <h2>ไม่พบเกมที่ตรงกับเงื่อนไข</h2>
          <p>ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะดู</p>
        </section>
      )}

      {!isLoading && !storeError && displayedGames.length > 0 && (
        <section className="game-list">
          {displayedGames.map((game) => (
            <article key={game.id} className="game-card">
              <div className="game-card-main">
                <h3>{game.name}</h3>

                <span className={`status-badge status-${game.status}`}>
                  {GAME_STATUS_LABELS[game.status]}
                </span>
              </div>

              <p className="game-meta">
                🎮 {game.platform} &nbsp;·&nbsp; ⏱️ {game.hours} ชั่วโมง
              </p>

              {/* เปลี่ยนสถานะได้ตรงนี้เลย โดยไม่ต้องเปิดฟอร์มแก้ไข */}
              <div className="status-switch">
                {GAME_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={
                      status === game.status
                        ? "status-switch-btn active"
                        : "status-switch-btn"
                    }
                    disabled={status === game.status}
                    onClick={() => setStatus(game.id, status)}
                  >
                    {GAME_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>

              <div className="game-card-actions">
                <Link href={`/games/${game.id}`} className="detail-link">
                  ดูรายละเอียด →
                </Link>

                <button
                  type="button"
                  className="edit-btn"
                  onClick={() => handleEdit(game)}
                >
                  แก้ไข
                </button>

                {pendingDeleteId === game.id ? (
                  <span className="confirm-delete">
                    <span>ลบเกมนี้?</span>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleConfirmDelete(game.id)}
                    >
                      ยืนยัน
                    </button>
                    <button
                      type="button"
                      className="cancel-btn-sm"
                      onClick={cancelDelete}
                    >
                      ยกเลิก
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => requestDelete(game.id)}
                  >
                    ลบ
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
