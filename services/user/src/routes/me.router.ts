import express from "express"
import { authenticate } from "../middleware/authenticate.ts"
import { getAddresses } from "../controllers/me.controller.ts"
import { rateLimiter } from "../middleware/rateLimiter.ts"

const router = express.Router()

router.get("/addresses", rateLimiter(60000, 5), authenticate, getAddresses)

export default router