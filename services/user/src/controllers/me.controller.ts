import type { Request, Response } from "express";
import { addUserAddress, getUserAddresses, updateUserAddress } from "../services/me.service.ts";

export const getAddresses = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const addresses = await getUserAddresses(userId);
  return res.status(200).json(addresses);
};

export const createAddress = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const address = await addUserAddress(userId, req.body);
  return res.status(201).json(address);
};

export const updateAddress = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const addressId = req.params.addressId as string;
  const address = await updateUserAddress(addressId, userId, req.body);
  return res.status(200).json(address);
};