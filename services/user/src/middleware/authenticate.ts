import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { AppError } from "../errors/AppError.ts";
import { getPublicKey } from "../config/keys.ts";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Access token is required", 401);
  }
  const accessToken = authHeader.split(" ")[1]!;

  let payload: { sub?: string; type?: string };

  try {
    const key = await getPublicKey();
    const { payload: verified } = await jwtVerify(accessToken, key, {
      algorithms: ["ES256"],
      issuer: "agora-user-service",
      audience: "agora-api",
    });
    payload = verified as typeof payload;
  } catch {
    throw new AppError("Invalid access token", 401);
  }

  if (payload.type !== "access" || !payload.sub) {
    throw new AppError("Invalid access token", 401);
  }

  req.user = { id: payload.sub };
  next();
};
