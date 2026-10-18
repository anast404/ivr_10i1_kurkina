import { maskMongoUri } from "@/utils/mongo-uri";
import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI as string;
  try {
    const conn = await mongoose.connect(uri, {
      // не ждём 30 секунд (значение по умолчанию), если база недоступна
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Не удалось подключиться к MongoDB (${maskMongoUri(uri)}): ${message}`);
    console.error("Проверьте, что MongoDB запущена, а MONGO_URI в server/.env верный. Инструкция: server/DATABASE.md");
    process.exit(1);
  }
};

export default connectDB;
