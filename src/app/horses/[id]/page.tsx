import { Suspense } from "react";
import { ProfileRoute } from "@/components/profile-route";
export function generateStaticParams() {
  return [
    "molly",
    "charlie",
    "buddy",
    "daisy",
    "jasper",
    "rosie",
    "session",
  ].map((id) => ({ id }));
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
