export type RoleCode = 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'AUDITOR';

export interface RoleDetails {
  id: string;
  code: RoleCode;
  name: string;
  level: number;
}

/**
 * Shape returned inside POST /auth/login's response. Deliberately thinner
 * than AuthenticatedUser (no id/active/lastLoginAt/createdAt, and `role` is
 * a plain code string) — the backend builds this object independently from
 * GET /auth/me, it is not the same DTO.
 */
export interface LoginUser {
  name: string;
  username: string;
  email: string;
  role: RoleCode;
  firstLogin: boolean;
}

/**
 * Canonical user shape, returned by GET /auth/me. AuthContext always stores
 * this shape (not LoginUser) so the rest of the app has a single consistent
 * user type to depend on.
 */
export interface AuthenticatedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  active: boolean;
  firstLogin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: RoleDetails;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface LoginResponse extends TokenPair {
  user: LoginUser;
  mustChangePassword: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export type RefreshTokenResponse = TokenPair;

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
