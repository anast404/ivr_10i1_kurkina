export interface UpdateUserDto {
  name?: string;
  family_id?: string;
}

export interface UserResponseDto {
  name?: string;
  family_id?: string;
  email: string;
  isVerified: boolean;
}