import { LockInDetailClient } from "@/components/lockin-detail-client";

export default async function LockInDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LockInDetailClient id={id} />;
}
