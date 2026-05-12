import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Wordmark from "@/components/site/Wordmark";

export default function NotFound() {
  return (
    <main className="paper-grid flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Wordmark href="/" />
        </div>
        <div className="border border-line bg-surface px-8 py-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            404 · Not found
          </p>
          <h1 className="font-display mt-1 text-3xl tracking-tight text-navy-900">
            That page isn&apos;t on the docket.
          </h1>
          <p className="mt-4 text-sm text-slate-600">
            The page you&apos;re looking for isn&apos;t here.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center gap-2 bg-navy-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
          >
            Home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
