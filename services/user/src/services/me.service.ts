import { getAddresses, createAddress, updateAddress } from "../queries/me.queries.ts";
import type { Address } from "../db/schema.ts";
import type { CreateAddressInput, UpdateAddressInput } from "../schemas/me.schema.ts";
import { AppError } from "../errors/AppError.ts";

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

export const updateUserAddress = async (
  addressId: string,
  userId: string,
  input: UpdateAddressInput
): Promise<Address> => {
  const updates = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  );

  const updated = await updateAddress(addressId, userId, updates);
  if (!updated) {
    throw new AppError("Address not found", 404);
  }
  return updated;
};