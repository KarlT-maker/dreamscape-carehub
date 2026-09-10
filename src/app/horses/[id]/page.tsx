import { HorseProfile } from "@/components/horse-profile";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; filter?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <HorseProfile
      key={id + (query.tab ?? "") + (query.filter ?? "")}
      id={id}
      initialTab={query.tab}
      historyFilter={query.filter}
    />
  );
}
