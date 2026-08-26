import type { Request, Response } from "express";
import { addUserAddress, getUserAddresses } from "../services/me.service.ts";

export const getAddresses = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const addresses = await getUserAddresses(userId);
  return res.status(200).json(addresses);
};

export const addAddress = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const addresses = await addUserAddress(userId, req.body);
  return res.status(200).json(addresses);
};