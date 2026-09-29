import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link href="/">Home</Link>
      <Link href="/courses">Courses</Link>
      <Link href="/about">About</Link>
      <Link href="/bands">Favorite Bands</Link>
      <Link href="/games">Game Backlog</Link>
    </nav>
  );
}