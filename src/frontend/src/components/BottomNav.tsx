import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Film, Home, Search, Tv, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { to: "/", label: "Home", Icon: Home, ocid: "bottom_nav.home.link" },
  {
    to: "/movies",
    label: "Movies",
    Icon: Film,
    ocid: "bottom_nav.movies.link",
  },
  { to: "/tv", label: "TV Shows", Icon: Tv, ocid: "bottom_nav.tv.link" },
  {
    to: "/search",
    label: "Search",
    Icon: Search,
    ocid: "bottom_nav.search.link",
  },
  {
    to: "/profile",
    label: "Profile",
    Icon: User,
    ocid: "bottom_nav.profile.link",
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [bouncingTab, setBouncingTab] = useState<string | null>(null);
  const prevPathRef = useRef(currentPath);

  useEffect(() => {
    if (currentPath !== prevPathRef.current) {
      setBouncingTab(currentPath);
      const timer = setTimeout(() => setBouncingTab(null), 500);
      prevPathRef.current = currentPath;
      return () => clearTimeout(timer);
    }
  }, [currentPath]);

  const handleNav = (to: string) => {
    navigate({ to });
  };

  return (
    <>
      <style>{`
        @keyframes nav-bounce {
          0%   { transform: translateY(1px) scale(1.1); }
          20%  { transform: translateY(-6px) scale(1.25); }
          40%  { transform: translateY(2px) scale(1.05); }
          60%  { transform: translateY(-3px) scale(1.15); }
          80%  { transform: translateY(1px) scale(1.08); }
          100% { transform: translateY(1px) scale(1.1); }
        }
        .nav-icon-bounce {
          animation: nav-bounce 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
      `}</style>
      <nav
        className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-lg"
        style={{ transform: "translateX(-50%)" }}
      >
        {/* Outer glow layer */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow:
              "0 0 40px rgba(229,9,20,0.08), 0 20px 60px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6)",
          }}
        />
        <div
          className="relative flex items-stretch h-16 rounded-2xl overflow-hidden border border-white/[0.08]"
          style={{
            background:
              "linear-gradient(135deg, rgba(22,22,22,0.97) 0%, rgba(14,14,14,0.98) 50%, rgba(18,18,18,0.97) 100%)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:
              "0 -1px 0 rgba(255,255,255,0.06) inset, 0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5), 0 -2px 6px rgba(229,9,20,0.08)",
          }}
        >
          {/* Top highlight edge */}
          <div
            className="absolute top-0 left-4 right-4 h-px rounded-full pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 70%, transparent)",
            }}
          />

          {navItems.map(({ to, label, Icon, ocid }) => {
            const isActive = currentPath === to;
            const isBouncing = bouncingTab === to;
            return (
              <button
                key={to}
                type="button"
                data-ocid={ocid}
                onClick={() => handleNav(to)}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative group transition-all duration-200"
                style={{
                  background: isActive ? "rgba(229,9,20,0.06)" : "transparent",
                }}
              >
                {/* Hover background */}
                <span
                  className="absolute inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                  }}
                />

                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="absolute top-1.5 w-1 h-1 rounded-full"
                    style={{
                      background: "#E50914",
                      boxShadow: "0 0 6px 2px rgba(229,9,20,0.6)",
                    }}
                  />
                )}

                <Icon
                  key={isBouncing ? `${to}-bounce` : to}
                  size={20}
                  className={`relative z-10 transition-colors duration-200${
                    isBouncing ? " nav-icon-bounce" : ""
                  }`}
                  style={{
                    color: isActive ? "#E50914" : "#888",
                    filter: isActive
                      ? "drop-shadow(0 0 6px rgba(229,9,20,0.8)) drop-shadow(0 0 12px rgba(229,9,20,0.4))"
                      : undefined,
                    transform:
                      isActive && !isBouncing
                        ? "translateY(1px) scale(1.1)"
                        : undefined,
                  }}
                />
                <span
                  className="relative z-10 text-[9px] font-semibold tracking-wide transition-all duration-200"
                  style={{
                    color: isActive ? "#E50914" : "#666",
                    letterSpacing: "0.06em",
                    textShadow: isActive
                      ? "0 0 8px rgba(229,9,20,0.5)"
                      : undefined,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
