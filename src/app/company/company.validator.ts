import { body } from "express-validator";
import validate from "../../core/validator";

export const createCompanyRules = validate([body("name").trim().notEmpty()]);
export const switchCompanyRules = validate([body("companyId").isInt({ min: 1 })]);
