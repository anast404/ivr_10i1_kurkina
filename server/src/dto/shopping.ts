import { ShoppingFrequency } from "@/constants/shopping";

/** запросы */
export interface CreateShoppingDto {
  name: string;
  category?: string;
  quantity?: string;
  buyByDate?: Date;
  frequency: ShoppingFrequency;
  bought?: boolean;
  boughtAt?: Date;
}

export interface UpdateShoppingParams {
  id: string;
}

export interface UpdateShoppingDto extends CreateShoppingDto { }

/** ответы */

export interface ShoppingResponseDto extends CreateShoppingDto { }

export interface ShoppingsResponseDto extends Array<ShoppingResponseDto> { }