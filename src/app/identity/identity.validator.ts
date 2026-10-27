import { body } from "express-validator";
import validate from "../../core/validator";

export const registerRules = validate([
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("firstName").trim().notEmpty(),
  body("lastName").trim().notEmpty(),
  body("companyName").trim().notEmpty(),
  body("phoneNumber").optional({ values: "falsy" }).isString(),
]);

export const loginRules = validate([
  body("email").isEmail().normalizeEmail(),
  body("password").isString().notEmpty(),
  body("remember").optional().isBoolean(),
]);

export const verifyEmailRules = validate([
  body("email").isEmail().normalizeEmail(),
  body("code").isString().isLength({ min: 4, max: 12 }),
]);

export const forgotPasswordRules = validate([body("email").isEmail().normalizeEmail()]);

export const resetPasswordRules = validate([
  body("email").isEmail().normalizeEmail(),
  body("code").isString().isLength({ min: 4, max: 12 }),
  body("password").isLength({ min: 8 }),
]);
