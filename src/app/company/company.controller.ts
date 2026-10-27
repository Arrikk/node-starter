import { Request } from "express";
import asyncHandler from "../../core/request/async.request";
import ResponseMessage from "../../core/responseMessage/message.class";
import { successMessage } from "../../core/responseMessage/message";
import { clientIp } from "../../utils";
import { CompanyService } from "./company.service";

function meta(req: Request) {
  return { ip: clientIp(req), userAgent: req.get("user-agent") };
}

export const listCompanies = asyncHandler(async (req, res) => {
  const result = await CompanyService.list(req.user!.id);
  return ResponseMessage.send(res, successMessage({ companies: result }, "Companies"));
});

export const currentCompany = asyncHandler(async (req, res) => {
  const result = await CompanyService.current(req.user!.id, req.companyId!);
  return ResponseMessage.send(res, successMessage(result, "Current company"));
});

export const createCompany = asyncHandler(async (req, res) => {
  const result = await CompanyService.create(req.user!.id, req.body, meta(req));
  return ResponseMessage.send(res, successMessage(result, "Company created", 201));
});

export const switchCompany = asyncHandler(async (req, res) => {
  const result = await CompanyService.switchCompany(req.user!.id, Number(req.body.companyId), meta(req));
  return ResponseMessage.send(res, successMessage(result, "Company switched"));
});
