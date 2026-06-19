import { useEffect } from "react";

/** Set document.title for the lifetime of a route, restoring the default on unmount. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
