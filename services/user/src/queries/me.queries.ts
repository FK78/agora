import { eq } from "drizzle-orm";
import { db, type DbOrTransaction } from "../db/db.ts";
import { type Address, addresses } from "../db/schema.ts";

/**
 * @param userId - User ID (UUID)
 * @param dbOrTx - Database instance or transaction (defaults to main db)
 * @returns Array of user's addresses
 */
export const getAddresses = async (
  userId: string,
  dbOrTx: DbOrTransaction = db
): Promise<Address[]> => {
  return dbOrTx
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId));
};
