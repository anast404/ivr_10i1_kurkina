import { ICON_MAPPING } from "@/constants";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";

export type TIconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type TIconSymbolName = keyof typeof ICON_MAPPING;

// типы для контроля полей которые можно редактировать
export type TEditableUser = {
    name?: string,
}