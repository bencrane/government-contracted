import { Link } from "react-router-dom";

type Props = {
  className?: string;
  href?: string;
};

export default function Wordmark({ className = "", href = "/" }: Props) {
  return (
    <Link to={href} className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden
        className="relative inline-flex h-7 w-7 items-center justify-center"
      >
        <svg
          viewBox="0 0 28 28"
          className="h-7 w-7 text-copper-500 transition-colors group-hover:text-copper-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Outer seal ring */}
          <circle cx="14" cy="14" r="11.5" />
          {/* Inner ring */}
          <circle cx="14" cy="14" r="8.5" />
          {/* Five-pointed star, centered */}
          <path d="M14 8.5 L15.5 12.2 L19.4 12.5 L16.4 15.1 L17.3 18.9 L14 16.9 L10.7 18.9 L11.6 15.1 L8.6 12.5 L12.5 12.2 Z" />
        </svg>
      </span>
      <span className="font-display text-[1.05rem] tracking-tight leading-none text-navy-900">
        Government<span className="text-copper-600"> · </span>Contracted
      </span>
    </Link>
  );
}
