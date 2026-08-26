import { eq } from "drizzle-orm";
import { db, type DbOrTransaction } from "../db/db.ts";
import { type Address, type NewAddress, addresses } from "../db/schema.ts";

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

/**
 * Creates a new address for a user
 * @param address - Address data to insert
 * @param dbOrTx - Database instance or transaction (defaults to main db)
 * @returns The created address
 */
export const createAddress = async (
  address: NewAddress,
  dbOrTx: DbOrTransaction = db
): Promise<Address> => {
  const [created] = await dbOrTx
    .insert(addresses)
    .values(address)
    .returning();
  return created!;
};