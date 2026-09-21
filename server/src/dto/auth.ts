export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyEmailParamsDto {
  token: string;
}

export interface LoginResponseDto {
  token: string;
}