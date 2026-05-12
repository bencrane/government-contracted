import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "New spec — Partner" };

export default async function NewSpecPage({ params }: Props) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      eyebrow="New spec"
      title="Compose a new audience spec."
      description="Typed Pydantic-equivalent spec builder. Choose NAICS, set-aside, agency mix, award-value bands, performance geography, recompete windows. Compile target audience preview before locking."
      backHref={`/partner/${slug}/spec`}
      backLabel="Back to specs"
    />
  );
}
