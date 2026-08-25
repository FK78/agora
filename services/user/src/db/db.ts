import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../config/env.ts";
import * as schema from "./schema.ts";

export const pool = new Pool({
  host: env.HOST,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
});

export const db = drizzle({ client: pool, schema });

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type DbOrTransaction = typeof db | Transaction;
