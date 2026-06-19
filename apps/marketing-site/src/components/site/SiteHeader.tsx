import Wordmark from "./Wordmark";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
        <Wordmark />
      </div>
    </header>
  );
}
