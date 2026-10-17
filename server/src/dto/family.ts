export interface CreateFamilyDto {
  name: string;
}

export interface GetFamilyQueryDto {
  id: string;
}

export interface FamilyResponseDto {
  name: string;
  family_id: string;
  message?: string;
}

export interface FamilyMemberDto {
  id: string;
  name?: string;
  email: string;
  isOwner: boolean;
}

export type FamilyMembersResponseDto = FamilyMemberDto[];
