import Link from "next/link";

type Props = {
  title?: string;
  message: string;
};

export function MatchAccessMessage({ title = "Match unavailable", message }: Props) {
  return (
    <div>
      <Link href="/groups" className="text-sm text-green-700 hover:underline">
        ← My groups
      </Link>
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
