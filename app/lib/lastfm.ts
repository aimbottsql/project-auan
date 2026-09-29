// Server-only helper สำหรับดึง "เพลงฮิตของศิลปิน" จาก Last.fm
// ใช้แทน Spotify top-tracks endpoint ที่ปิดให้แอป client-credentials ทั่วไปแล้ว (ดู app/lib/spotify.ts)
// Last.fm ให้ API key ได้ทันทีไม่ต้องรออนุมัติ: https://www.last.fm/api/account/create
import type { SpotifyTrack } from "@/app/lib/spotify";

const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

type RawLastFmSearchArtist = {
  name: string;
  mbid?: string; // MusicBrainz ID เอาไว้ระบุตัวศิลปินแบบเจาะจง กันชนชื่อซ้ำกับวงอื่น
};

type RawLastFmTrack = {
  name: string;
  duration?: string; // วินาที เป็น string, ไม่มี field นี้เลยถ้าไม่รู้
};

async function lastFmFetch(params: Record<string, string>) {
  const apiKey = process.env.LASTFM_API_KEY;

  if (!apiKey) {
    throw new Error("ยังไม่ได้ตั้งค่า LASTFM_API_KEY ใน .env.local");
  }

  const query = new URLSearchParams({
    ...params,
    api_key: apiKey,
    format: "json",
  });

  const response = await fetch(`${LASTFM_BASE_URL}?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`Last.fm API error (${response.status})`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.message ?? "เรียก Last.fm ไม่สำเร็จ");
  }

  return data;
}

// ค้นหาศิลปินด้วยชื่อก่อน แล้วเลือกตัวที่ชื่อตรงที่สุด (ไม่ใช่ตัวที่คนฟังมากสุด)
// เพราะชื่อวงสั้นๆอย่าง "Dept" ชนกับวงอื่นที่มีชื่อคล้ายกันบน Last.fm ได้ง่าย
// ถ้าเจอ mbid (MusicBrainz ID) จะใช้ตัวนั้นระบุตัวศิลปินตอนดึงเพลงฮิต แม่นยำกว่าใช้ชื่อเดามั่วๆ
async function resolveLastFmArtist(
  name: string
): Promise<{ name: string; mbid?: string } | null> {
  const data = await lastFmFetch({
    method: "artist.search",
    artist: name,
    limit: "5",
  });

  const matches: RawLastFmSearchArtist[] =
    data.results?.artistmatches?.artist ?? [];

  if (matches.length === 0) return null;

  const exactMatch = matches.find(
    (candidate) => candidate.name.toLowerCase() === name.toLowerCase()
  );

  return exactMatch ?? matches[0];
}

function spotifySearchUrl(trackName: string, artistName: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(
    `${trackName} ${artistName}`
  )}`;
}

// ดึงเพลงฮิตของศิลปินจาก Last.fm (สูงสุด `limit` เพลง) แล้วแปลงให้อยู่ในรูปแบบเดียวกับ SpotifyTrack
// เพื่อให้ฝั่ง UI (SpotifyTracksModal) ใช้งานได้เหมือนตอนดึงจาก Spotify ตรงๆ
export async function getArtistTopTracksLastFm(
  artistName: string,
  limit = 10
): Promise<SpotifyTrack[]> {
  const artist = await resolveLastFmArtist(artistName);

  if (!artist) {
    throw new Error(`ไม่พบศิลปิน "${artistName}" บน Last.fm`);
  }

  const data = await lastFmFetch(
    artist.mbid
      ? { method: "artist.gettoptracks", mbid: artist.mbid, limit: String(limit) }
      : { method: "artist.gettoptracks", artist: artist.name, limit: String(limit) }
  );

  const rawTracks = data.toptracks?.track;
  // Last.fm คืนเป็น object เดี่ยวๆ (ไม่ห่อ array) ถ้าเจอเพลงเดียว เลยต้องกันไว้
  const tracks: RawLastFmTrack[] = Array.isArray(rawTracks)
    ? rawTracks
    : rawTracks
      ? [rawTracks]
      : [];

  return tracks.map((track, index) => {
    const durationSeconds = Number(track.duration ?? 0);

    return {
      id: `lastfm-${index}-${track.name}`,
      name: track.name,
      albumImage: null,
      previewUrl: null,
      // Last.fm ไม่มีลิงก์ Spotify ตรงๆ เลยพาไปค้นหาเพลงนี้บน Spotify แทน
      spotifyUrl: spotifySearchUrl(track.name, artistName),
      durationMs: durationSeconds > 0 ? durationSeconds * 1000 : 0,
    };
  });
}
