import { getAddresses } from "../queries/me.queries.ts";
import type { Address } from "../db/schema.ts";

export const getUserAddresses = async (userId: string): Promise<Address[]> => {
  return getAddresses(userId);
};