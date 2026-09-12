"use client";

import { useState } from "react";
import BandCard from "@/app/components/BandCard";
import SpotifyTracksModal from "@/app/components/SpotifyTracksModal";
import type { Band } from "@/app/types/band";

type SortOption = "name" | "year";

const bands: Band[] = [
  {
    id: 1,
    name: "MIRRR",
    genre: "Pop / R&B",
    description: "วงดนตรีดูโอจากประเทศไทย",
    image: "/images/bands/mirr.jpg",
    foundedYear: 2018,
    spotifyId: "5zSQoNQ9o2dnT1LPTzDxg7",
    members: [
      {
        name: "นาว",
        role: "ร้องนำ",
        image: "/images/bands/mirrr_01.jpg",
      },
      {
        name: "โต",
        role: "ร้องนำ / ดนตรี",
        image: "/images/bands/mirrr_02.jpg",
      },
    ],
    fallbackTracks: [
      "ดอกไม้ไฟ (Fireworks)",
      "นิโคติน (Nicotine)",
      "กี่เหตุผล (1000 Reasons)",
      "เกม (Your Rules)",
    ],
  },

  {
    id: 2,
    name: "Dept",
    genre: "Indie Pop",
    description:
      "วงดนตรีไทยแนว Indie Pop ที่มีเอกลักษณ์ด้านเสียงเพลงและบรรยากาศของเพลง",
    image: "/images/bands/dept.jpg",
    foundedYear: 2015,
    spotifyId: "48JtfAggQQpfUXQNxkGm5U",
    members: [
      {
        name: "ลุค ทศพล",
        role: "ร้องนำ",
        image: "/images/bands/look.png",
      },
      {
        name: "เบนซ์ ภวัต",
        role: "กีตาร์",
        image: "/images/bands/benz.png",
      },
    ],
    fallbackTracks: [
      "17",
      "ฟ้ามืดทีไร",
      "ประกาศให้โลกรู้ (Shoutout)",
      "หมดนี้ให้เธอ (All In)",
    ],
  },

  {
  id: 3,
  name: "Fellow Fellow",
  genre: "Pop",
  description:
    "วงดนตรีดูโอแนวป๊อปฟีลกู๊ด เจ้าของเพลงฮิตดาวหางฮัลเลย์",
  image: "/images/bands/fellow-fellow.jpg",
  foundedYear: 2016,
  spotifyId: "2nOc0WXqsAyy2GuIdlW37c",
  members: [
    {
      name: "ข้าว - ปณิธิ เลิศอุดมธนา",
      role: "ร้องนำ",
      image: "/images/bands/fellow-khao.jpg",
    },
    {
      name: "ที - พิษณุ หทัยพัธลักษณ์",
      role: "กีตาร์และร้องประสาน",
      image: "/images/bands/fellow-tee.jpg",
    },
  ],
  fallbackTracks: [
    "ดาวหางฮัลเลย์ (Halley's Comet)",
    "ฉันคือความทรงจำดีๆ ของเธอรึเปล่า",
    "Proud",
    "ยิ้มง่าย (Better Together)",
  ],
},
];

export default function BandsPage() {
  // ค้นหา
  const [keyword, setKeyword] = useState("");

  // เก็บวงที่ติดตาม
  const [followedBands, setFollowedBands] = useState<number[]>([]);

  // เก็บจำนวน Like ของแต่ละวง
  const [likes, setLikes] = useState<Record<number, number>>({});

  // เงื่อนไขการเรียง
  const [sortBy, setSortBy] = useState<SortOption>("name");

  // วงที่กำลังเปิดดูเพลง (สำหรับ modal)
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);

  // Filter วงตามชื่อ
  const filteredBands = bands.filter((band) =>
    band.name.toLowerCase().includes(keyword.toLowerCase())
  );

  // Sort วง
  const displayedBands = [...filteredBands].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }

    return a.foundedYear - b.foundedYear;
  });

  // Follow / Unfollow
  function handleFollow(bandId: number) {
    setFollowedBands((current) => {
      if (current.includes(bandId)) {
        return current.filter((id) => id !== bandId);
      }

      return [...current, bandId];
    });
  }

  // Like
  function handleLike(bandId: number) {
    setLikes((current) => ({
      ...current,
      [bandId]: (current[bandId] || 0) + 1,
    }));
  }

  // ล้างเงื่อนไข Search และ Sort
  function handleClear() {
    setKeyword("");
    setSortBy("name");
  }

  return (
    <main className="bands-page">
      {/* Header */}
      <section className="bands-hero">
        <div className="reel-row" aria-hidden="true">
          <span className="reel" />
          <p className="eyebrow">MY MUSIC COLLECTION — SIDE A</p>
        </div>

        <h1>Favorite Bands</h1>

        <p className="subtitle">
          รวมวงดนตรีที่ฉันชื่นชอบ 🎧
        </p>

        {/* Search */}
        <div className="search-box">
          <span>🔎</span>

          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="ค้นหาชื่อวงดนตรี..."
          />

          {keyword && (
            <button onClick={() => setKeyword("")}>
              ✕
            </button>
          )}
        </div>

        {/* Search Result */}
        {keyword && filteredBands.length > 0 && (
          <div className="search-result">
            พบ {filteredBands.length} วง
          </div>
        )}

        {/* Sort + Clear */}
        <div className="filter-bar">
          <label htmlFor="sort">
            เรียงตาม
          </label>

          <select
            id="sort"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as SortOption)
            }
          >
            <option value="name">
              ชื่อวง A-Z
            </option>

            <option value="year">
              ปีที่ก่อตั้ง
            </option>
          </select>

          <button
            className="clear-btn"
            onClick={handleClear}
          >
            ↺ ล้างเงื่อนไข
          </button>
        </div>

        {/* Follow Summary */}
        <div className="follow-summary">
          ⭐ กำลังติดตามอยู่{" "}
          <strong>{followedBands.length}</strong> วง
        </div>
      </section>

      {/* Empty State */}
      {displayedBands.length === 0 ? (
        <section className="empty-state">
          <div className="empty-icon">
            🎧
          </div>

          <h2>ไม่พบวงดนตรี</h2>

          <p>
            ไม่พบวงที่ตรงกับ &quot;{keyword}&quot;
          </p>

          <button onClick={handleClear}>
            แสดงวงทั้งหมด
          </button>
        </section>
      ) : (
        /* Band Cards */
        <section className="band-grid">
          {displayedBands.map((band) => (
            <BandCard
              key={band.id}
              band={band}
              isFollowed={followedBands.includes(band.id)}
              likeCount={likes[band.id] || 0}
              onFollow={() => handleFollow(band.id)}
              onLike={() => handleLike(band.id)}
              onShowTracks={() => setSelectedBand(band)}
            />
          ))}
        </section>
      )}

      {selectedBand && (
        <SpotifyTracksModal
          band={selectedBand}
          onClose={() => setSelectedBand(null)}
        />
      )}
    </main>
  );
}