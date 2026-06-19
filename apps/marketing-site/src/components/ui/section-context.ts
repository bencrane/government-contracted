import { createContext, useContext } from "react";

/** Tone of the surrounding <Section> band. Light bands ("cream"/"slate") keep
 *  copper-600 accents; the dark "navy" band flips accent text to copper-300 and
 *  body text to a light slate so primitives recolor from context, not by hand. */
export type SectionTone = "cream" | "navy" | "slate";

const SectionToneContext = createContext<SectionTone>("cream");

export const SectionToneProvider = SectionToneContext.Provider;

/** Read the ambient Section tone. Defaults to "cream" outside any Section. */
export function useSectionTone(): SectionTone {
  return useContext(SectionToneContext);
}
