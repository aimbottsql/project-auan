// Server-only helper สำหรับเรียก Spotify Web API ด้วย Client Credentials flow
// ใช้ได้กับข้อมูล public (ค้นหาศิลปิน / เพลงฮิต) ไม่ต้องให้ผู้ใช้ล็อกอิน Spotify

type SpotifyToken = {
  accessToken: string;
  expiresAt: number; // epoch ms
};

export type SpotifyTrack = {
  id: string;
  name: string;
  albumImage: string | null;
  previewUrl: string | null;
  spotifyUrl: string;
  durationMs: number;
  // Spotify track ID จริง (ถ้าหาแมตช์บน Spotify เจอ) เอาไว้ฝัง embed player เล่นในหน้าเว็บได้เลย
  spotifyTrackId?: string | null;
};

export type SpotifyArtistResult = {
  id: string;
  name: string;
  image: string | null;
  spotifyUrl: string;
};

let cachedToken: SpotifyToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET ใน .env.local"
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`ขอ Spotify access token ไม่สำเร็จ (${response.status})`);
  }

  const data = await response.json();

  cachedToken = {
    accessToken: data.access_token,
    // เผื่อเวลาหมดอายุไว้ 60 วิ เพื่อความปลอดภัย
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.accessToken;
}

async function spotifyFetch(path: string) {
  const token = await getAccessToken();

  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error (${response.status}) at ${path}`);
  }

  return response.json();
}

// ค้นหาศิลปินด้วยชื่อ คืน artist ที่ match มากที่สุด
export async function searchArtist(
  name: string
): Promise<SpotifyArtistResult | null> {
  const data = await spotifyFetch(
    `/search?q=${encodeURIComponent(name)}&type=artist&limit=1`
  );

  const artist = data.artists?.items?.[0];

  if (!artist) return null;

  return {
    id: artist.id,
    name: artist.name,
    image: artist.images?.[0]?.url ?? null,
    spotifyUrl: artist.external_urls?.spotify ?? "",
  };
}

// ดึงข้อมูลศิลปินด้วย Spotify artist ID ตรงๆ (แม่นยำกว่า search เพราะรู้ ID อยู่แล้ว)
export async function getArtistById(
  artistId: string
): Promise<SpotifyArtistResult | null> {
  const artist = await spotifyFetch(`/artists/${artistId}`);

  if (!artist?.id) return null;

  return {
    id: artist.id,
    name: artist.name,
    image: artist.images?.[0]?.url ?? null,
    spotifyUrl: artist.external_urls?.spotify ?? "",
  };
}

// หมายเหตุ: Spotify ปิด endpoint "/artists/{id}/top-tracks" ให้เฉพาะแอปที่ได้ Extended
// Quota Mode ตั้งแต่ พ.ย. 2024 เป็นต้นมา แอป client-credentials ทั่วไปจะโดน 403 เสมอ
// เพลงฮิตจริงจึงไปดึงจาก Last.fm แทน (ดู app/lib/lastfm.ts) ส่วนตรงนี้ใช้ /search (ยังใช้ได้)
// หาเพลงที่ตรงกับชื่อนั้นบน Spotify เพื่อเอา track ID จริงมาฝัง embed player ให้กดฟังในหน้าเว็บได้เลย
export async function findTrack(
  trackName: string,
  artistName: string
): Promise<{
  id: string;
  albumImage: string | null;
  spotifyUrl: string;
  previewUrl: string | null;
  durationMs: number;
} | null> {
  const query = encodeURIComponent(`track:${trackName} artist:${artistName}`);
  const data = await spotifyFetch(`/search?q=${query}&type=track&limit=1`);
  const track = data.tracks?.items?.[0];

  if (!track) return null;

  return {
    id: track.id,
    albumImage: track.album?.images?.[0]?.url ?? null,
    spotifyUrl: track.external_urls?.spotify ?? "",
    // Spotify ปิดการแจก preview_url (30 วิ) ให้แอปทั่วไปไปพร้อมๆกับ top-tracks แล้วเช่นกัน
    // ปัจจุบันจึงมักได้ null เสมอ แต่เผื่อ Spotify กลับมาเปิดให้ในอนาคตก็ยังใช้ได้ทันที
    previewUrl: track.preview_url ?? null,
    durationMs: track.duration_ms,
  };
}
