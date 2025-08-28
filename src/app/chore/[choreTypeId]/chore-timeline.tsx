import { choreEntry, choreType } from "@/db/schema";

export default async function ChoreTimeline({
  chore,
  choreEntries,
}: {
  chore: typeof choreType.$inferSelect;
  choreEntries: (typeof choreEntry.$inferSelect)[];
}) {
  return (
    <div>
      <h1>{chore.name}</h1>
      <p>{chore.description}</p>
      {choreEntries.map((entry) => (
        <div key={entry.id}>
          <div>{entry.id}</div>
          <div>{entry.createdAt.toDateString()}</div>
          <div>{entry.completionPercentage}</div>
        </div>
      ))}
    </div>
  );
}
