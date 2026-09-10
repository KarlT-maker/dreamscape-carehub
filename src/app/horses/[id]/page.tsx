import { HorseProfile } from "@/components/horse-profile";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HorseProfile id={id} />;
}
