import { NextRequest, NextResponse } from "next/server";
import { findTrack, getArtistById, searchArtist } from "@/app/lib/spotify";
import { getArtistTopTracksLastFm } from "@/app/lib/lastfm";

// GET /api/spotify/tracks?artist=ชื่อวง  หรือ  ?id=spotifyArtistId
//
// ข้อมูลศิลปิน (ชื่อ/รูป/ลิงก์โปรไฟล์) ยังดึงจาก Spotify ตรงๆ ได้ปกติ
// แต่เพลงฮิตดึงจาก Last.fm แทน เพราะ Spotify ปิด endpoint top-tracks ให้แอปที่ไม่มี
// Extended Quota Mode แล้ว (ดูรายละเอียดใน app/lib/spotify.ts และ app/lib/lastfm.ts)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artistName = searchParams.get("artist");
  const artistId = searchParams.get("id");

  if (!artistId && !artistName) {
    return NextResponse.json(
      { error: "ต้องส่ง query param 'artist' หรือ 'id' มาด้วย" },
      { status: 400 }
    );
  }

  try {
    const artist = artistId
      ? await getArtistById(artistId)
      : await searchArtist(artistName as string);

    if (!artist) {
      return NextResponse.json(
        { error: `ไม่พบศิลปิน "${artistName ?? artistId}" บน Spotify` },
        { status: 404 }
      );
    }

    const rankedTracks = await getArtistTopTracksLastFm(artist.name);

    // เอาชื่อเพลงที่ได้จัดอันดับมาจาก Last.fm ไปหา track ID จริงบน Spotify ต่อ
    // เพื่อฝัง embed player ให้กดฟังในหน้าเว็บได้เลย (ไม่ต้องเปิดแอป/แท็บ Spotify)
    const tracks = await Promise.all(
      rankedTracks.map(async (track) => {
        const match = await findTrack(track.name, artist.name).catch(() => null);

        if (!match) return track;

        return {
          ...track,
          albumImage: match.albumImage,
          previewUrl: match.previewUrl,
          spotifyUrl: match.spotifyUrl,
          durationMs: match.durationMs || track.durationMs,
          spotifyTrackId: match.id,
        };
      })
    );

    return NextResponse.json({ artist, tracks });
  } catch (error) {
    console.error("โหลดเพลงฮิตไม่สำเร็จ:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ดึงข้อมูลเพลงฮิตไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}
