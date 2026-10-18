/** Скрывает пароль в строке подключения, чтобы её можно было безопасно выводить в лог */
export function maskMongoUri(uri: string): string {
  return uri.replace(/^(mongodb(?:\+srv)?:\/\/[^:/@]+):[^@]*@/i, "$1:***@");
}
