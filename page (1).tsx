import { Suspense } from "react";
import { ProfileRoute } from "@/components/profile-route";
import { HORSE_IDS } from "@/lib/data/roster";

export function generateStaticParams() {
  return [...HORSE_IDS, "session"].map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="empty">Opening horse profile…</div>}>
      <ProfileRoute id={id} />
    </Suspense>
  );
}
