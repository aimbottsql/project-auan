// State ของลิสต์เกมทั้งหน้า ใช้ Zustand (React State Management Library) แทน useState เดี่ยวๆ
// ฟอร์มเพิ่ม/แก้ไขยังคงเป็น useState ในตัว component ตามปกติ (เป็นคนละส่วนกับ state นี้)
"use client";

import { create } from "zustand";
import type { Game, GameStatus } from "@/app/types/game";
import type { GameInput } from "@/app/lib/game";

type StatusFilter = GameStatus | "all";

type GamesState = {
  games: Game[];
  isLoading: boolean;
  error: string | null;

  // ค้นหา + กรองสถานะ (ทำงานพร้อมกันได้)
  keyword: string;
  statusFilter: StatusFilter;

  // id ของเกมที่กำลังรอการยืนยันลบอยู่ (null = ไม่มี)
  pendingDeleteId: string | null;

  fetchGames: () => Promise<void>;
  addGame: (input: GameInput) => Promise<Game>;
  editGame: (id: string, input: GameInput) => Promise<Game>;
  removeGame: (id: string) => Promise<void>;
  setStatus: (id: string, status: GameStatus) => Promise<void>;

  setKeyword: (keyword: string) => void;
  setStatusFilter: (filter: StatusFilter) => void;

  requestDelete: (id: string) => void;
  cancelDelete: () => void;
};

async function parseErrorMessage(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return data?.error ?? fallback;
}

export const useGamesStore = create<GamesState>((set, get) => ({
  games: [],
  isLoading: true,
  error: null,

  keyword: "",
  statusFilter: "all",
  pendingDeleteId: null,

  async fetchGames() {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/games");

      if (!response.ok) {
        throw new Error(
          await parseErrorMessage(response, "โหลดรายการเกมไม่สำเร็จ")
        );
      }

      const data = await response.json();
      set({ games: data.games, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      });
    }
  },

  async addGame(input) {
    const response = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "เพิ่มเกมไม่สำเร็จ"));
    }

    const { game } = await response.json();
    set((state) => ({ games: [...state.games, game] }));
    return game as Game;
  },

  async editGame(id, input) {
    const response = await fetch(`/api/games/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "แก้ไขเกมไม่สำเร็จ"));
    }

    const { game } = await response.json();
    set((state) => ({
      games: state.games.map((g) => (g.id === id ? game : g)),
    }));
    return game as Game;
  },

  async removeGame(id) {
    const response = await fetch(`/api/games/${id}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "ลบเกมไม่สำเร็จ"));
    }

    set((state) => ({
      games: state.games.filter((g) => g.id !== id),
      pendingDeleteId: state.pendingDeleteId === id ? null : state.pendingDeleteId,
    }));
  },

  // เปลี่ยนสถานะเกมตรงจากรายการ โดยไม่ต้องเปิดฟอร์มแก้ไข
  async setStatus(id, status) {
    const game = get().games.find((g) => g.id === id);
    if (!game || game.status === status) return;

    await get().editGame(id, {
      name: game.name,
      platform: game.platform,
      hours: game.hours,
      status,
    });
  },

  setKeyword(keyword) {
    set({ keyword });
  },

  setStatusFilter(filter) {
    set({ statusFilter: filter });
  },

  requestDelete(id) {
    set({ pendingDeleteId: id });
  },

  cancelDelete() {
    set({ pendingDeleteId: null });
  },
}));
