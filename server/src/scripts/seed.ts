// Демо-данные для разработки и защиты проекта: npm run db:seed
// Создаёт двух подтверждённых пользователей, одну семью и примеры данных во всех модулях.
// Повторный запуск удаляет прежние демо-данные и создаёт их заново.
import "dotenv/config";
import { ShoppingFrequency } from "@/constants/shopping";
import { WaterFrequency } from "@/constants/plant";
import { maskMongoUri } from "@/utils/mongo-uri";
import Family from "@models/Family";
import Pill from "@models/Pill";
import Plant from "@models/Plant";
import Shopping from "@models/Shopping";
import User from "@models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const DEMO_PASSWORD = "demo1234";
const DEMO_USERS = [
  { email: "demo@happyhome.local", name: "Анастасия" },
  { email: "demo2@happyhome.local", name: "Артём" },
];

const DAY = 24 * 60 * 60 * 1000;
/** Дата со сдвигом в днях от сегодняшнего дня (отрицательный сдвиг — в прошлом) */
const days = (offset: number): Date => new Date(Date.now() + offset * DAY);

async function main(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Не задан MONGO_URI. Скопируйте server/.env.example в server/.env");
  }
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    throw new Error("Демо-данные нельзя создавать в production (у них известный пароль). Для запуска добавьте --force");
  }

  console.log(`Подключаюсь к ${maskMongoUri(uri)} ...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  // удаляем прежние демо-данные
  const old = await User.find({ email: { $in: DEMO_USERS.map((u) => u.email) } });
  const oldFamilyIds = old.map((u) => u.family_id).filter(Boolean);
  if (oldFamilyIds.length) {
    await Promise.all([
      Pill.deleteMany({ family_id: { $in: oldFamilyIds } }),
      Plant.deleteMany({ family_id: { $in: oldFamilyIds } }),
      Shopping.deleteMany({ family_id: { $in: oldFamilyIds } }),
      Family.deleteMany({ _id: { $in: oldFamilyIds } }),
    ]);
  }
  await User.deleteMany({ email: { $in: DEMO_USERS.map((u) => u.email) } });

  // пользователи и семья
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const [owner, member] = await Promise.all(
    DEMO_USERS.map((u) => User.create({ ...u, password, isVerified: true }))
  );

  const family = await Family.create({ name: "Семья Куркиных", owner_id: owner._id });
  owner.family_id = family._id;
  member.family_id = family._id;
  await Promise.all([owner.save(), member.save()]);

  const common = { createdAt: new Date(), createdBy: owner._id, family_id: family._id };

  await Pill.insertMany([
    { ...common, name: "Аспирин", description: "Жаропонижающее, обезболивающее", quantity: 20, expiresAt: days(400) },
    { ...common, name: "Парацетамол", description: "От температуры", quantity: 12, expiresAt: days(20) },
    { ...common, name: "Активированный уголь", description: "При отравлении", quantity: 30, expiresAt: days(-15) },
    { ...common, name: "Нурофен", description: "От головной боли", quantity: 8, expiresAt: days(200) },
    { ...common, name: "Пластырь", description: "Бактерицидный", quantity: 15, expiresAt: days(700) },
  ]);

  await Plant.insertMany([
    {
      ...common, name: "Фикус", description: "Не любит сквозняков",
      waterFrequency: WaterFrequency.weekly, lastWateredAt: days(-8),
      careHistory: [{ createdAt: days(-8), createdBy: owner._id, note: "утром" }],
    },
    {
      ...common, name: "Монстера", description: "Опрыскивать листья",
      waterFrequency: WaterFrequency.every_3_days, lastWateredAt: days(-3),
      careHistory: [
        { createdAt: days(-6), createdBy: member._id },
        { createdAt: days(-3), createdBy: owner._id },
      ],
    },
    {
      ...common, name: "Кактус", description: "Свет и почти никакой воды",
      waterFrequency: WaterFrequency.monthly, lastWateredAt: days(-5),
      careHistory: [{ createdAt: days(-5), createdBy: owner._id }],
    },
    {
      ...common, name: "Орхидея", description: "Поливать погружением",
      waterFrequency: WaterFrequency.weekly, lastWateredAt: days(-2),
      careHistory: [{ createdAt: days(-2), createdBy: member._id, note: "после цветения" }],
    },
  ]);

  await Shopping.insertMany([
    { ...common, name: "Молоко", category: "Продукты", quantity: "2 л", frequency: ShoppingFrequency.weekly, buyByDate: days(2) },
    { ...common, name: "Хлеб", category: "Продукты", quantity: "1 шт.", frequency: ShoppingFrequency.once, buyByDate: days(-1) },
    { ...common, name: "Яблоки", category: "Фрукты", quantity: "1 кг", frequency: ShoppingFrequency.once },
    { ...common, name: "Средство для посуды", category: "Дом", frequency: ShoppingFrequency.monthly, buyByDate: days(10) },
    { ...common, name: "Кофе", category: "Продукты", quantity: "250 г", frequency: ShoppingFrequency.once, bought: true, boughtAt: days(-1) },
  ]);

  console.log("\nДемо-данные созданы.");
  console.log(`  Пользователи: ${DEMO_USERS.map((u) => u.email).join(", ")}`);
  console.log(`  Пароль: ${DEMO_PASSWORD}`);
  console.log(`  Идентификатор семьи (для присоединения): ${family._id}`);
  console.log("  Лекарств: 5, растений: 4, покупок: 5");
}

main()
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error(`Ошибка: ${err instanceof Error ? err.message : String(err)}`);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
