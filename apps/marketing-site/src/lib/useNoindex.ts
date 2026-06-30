import { useEffect } from "react";

/** Inject <meta name="robots" content="noindex,nofollow"> for the lifetime of a
 *  route, removing it on unmount so other routes stay indexable. This is a
 *  client-rendered SPA, so a route-scoped meta can't live in the static
 *  index.html (that would noindex the whole site). Pairs with public/robots.txt
 *  to keep an internal page (e.g. /brand-preview) out of search results. */
export function useNoindex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);
}
