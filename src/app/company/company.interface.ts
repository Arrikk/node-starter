export interface CompanyDto {
  id: number;
  code: string;
  name: string;
  personalCompany: boolean;
  role: string;
  permissions: string[];
}

export interface CreateCompanyInput {
  name: string;
}
