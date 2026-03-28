export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: Tokens;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: Tokens;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  exp?: number;
  iat?: number;
}
