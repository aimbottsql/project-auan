"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Band } from "@/app/types/band";
import type { SpotifyTrack, SpotifyArtistResult } from "@/app/lib/spotify";

type SpotifyTracksModalProps = {
  band: Band;
  onClose: () => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; artist: SpotifyArtistResult | null; tracks: SpotifyTrack[] }
  | { status: "fallback"; reason: string };

function spotifySearchUrl(trackName: string, bandName: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${trackName} ${bandName}`)}`;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function SpotifyTracksModal({
  band,
  onClose,
}: SpotifyTracksModalProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // เสียงของตัวเล่น preview (ตอน API เราใช้งานได้)
  const [previewVolume, setPreviewVolume] = useState(0.8);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    const controller = new AbortController();

    async function loadTracks() {
      setState({ status: "loading" });

      const query = band.spotifyId
        ? `id=${encodeURIComponent(band.spotifyId)}`
        : `artist=${encodeURIComponent(band.name)}`;

      try {
        const response = await fetch(`/api/spotify/tracks?${query}`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          if (band.fallbackTracks && band.fallbackTracks.length > 0) {
            setState({
              status: "fallback",
              reason: data.error ?? "โหลดเพลงจาก Spotify ไม่สำเร็จ",
            });
            return;
          }

          setState({
            status: "error",
            message: data.error ?? "โหลดเพลงไม่สำเร็จ",
          });
          return;
        }

        setState({
          status: "success",
          artist: data.artist,
          tracks: data.tracks,
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        if (band.fallbackTracks && band.fallbackTracks.length > 0) {
          setState({
            status: "fallback",
            reason: "เชื่อมต่อ Spotify ไม่สำเร็จ",
          });
          return;
        }

        setState({
          status: "error",
          message: "เชื่อมต่อ Spotify ไม่สำเร็จ ลองใหม่อีกครั้ง",
        });
      }
    }

    loadTracks();

    return () => controller.abort();
  }, [band]);

  function handlePreviewVolumeChange(value: number) {
    setPreviewVolume(value);
    audioRefs.current.forEach((audioEl) => {
      audioEl.volume = value;
    });
  }

  return (
    <div className="spotify-modal-overlay" onClick={onClose}>
      <div
        className="spotify-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="spotify-modal-header">
          <h3>🎵 เพลงฮิตของ {band.name}</h3>
          <button className="spotify-modal-close" onClick={onClose}>
            ✕
          </button>
        </header>

        {state.status === "loading" && (
          <p className="spotify-modal-status">กำลังโหลดเพลง...</p>
        )}

        {state.status === "error" && (
          <p className="spotify-modal-status error">{state.message}</p>
        )}

        {state.status === "fallback" && (
          <>
            <p className="spotify-fallback-note">
              API เพลงของเรายังใช้ไม่ได้ ({state.reason}) — ใช้ตัวเล่นเพลงของ Spotify
              แทนชั่วคราว ฟังได้ในหน้านี้เลย
            </p>

            {band.spotifyId ? (
              <iframe
                title={`เพลงฮิตของ ${band.name} บน Spotify`}
                src={`https://open.spotify.com/embed/artist/${band.spotifyId}?utm_source=generator&theme=0`}
                width="100%"
                height="352"
                style={{ borderRadius: 12, border: "none" }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            ) : (
              <ul className="spotify-track-list">
                {band.fallbackTracks?.map((trackName) => (
                  <li key={trackName} className="spotify-fallback-track">
                    <span>{trackName}</span>

                    <a
                      href={spotifySearchUrl(trackName, band.name)}
                      target="_blank"
                      rel="noreferrer"
                      className="spotify-track-link"
                    >
                      ค้นหาใน Spotify ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {state.status === "success" && state.tracks.length === 0 && (
          <p className="spotify-modal-status">ไม่พบเพลงของศิลปินนี้บน Spotify</p>
        )}

        {state.status === "success" && state.tracks.length > 0 && (
          <>
            {state.tracks.some((track) => track.previewUrl) && (
              <div className="volume-control">
                <span>🔉</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={previewVolume}
                  onChange={(event) =>
                    handlePreviewVolumeChange(Number(event.target.value))
                  }
                  aria-label="ปรับระดับเสียง"
                />
                <span>🔊</span>
              </div>
            )}

            <ul className="spotify-track-list">
              {state.tracks.map((track) => (
                <li key={track.id} className="spotify-track">
                  {track.albumImage && (
                    <Image
                      src={track.albumImage}
                      alt={track.name}
                      width={48}
                      height={48}
                    />
                  )}

                  <div className="spotify-track-info">
                    <strong>{track.name}</strong>
                    <span>{formatDuration(track.durationMs)}</span>
                  </div>

                  {track.previewUrl && (
                    <audio
                      controls
                      src={track.previewUrl}
                      preload="none"
                      ref={(el) => {
                        if (el) {
                          el.volume = previewVolume;
                          audioRefs.current.set(track.id, el);
                        } else {
                          audioRefs.current.delete(track.id);
                        }
                      }}
                    />
                  )}

                  <a
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="spotify-track-link"
                  >
                    เปิดใน Spotify ↗
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        {state.status === "success" && state.artist && (
          <a
            href={state.artist.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="spotify-artist-link"
          >
            ดูโปรไฟล์ {state.artist.name} บน Spotify ↗
          </a>
        )}
      </div>
    </div>
  );
}
