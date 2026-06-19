import Wordmark from "./Wordmark";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Wordmark />
        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Government Contracted</p>
          <p>Independent. Not affiliated with SAM.gov, GSA, or any federal agency.</p>
        </div>
      </div>
    </footer>
  );
}
