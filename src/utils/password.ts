import bcrypt from "bcryptjs";
import { SALT_ROUNDS } from "../config/env";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, Number(SALT_ROUNDS) || 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
