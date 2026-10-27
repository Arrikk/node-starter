import { Request } from "express";
import asyncHandler from "../../core/request/async.request";
import ResponseMessage from "../../core/responseMessage/message.class";
import { successMessage } from "../../core/responseMessage/message";
import { BadRequestError } from "../../core/errors";
import { clientIp } from "../../utils";
import { IdentityService } from "./identity.service";

function meta(req: Request) {
  return { ip: clientIp(req), userAgent: req.get("user-agent") };
}

export const register = asyncHandler(async (req, res) => {
  const result = await IdentityService.register(req.body, meta(req));
  return ResponseMessage.send(res, successMessage(result, "Account created", 201));
});

export const login = asyncHandler(async (req, res) => {
  const result = await IdentityService.login(req.body, meta(req));
  return ResponseMessage.send(res, successMessage(result, "Signed in"));
});

export const logout = asyncHandler(async (req, res) => {
  const result = await IdentityService.logout(req.user?.sessionId || "");
  return ResponseMessage.send(res, successMessage(result, "Signed out"));
});

export const me = asyncHandler(async (req, res) => {
  const result = await IdentityService.me(req.user!.id);
  return ResponseMessage.send(res, successMessage(result, "Profile"));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await IdentityService.verifyEmail(req.body.email, req.body.code);
  return ResponseMessage.send(res, successMessage(result, "Email verified"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await IdentityService.forgotPassword(req.body.email);
  return ResponseMessage.send(res, successMessage(result, "If the account exists, a reset code was sent"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await IdentityService.resetPassword(req.body.email, req.body.code, req.body.password);
  return ResponseMessage.send(res, successMessage(result, "Password updated"));
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new BadRequestError("A file is required");
  const result = await IdentityService.uploadAvatar(req.user!.id, req.file);
  return ResponseMessage.send(res, successMessage(result, "Avatar updated"));
});
