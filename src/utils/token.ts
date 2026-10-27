import jwt, { SignOptions } from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_REMEMBER_EXPIRES_IN, JWT_SECRET } from "../config/env";

export interface AccessTokenClaims {
  sub: string;
  email: string;
  companyId: number | null;
  currentCompanyId: number | null;
  sessionId: string;
  type: "access";
}

export function signAccessToken(claims: Omit<AccessTokenClaims, "type">, remember: boolean): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  const options: SignOptions = {
    expiresIn: remember ? JWT_REMEMBER_EXPIRES_IN : JWT_EXPIRES_IN,
  };
  return jwt.sign({ ...claims, type: "access" }, JWT_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, JWT_SECRET) as AccessTokenClaims;
}
