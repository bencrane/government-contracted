// Design-system primitive layer — the single source of truth for the
// "Refined Federal" aesthetic. Pages/marketing/site/forms compose from here;
// primitives never import upward. See docs/design-system-rebuild.md §3.2–§3.5.

export { Container } from "./container";
export { Section } from "./section";
export { Grid, Cols } from "./grid";
export { Hero } from "./hero";

export { Button } from "./button";
export { Card } from "./card";
export { Eyebrow, MonoLabel } from "./eyebrow";
export { Heading } from "./heading";
export { Text } from "./text";
export { Badge } from "./badge";
export { Stat } from "./stat";
export { Tabs, type TabItem } from "./tabs";

export { useSectionTone, type SectionTone } from "./section-context";
