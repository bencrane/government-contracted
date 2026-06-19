/**
 * Mock-data visual markers (red text + "MOCK" badge) on the Overview dashboard.
 *
 * ALWAYS ON — every environment, including prod. Intentional. The flagged tiles
 * (surety, compliance, deadlines, event feed, the d/b/a line) are fabricated
 * placeholders from lib/mock-dashboard.ts with NO live source in catalyst_api or
 * Postgres. Until each is wired to a real read it must read as obviously fake to
 * anyone — operator or end user — looking at the live dashboard.
 *
 * Flip an item off by removing its flagMock wiring once it is backed by live data;
 * flip this whole switch to false only when none of the Overview is mock anymore.
 */
export const SHOW_MOCK_MARKERS = true;
