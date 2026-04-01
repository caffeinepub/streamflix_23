import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B0B0B] shadow-lg"
          : "bg-gradient-to-b from-[#000000cc] to-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-14 h-16 flex items-center">
        <Link to="/" data-ocid="nav.home.link" className="shrink-0">
          <span className="streamflix-logo-wrapper">
            <span className="streamflix-logo select-none">STREAMFLIX</span>
          </span>
        </Link>
      </div>
    </nav>
  );
}
