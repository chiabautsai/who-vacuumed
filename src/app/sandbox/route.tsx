import { NextResponse } from "next/server";
import { db } from "@/db"; // <-- adjust to your drizzle db client path
import { tenant, tenantMember, choreType, choreEntry } from "@/db/schema/main";
import { user } from "@/db/schema";

// Next.js App Router route handler
export async function GET() {
  try {
    // OPTIONAL: clear old data
    await db.delete(choreEntry);
    await db.delete(choreType);
    await db.delete(tenantMember);
    await db.delete(tenant);
    await db.delete(user);

    // Insert mock users
    const [alice, bob] = await db
      .insert(user)
      .values([
        {
          id: "u1",
          name: "Alice Admin",
          email: "alice@example.com",
          emailVerified: true,
        },
        {
          id: "u2",
          name: "Bob Member",
          email: "bob@example.com",
          emailVerified: true,
        },
      ])
      .returning();

    // Insert a tenant
    const [household] = await db
      .insert(tenant)
      .values({
        name: "Happy Household",
        description: "Mock household for chores",
      })
      .returning();

    // Insert tenant members
    await db.insert(tenantMember).values([
      {
        userId: alice.id,
        tenantId: household.id,
        role: "admin",
      },
      {
        userId: bob.id,
        tenantId: household.id,
        role: "member",
      },
    ]);

    // Insert chore types
    const [vacuuming, dishes] = await db
      .insert(choreType)
      .values([
        {
          name: "Vacuuming",
          description: "Vacuum the living room and hallway",
          tenantId: household.id,
        },
        {
          name: "Dishes",
          description: "Wash all the dishes after dinner",
          tenantId: household.id,
        },
      ])
      .returning();

    // Insert chore entries
    await db.insert(choreEntry).values([
      {
        userId: alice.id,
        tenantId: household.id,
        choreTypeId: vacuuming.id,
        completionPercentage: 100,
        comments: "Done thoroughly",
      },
      {
        userId: bob.id,
        tenantId: household.id,
        choreTypeId: dishes.id,
        completionPercentage: 80,
        comments: "Left some pans soaking",
      },
    ]);

    return NextResponse.json({ ok: true, message: "Seed completed" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
