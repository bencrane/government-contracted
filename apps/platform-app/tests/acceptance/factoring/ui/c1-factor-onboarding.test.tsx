// @vitest-environment jsdom
/**
 * C1 — Factor onboarding page at /partner/[slug]/factor-setup renders the
 *      multi-step form and submits to /api/factors. Server-side validation
 *      via Zod; client echoes server errors.
 *
 * RSCs are awaited and converted to a tree via react-dom/server; client
 * components are wrapped with @testing-library/react.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
  }),
}));

describe("C1: factor onboarding page", () => {
  it("renders the form fields for the multi-step wizard", async () => {
    const Page = (await import(
      // @ts-expect-error path resolved at executor time
      "@/app/partner/[slug]/factor-setup/page"
    )).default;

    const tree = await Page({ params: Promise.resolve({ slug: "test-factor" }) });
    render(tree as React.ReactElement);

    expect(screen.getByLabelText(/lockbox bank/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lockbox account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notification email/i)).toBeInTheDocument();
  });
});
