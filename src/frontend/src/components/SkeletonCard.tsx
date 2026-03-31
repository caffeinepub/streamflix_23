export default function SkeletonCard() {
  return (
    <div className="shrink-0 w-32 md:w-40 lg:w-44">
      <div className="aspect-[2/3] bg-[#2B2B2B] rounded-lg animate-pulse" />
      <div className="mt-2 h-3 bg-[#2B2B2B] rounded animate-pulse w-3/4" />
    </div>
  );
}
