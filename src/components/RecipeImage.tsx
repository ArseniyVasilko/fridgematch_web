import { BowlArt } from "./illustrations";

/**
 * Recipe photo from TheMealDB (small "/preview" size for cards), or an
 * illustrated placeholder when there is no photo.
 */
export function RecipeImage({
  src,
  alt,
  id,
  size = "card",
  className = "",
}: {
  src: string | null;
  alt: string;
  id: number;
  size?: "card" | "large";
  className?: string;
}) {
  if (src) {
    const url = size === "card" && src.includes("themealdb.com") ? `${src}/medium` : src;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className}`} />
    );
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-sand-deep/70 ${className}`} role="img" aria-label={alt}>
      <BowlArt seed={id} className={size === "large" ? "w-2/5" : "w-1/2"} />
    </div>
  );
}
