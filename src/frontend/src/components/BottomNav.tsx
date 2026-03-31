import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Film, Home, Search, Tv, User } from "lucide-react";

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0B0B] border-t border-[#2A2A2A] h-14">
      <div className="flex items-stretch h-full">
        {navItems.map(({ to, label, Icon, ocid }) => {
          const isActive = currentPath === to;
          return (
            <button
              key={to}
              type="button"
              data-ocid={ocid}
              onClick={() => navigate({ to })}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Icon
                size={20}
                className={
                  isActive
                    ? "text-[#E50914]"
                    : "text-[#B3B3B3] hover:text-white"
                }
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-[#E50914]" : "text-[#B3B3B3]"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
