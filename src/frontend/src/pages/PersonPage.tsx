import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type CombinedCreditItem,
  type PersonDetails,
  fetchPersonCombinedCredits,
  fetchPersonDetails,
  getPosterUrl,
  getProfileUrl,
} from "../lib/tmdb";

export default function PersonPage() {
  const { personId } = useParams({ strict: false }) as { personId: string };
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [credits, setCredits] = useState<CombinedCreditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (!personId) return;
    setLoading(true);
    const id = Number(personId);
    Promise.all([fetchPersonDetails(id), fetchPersonCombinedCredits(id)])
      .then(([p, c]) => {
        setPerson(p);
        const sorted = c.cast
          .filter((item) => item.poster_path)
          .sort((a, b) => b.popularity - a.popularity);
        setCredits(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [personId]);

  function handleCardClick(item: CombinedCreditItem) {
    if (item.media_type === "movie") {
      void navigate({ to: "/movie/$id", params: { id: String(item.id) } });
    } else {
      void navigate({ to: "/tv/$id", params: { id: String(item.id) } });
    }
  }

  const bioText = person?.biography ?? "";
  const bioShort = bioText.slice(0, 400);
  const hasBioMore = bioText.length > 400;

  return (
    <div className="bg-[#0B0B0B] min-h-screen text-white">
      {/* Back button */}
      <div className="sticky top-0 z-30 bg-[#0B0B0B]/80 backdrop-blur-sm px-4 py-3">
        <button
          type="button"
          data-ocid="person.back_button"
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {loading && (
        <div
          data-ocid="person.loading_state"
          className="flex items-center justify-center h-64"
        >
          <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && person && (
        <div className="max-w-6xl mx-auto px-4 pb-16">
          {/* Person header */}
          <div className="flex flex-col sm:flex-row gap-6 mb-10 pt-4">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              {person.profile_path ? (
                <img
                  src={getProfileUrl(person.profile_path, "w342")}
                  alt={person.name}
                  className="w-36 h-36 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-[#2B2B2B] shadow-xl"
                />
              ) : (
                <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-[#2B2B2B] flex items-center justify-center border-4 border-[#333] text-4xl font-bold text-[#555]">
                  {person.name[0]}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold mb-1">
                {person.name}
              </h1>
              {person.known_for_department && (
                <p className="text-[#E50914] font-medium mb-3">
                  {person.known_for_department}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#B3B3B3] mb-4 justify-center sm:justify-start">
                {person.birthday && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {person.birthday}
                    {person.deathday && ` — ${person.deathday}`}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {person.place_of_birth}
                  </span>
                )}
              </div>
              {bioText && (
                <div>
                  <p className="text-[#B3B3B3] text-sm leading-relaxed">
                    {bioExpanded ? bioText : bioShort}
                    {!bioExpanded && hasBioMore && "..."}
                  </p>
                  {hasBioMore && (
                    <button
                      type="button"
                      onClick={() => setBioExpanded((v) => !v)}
                      className="text-[#E50914] text-sm mt-1 hover:underline"
                    >
                      {bioExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Filmography */}
          <div>
            <h2 className="text-white font-bold text-xl mb-6">
              Filmography
              <span className="text-[#555] text-base font-normal ml-2">
                ({credits.length} titles)
              </span>
            </h2>
            {credits.length === 0 ? (
              <p
                data-ocid="person.empty_state"
                className="text-[#555] text-center py-12"
              >
                No filmography found.
              </p>
            ) : (
              <div
                data-ocid="person.list"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              >
                {credits.map((item, idx) => (
                  <button
                    type="button"
                    key={`${item.id}-${item.media_type}`}
                    data-ocid={`person.item.${idx + 1}`}
                    className="card-scale-in cursor-pointer group text-left w-full"
                    style={{ animationDelay: `${(idx % 20) * 50}ms` }}
                    onClick={() => handleCardClick(item)}
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#2B2B2B] mb-2">
                      <img
                        src={getPosterUrl(item.poster_path)}
                        alt={item.title ?? item.name ?? ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Badge */}
                      <div className="absolute top-1.5 left-1.5">
                        <span className="text-[9px] font-bold bg-[#E50914] text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {item.media_type === "movie" ? "M" : "TV"}
                        </span>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#E50914] flex items-center justify-center">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="white"
                            aria-label="Play"
                            role="img"
                          >
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-white text-xs font-medium truncate">
                      {item.title ?? item.name}
                    </p>
                    {item.character && (
                      <p className="text-[#555] text-[10px] truncate">
                        as {item.character}
                      </p>
                    )}
                    {item.vote_average > 0 && (
                      <p className="text-[#46D369] text-[10px]">
                        ★ {item.vote_average.toFixed(1)}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
