import { ICON_MAPPING } from "@/constants";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";

/** тип для справочника соотвествия иконок ios и android */
export type TIconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

/** тип для имени иконки (нативные) */
export type TIconSymbolName = keyof typeof ICON_MAPPING;

/** тип для конфигурирования элеманта табера */
export type TTabItem = {
    label: string,
    id: string | number,
}

/** тип для контроля полей документа user которые можно редактировать */
export type TEditableUser = {
    name?: string,
    family_uuid?: string,
}

export type TFamily = {
    name: string,
}