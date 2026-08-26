import type { Request, Response } from "express";
import { getUserAddresses } from "../services/me.service.ts";

export const getAddresses = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const addresses = await getUserAddresses(userId);
  return res.status(200).json(addresses);
};