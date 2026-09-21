import { isAxiosError } from "axios";

export function getError(error: any): string {
    if (isAxiosError(error) && error?.response?.data?.message) {
        return error.response.data.message as string
    } 

    return error?.message || "Неизвестная ошибка"
}