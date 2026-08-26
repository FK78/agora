import { z } from "zod";

export const addressTypeEnum = z.enum(["shipping", "billing"]);

export const createAddressSchema = z.object({
  type: addressTypeEnum,
  isDefault: z.boolean().optional().default(false),
  name: z.string().trim().min(1, "Name is required"),
  line1: z.string().trim().min(1, "Address line 1 is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
  phone: z.string().trim().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

export const addressIdParamSchema = z.object({
  addressId: z.uuid("Invalid address ID"),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressIdParam = z.infer<typeof addressIdParamSchema>;
