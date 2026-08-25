import { eq, sql } from "drizzle-orm";
import { db, type DbOrTransaction } from "../db/db.ts";
import { users, type User, type NewUser } from "../db/schema.ts";

/**
 * @param name - User's display name
 * @param email - User's email address
 * @param hashedPassword - Bcrypt hash of the password
 * @returns The created user record
 * @throws Error if insert fails (e.g., duplicate email)
 */
export const createUser = async (
  name: string,
  email: string,
  hashedPassword: string
): Promise<User> => {
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: hashedPassword,
    })
    .returning();

  if (!user) {
    throw new Error("Failed to insert user");
  }

  return user;
};

/**
 * @param email - Email to check
 * @returns true if email exists, false otherwise
 */
export const emailExists = async (email: string): Promise<boolean> => {
  // Select just the id (any column works, we just need to check existence)
  // .limit(1) ensures we stop after finding one match
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // If array has any elements, the email exists
  return result.length > 0;
};

/**
 * @param email - Email to search for
 * @returns User record or null if not found
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
};

/**
 * @param id - User ID (UUID)
 * @param dbOrTx - Database instance or transaction (defaults to main db)
 * @returns User record or null if not found
 */
export const findUserById = async (
  id: string,
  dbOrTx: DbOrTransaction = db
): Promise<User | null> => {
  const [user] = await dbOrTx
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
};
