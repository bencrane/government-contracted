// @vitest-environment jsdom
/**
 * C4 — Partner factor pipeline at /partner/[slug]/factor-pipeline groups
 * the factor's active assignments by state.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
  }),
}));

vi.mock("@/lib/factoring/queries", () => ({
  getFactorPipeline: vi.fn().mockResolvedValue({
    drafted: [{ id: "a1", contract_number: "W912DR-26-C-0001" }],
    executed: [],
    served: [],
    perfected: [],
  }),
}));

describe("C4: factor pipeline page", () => {
  it("groups assignments by state with section headings", async () => {
    const Page = (await import(
      // @ts-expect-error path resolved at executor time
      "@/app/partner/[slug]/factor-pipeline/page"
    )).default;
    const tree = await Page({ params: Promise.resolve({ slug: "test-factor" }) });
    render(tree as React.ReactElement);
    expect(screen.getByText(/drafted/i)).toBeInTheDocument();
    expect(screen.getByText(/perfected/i)).toBeInTheDocument();
  });
});
