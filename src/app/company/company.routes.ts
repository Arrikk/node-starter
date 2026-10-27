import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requireCompany } from "../../middlewares/requireCompany";
import { requireEmailVerified } from "../../middlewares/requireEmailVerified";
import { createCompany, currentCompany, listCompanies, switchCompany } from "./company.controller";
import { createCompanyRules, switchCompanyRules } from "./company.validator";

const router = Router();

router.use(authenticate, requireEmailVerified);
router.get("/", listCompanies);
router.get("/current", requireCompany, currentCompany);
router.post("/", createCompanyRules, createCompany);
router.post("/switch", switchCompanyRules, switchCompany);

export default router;
