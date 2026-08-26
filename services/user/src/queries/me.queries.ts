import { eq, and } from "drizzle-orm";
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

/**
 * Updates an address owned by a specific user
 * @param addressId - Address ID (UUID)
 * @param userId - User ID (UUID) - ensures user owns the address
 * @param updates - Partial address fields to update
 * @param dbOrTx - Database instance or transaction (defaults to main db)
 * @returns The updated address or null if not found/not owned by user
 */
export const updateAddress = async (
  addressId: string,
  userId: string,
  updates: Partial<Omit<Address, "id" | "userId" | "createdAt" | "updatedAt">>,
  dbOrTx: DbOrTransaction = db
): Promise<Address | null> => {
  const [updated] = await dbOrTx
    .update(addresses)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning();
  return updated ?? null;
};

/**
 * Deletes an address owned by a specific user
 * @param addressId - Address ID (UUID)
 * @param userId - User ID (UUID) - ensures user owns the address
 * @param dbOrTx - Database instance or transaction (defaults to main db)
 * @returns true if deleted, false if not found/not owned by user
 */
export const deleteAddress = async (
  addressId: string,
  userId: string,
  dbOrTx: DbOrTransaction = db
): Promise<boolean> => {
  const result = await dbOrTx
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning({ id: addresses.id });
  return result.length > 0;
};