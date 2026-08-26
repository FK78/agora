import { getAddresses, createAddress } from "../queries/me.queries.ts";
import type { Address } from "../db/schema.ts";
import type { CreateAddressInput } from "../schemas/me.schema.ts";

export const getUserAddresses = async (userId: string): Promise<Address[]> => {
  return getAddresses(userId);
};

export const addUserAddress = async (
  userId: string,
  input: CreateAddressInput
): Promise<Address> => {
  return createAddress({
    userId,
    type: input.type,
    isDefault: input.isDefault ?? false,
    name: input.name,
    line1: input.line1,
    line2: input.line2,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country,
    phone: input.phone,
  });
};