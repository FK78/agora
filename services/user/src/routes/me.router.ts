import express from "express"
import { authenticate } from "../middleware/authenticate.ts"
import { getAddresses, createAddress, updateAddress } from "../controllers/me.controller.ts"
import { rateLimiter } from "../middleware/rateLimiter.ts"
import { validate } from "../middleware/validate.ts"
import { createAddressSchema, updateAddressSchema, addressIdParamSchema } from "../schemas/me.schema.ts"

const router = express.Router()

router.get("/", rateLimiter(60000, 5), authenticate, getAddresses)
router.post("/", rateLimiter(60000, 5), authenticate, validate({ body: createAddressSchema }), createAddress)
router.patch("/:addressId", rateLimiter(60000, 5), authenticate, validate({ params: addressIdParamSchema, body: updateAddressSchema }), updateAddress)

export default router