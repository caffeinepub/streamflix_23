import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/movies", label: "Movies" },
    { to: "/tv", label: "TV Shows" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B0B0B] shadow-lg"
          : "bg-gradient-to-b from-[#000000cc] to-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-14 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-2xl font-black text-[#E50914] tracking-wider shrink-0"
          >
            STREAMFLIX
          </Link>
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  currentPath === link.to
                    ? "text-white"
                    : "text-[#B3B3B3] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/search" })}
            className="text-[#B3B3B3] hover:text-white transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <button
            type="button"
            className="md:hidden text-[#B3B3B3] hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0B0B0B] border-t border-[#2A2A2A] px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block text-sm font-medium py-2 transition-colors ${
                currentPath === link.to
                  ? "text-white"
                  : "text-[#B3B3B3] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/search"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium py-2 text-[#B3B3B3] hover:text-white transition-colors"
          >
            Search
          </Link>
        </div>
      )}
    </nav>
  );
}
