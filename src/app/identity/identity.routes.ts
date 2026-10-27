import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { handleUploadErrors, upload } from "../../middlewares/upload";
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
  uploadAvatar,
  verifyEmail,
} from "./identity.controller";
import {
  forgotPasswordRules,
  loginRules,
  registerRules,
  resetPasswordRules,
  verifyEmailRules,
} from "./identity.validator";

const router = Router();

router.post("/register", registerRules, register);
router.post("/login", loginRules, login);
router.post("/verify-email", verifyEmailRules, verifyEmail);
router.post("/password/forgot", forgotPasswordRules, forgotPassword);
router.post("/password/reset", resetPasswordRules, resetPassword);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.post("/me/avatar", authenticate, upload.single("file"), handleUploadErrors, uploadAvatar);

export default router;
