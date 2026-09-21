export interface CreatePillDto {
  name: string;
  description?: string;
  expiresAt: Date;
  quantity?: number;
}

export interface UpdatePillDto extends CreatePillDto {
  id: string;
}

export interface PillResponseDto extends Array<CreatePillDto> { }