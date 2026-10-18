// Проверка подключения к базе: npm run db:check
// С флагом --init (npm run db:init) дополнительно создаёт коллекции и индексы.
import "dotenv/config";
import { maskMongoUri } from "@/utils/mongo-uri";
import Family from "@models/Family";
import Pill from "@models/Pill";
import Plant from "@models/Plant";
import Shopping from "@models/Shopping";
import User from "@models/User";
import mongoose from "mongoose";

const models = [User, Family, Pill, Plant, Shopping];

async function main(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Не задан MONGO_URI. Скопируйте server/.env.example в server/.env");
  }

  console.log(`Подключаюсь к ${maskMongoUri(uri)} ...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Нет соединения с базой");
  }

  await db.admin().ping();
  console.log(`Подключение успешно. База: ${mongoose.connection.name}, хост: ${mongoose.connection.host}`);

  try {
    const info = await db.admin().serverInfo();
    console.log(`Версия MongoDB: ${info.version}`);
  } catch {
    // на управляемых кластерах права на serverInfo могут быть ограничены
  }

  if (process.argv.includes("--init")) {
    await Promise.all(models.map((model) => model.init()));
    console.log("Коллекции и индексы созданы.");
  }

  console.log("\nКоллекции:");
  for (const model of models) {
    const name = model.collection.collectionName;
    let count = 0;
    let indexes: string[] = [];
    try {
      count = await model.estimatedDocumentCount();
      indexes = (await model.collection.indexes()).map((index) => String(index.name));
    } catch {
      // коллекции ещё нет: она появится при первой записи или после db:init
      console.log(`  ${name}: не создана`);
      continue;
    }
    console.log(`  ${name}: ${count} док., индексы: ${indexes.join(", ")}`);
  }
}

main()
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error(`Ошибка: ${err instanceof Error ? err.message : String(err)}`);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
