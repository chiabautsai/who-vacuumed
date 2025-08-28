import { db } from "@/db";
import { choreEntry, choreType } from "@/db/schema";
import { eq } from "drizzle-orm";
import ChoreTimeline from "./chore-timeline";

export default async function Chore({
  params,
}: {
  params: Promise<{ choreTypeId: string }>;
}) {
  const { choreTypeId } = await params;

  const chore = await db
    .select()
    .from(choreType)
    .where(eq(choreType.id, choreTypeId));

  const choreEntries = await db
    .select()
    .from(choreEntry)
    .where(eq(choreEntry.choreTypeId, choreTypeId));

  if (chore.length === 0) {
    return <div>Chore not found</div>;
  }

  return (
    <div>
      <h1>Chore {choreTypeId}</h1>
      <ChoreTimeline chore={chore[0]} choreEntries={choreEntries} />
    </div>
  );
}
