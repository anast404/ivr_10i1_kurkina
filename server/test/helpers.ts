import mongoose from "mongoose";
import type { AddressInfo } from "net";
import { createApp } from "../src/app";

export interface TestServer {
  origin: string;
  baseUrl: string;
  close(): Promise<void>;
}

/** Поднимает приложение на свободном порту и подключается к ТЕСТОВОЙ базе (она очищается) */
export async function startServer(): Promise<TestServer> {
  const uri = process.env.MONGO_URI as string;
  if (!/test/i.test(uri)) {
    throw new Error(`Тесты очищают базу, поэтому её имя в MONGO_URI должно содержать "test": ${uri}`);
  }
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();

  const server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const { port } = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${port}`;

  return {
    origin,
    baseUrl: `${origin}/api`,
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await mongoose.disconnect();
    },
  };
}

export interface ApiResponse {
  status: number;
  // тело ответа приходит произвольным JSON-ом
  json: any;
  text: string;
}

export async function request(
  baseUrl: string,
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {}
): Promise<ApiResponse> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: options.token } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: res.status, json, text };
}
