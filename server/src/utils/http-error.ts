/** Ошибка с HTTP-статусом: её текст безопасно отдавать клиенту */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
