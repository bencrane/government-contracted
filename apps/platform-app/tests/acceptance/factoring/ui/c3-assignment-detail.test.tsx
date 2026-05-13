// @vitest-environment jsdom
/**
 * C3 — Assignment detail page at /dashboard/[uei]/capital/factor/[id] shows:
 *   - State + timeline
 *   - Per-party status table
 *   - Document download links
 *   - "Initiate signing" CTA when state=drafted
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
  getAssignmentDetail: vi.fn().mockResolvedValue({
    id: "a1",
    status: "drafted",
    parties: [
      { role: "contractor_assignor", status: "pending" },
      { role: "factor_assignee", status: "pending" },
      { role: "contracting_officer", status: "pending" },
      { role: "disbursing_officer", status: "pending" },
    ],
    documents: [],
    transitions: [],
  }),
}));

describe("C3: assignment detail page", () => {
  it("shows initiate-signing CTA when state=drafted", async () => {
    const Page = (await import(
      // @ts-expect-error path resolved at executor time
      "@/app/dashboard/[uei]/capital/factor/[assignment_id]/page"
    )).default;
    const tree = await Page({
      params: Promise.resolve({ uei: "ACMETESTUEI123", assignment_id: "a1" }),
    });
    render(tree as React.ReactElement);
    expect(screen.getByText(/initiate signing/i)).toBeInTheDocument();
  });
});
