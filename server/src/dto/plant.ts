import { WaterFrequency } from "@/constants/plant";

/** запросы */
export interface CreatePlantDto {
  name: string;
  description?: string;
  waterFrequency: WaterFrequency;
  lastWateredAt: Date;
}

export interface UpdatePlanParams {
  id: string;
}

export interface UpdatePlantDto extends CreatePlantDto { }

export interface PutCareParams {
  id: string;
}

export interface PutCareDto {
  note?: string;
}

/** ответы */

export interface PlantResponseDto extends CreatePlantDto { }

export interface PlantsResponseDto extends Array<PlantResponseDto> { }