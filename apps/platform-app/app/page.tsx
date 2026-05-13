import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pool } from "@/lib/audience-specs/db";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find the first active org the user belongs to. Send partner-org members to
  // their spec list; contractor-org members to their contractor dashboard.
  const { rows } = await pool().query<{ slug: string | null; category: string; uei: string | null }>(
    `
    SELECT o.slug, o.category, o.uei
      FROM users u
      JOIN organization_memberships m ON m.user_id = u.id AND m.status = 'active'
      JOIN organizations o ON o.id = m.organization_id
     WHERE u.auth_user_id = $1
     ORDER BY m.created_at ASC
     LIMIT 1
    `,
    [user.id],
  );

  const org = rows[0];
  if (!org) redirect("/access-expired");

  // Contractor-side org with a UEI → contractor dashboard.
  if (org.uei) redirect(`/dashboard/${org.uei}`);

  // Otherwise (partner-side or unclaimed contractor) → partner portal by slug.
  if (org.slug) redirect(`/partner/${org.slug}/spec`);

  redirect("/access-expired");
}
