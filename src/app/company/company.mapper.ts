import { readPermissions } from "../../utils";
import { CompanyDto } from "./company.interface";

export class CompanyMapper {
  static toDto(row: {
    role: string;
    permissions: unknown;
    company: { id: number; code: string; name: string; personalCompany: boolean };
  }): CompanyDto {
    return {
      id: row.company.id,
      code: row.company.code,
      name: row.company.name,
      personalCompany: row.company.personalCompany,
      role: row.role,
      permissions: readPermissions(row.permissions),
    };
  }
}
