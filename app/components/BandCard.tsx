import Image from "next/image";
import type { Band } from "@/app/types/band";

type BandCardProps = {
  band: Band;
  isFollowed: boolean;
  likeCount: number;
  onFollow: () => void;
  onLike: () => void;
  onShowTracks: () => void;
};

export default function BandCard({
  band,
  isFollowed,
  likeCount,
  onFollow,
  onLike,
  onShowTracks,
}: BandCardProps) {
  return (
    <article className="band-card">
      <div className="band-image">
        <Image
          src={band.image}
          alt={band.name}
          width={500}
          height={300}
        />

        <div className="image-overlay">
          <span>♪</span>
        </div>
      </div>

      <div className="band-content">
        <h2>{band.name}</h2>

        <span className="genre">
          {band.genre}
        </span>

        <p className="description">
          {band.description}
        </p>

        <p className="founded-year">
          🎵 ก่อตั้งปี {band.foundedYear}
        </p>

        <div className="actions">
          <button
            className={
              isFollowed
                ? "follow-btn followed"
                : "follow-btn"
            }
            onClick={onFollow}
          >
            {isFollowed
              ? "✓ ติดตามแล้ว"
              : "+ ติดตาม"}
          </button>

          <button
            className="like-btn"
            onClick={onLike}
          >
            ❤️ Like {likeCount}
          </button>

          <button
            className="tracks-btn"
            onClick={onShowTracks}
          >
            🎵 ฟังเพลง
          </button>
        </div>

        <div className="members-title">
          <span>สมาชิกวง</span>

          <strong>
            {band.members.length} คน
          </strong>
        </div>

        <ul className="member-list">
          {band.members.map((member) => (
            <li
              key={member.name}
              className="member"
            >
              <Image
                src={member.image}
                alt={member.name}
                width={55}
                height={55}
              />

              <span>
                <strong>
                  {member.name}
                </strong>

                <small>
                  {member.role}
                </small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}