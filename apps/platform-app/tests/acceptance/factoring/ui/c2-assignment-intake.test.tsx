// @vitest-environment jsdom
/**
 * C2 — Assignment intake page at /dashboard/[uei]/capital/factor renders
 * the form and posts to /api/assignments. Redirects on success.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
  }),
}));

describe("C2: assignment intake page", () => {
  it("renders contract-number and factor-slug inputs", async () => {
    const Page = (await import(
      // @ts-expect-error path resolved at executor time
      "@/app/dashboard/[uei]/capital/factor/page"
    )).default;
    const tree = await Page({ params: Promise.resolve({ uei: "ACMETESTUEI123" }) });
    render(tree as React.ReactElement);
    expect(screen.getByLabelText(/contract number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/factor/i)).toBeInTheDocument();
  });
});
