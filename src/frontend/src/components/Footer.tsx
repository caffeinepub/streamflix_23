export default function Footer() {
  return (
    <footer className="bg-[#0B0B0B] border-t border-[#1A1A1A] mt-16 py-12 px-6 md:px-14">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[#E50914] font-black text-lg tracking-wider mb-6">
          STREAMFLIX
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
          {[
            "FAQ",
            "Help Center",
            "Terms of Use",
            "Privacy",
            "Cookie Preferences",
          ].map((link) => (
            <span
              key={link}
              className="text-[#8E8E8E] text-xs hover:text-white cursor-pointer transition-colors"
            >
              {link}
            </span>
          ))}
        </div>
        <p className="text-[#555] text-xs">
          © {new Date().getFullYear()} StreamFlix. Powered by{" "}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#E50914] transition-colors"
          >
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </div>
    </footer>
  );
}
