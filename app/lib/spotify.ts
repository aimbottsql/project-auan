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

type RawSpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  album?: { images?: { url: string }[] };
  preview_url?: string | null;
  external_urls?: { spotify?: string };
};

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

// ดึงเพลงฮิตของศิลปิน (สูงสุด 10 เพลง)
export async function getArtistTopTracks(
  artistId: string,
  market = "TH"
): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch(
    `/artists/${artistId}/top-tracks?market=${market}`
  );

  return (data.tracks ?? []).map((track: RawSpotifyTrack) => ({
    id: track.id,
    name: track.name,
    albumImage: track.album?.images?.[0]?.url ?? null,
    previewUrl: track.preview_url ?? null,
    spotifyUrl: track.external_urls?.spotify ?? "",
    durationMs: track.duration_ms,
  }));
}
