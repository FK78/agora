import express from "express"
import { authenticate } from "../middleware/authenticate.ts"
import { getAddresses } from "../controllers/me.controller.ts"
import { rateLimiter } from "../middleware/rateLimiter.ts"
import { validate } from "../middleware/validate.ts"
import { addUserAddress } from "../services/me.service.ts"
import { createAddressSchema } from "../schemas/me.schema.ts"

const router = express.Router()

router.get("/", rateLimiter(60000, 5), authenticate, getAddresses)
router.post("/", rateLimiter(60000, 5), authenticate, validate({body: createAddressSchema}), addUserAddress)

export default router