"use client";

const LOCAL = "bhattacharya.subhodeep";
const DOMAIN = "gmail.com";

/** Shown to humans; no @ in the DOM to deter simple scrapers. */
const DISPLAY = `${LOCAL} [at] ${DOMAIN.replace(".", " [dot] ")}`;

export function ObfuscatedEmail() {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    window.location.href = `mailto:${LOCAL}@${DOMAIN}`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-medium text-green-700 hover:underline"
    >
      {DISPLAY}
    </button>
  );
}
