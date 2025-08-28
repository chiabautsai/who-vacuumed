import { betterAuth } from "better-auth";
import { createAuthClient } from "better-auth/react";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

import { user, session, account, verification } from "@/db/schema/auth-schema";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  plugins: [nextCookies()],
});

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});
