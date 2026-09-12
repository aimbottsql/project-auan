import { NextRequest, NextResponse } from "next/server";
import { getArtistTopTracks, searchArtist } from "@/app/lib/spotify";

// GET /api/spotify/tracks?artist=ชื่อวง  หรือ  ?id=spotifyArtistId
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artistName = searchParams.get("artist");
  let artistId = searchParams.get("id");

  if (!artistId && !artistName) {
    return NextResponse.json(
      { error: "ต้องส่ง query param 'artist' หรือ 'id' มาด้วย" },
      { status: 400 }
    );
  }

  try {
    let artist = null;

    if (!artistId && artistName) {
      artist = await searchArtist(artistName);

      if (!artist) {
        return NextResponse.json(
          { error: `ไม่พบศิลปิน "${artistName}" บน Spotify` },
          { status: 404 }
        );
      }

      artistId = artist.id;
    }

    const tracks = await getArtistTopTracks(artistId as string);

    return NextResponse.json({ artist, tracks });
  } catch (error) {
    console.error("Spotify API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ดึงข้อมูลจาก Spotify ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}
