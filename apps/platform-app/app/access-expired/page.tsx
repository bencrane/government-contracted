import { signOut } from "@/app/auth/actions";
import Wordmark from "@/components/site/Wordmark";

export const metadata = {
  title: "No access — Government Contracted",
};

export default function AccessExpiredPage() {
  return (
    <main className="paper-grid flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Wordmark href="/login" />
        </div>

        <div className="border border-line bg-surface px-8 py-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            No access yet
          </p>
          <h1 className="font-display mt-1 text-3xl leading-tight tracking-tight text-navy-900">
            Your account isn&apos;t linked to an organization.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Government Contracted is invite-only. If you should have access, reach
            out to{" "}
            <a
              href="mailto:partners@governmentcontracted.com"
              className="font-medium text-navy-700 hover:text-navy-800"
            >
              partners@governmentcontracted.com
            </a>{" "}
            and we&apos;ll get you linked up.
          </p>

          <form action={signOut} className="mt-8">
            <button
              type="submit"
              className="inline-flex items-center justify-center border border-line-strong bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:border-navy-400 hover:text-navy-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
