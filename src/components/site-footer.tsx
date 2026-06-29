import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-2 px-4 py-6 text-center text-xs text-gray-500">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/about" className="hover:text-green-700">
            About
          </Link>
          <Link href="/privacy" className="hover:text-green-700">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-green-700">
            Terms
          </Link>
        </nav>
        <p>© {year} CricScheduler. All rights reserved.</p>
      </div>
    </footer>
  );
}
