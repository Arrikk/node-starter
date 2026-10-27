export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
}

export interface PublicUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  emailVerifiedAt: string | null;
  currentCompanyId: number | null;
  profilePhotoPath: string | null;
}

export interface AuthSession {
  accessToken: string;
  user: PublicUser;
  companyId: number | null;
}
