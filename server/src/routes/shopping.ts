import { ShoppingFrequency, SHOPPING_FREQUENCY_DAYS } from "@/constants/shopping";
import { CreateShoppingDto, ShoppingsResponseDto, UpdateShoppingDto, UpdateShoppingParams } from "@/dto/shopping";
import Shopping from "@/models/Shopping";
import { HttpError } from "@/utils/errors";
import { optionalDate, optionalText, parseEnum, requiredText } from "@/utils/validation";
import { MsgResponseDto, } from "@dto/index";
import checkAuthAndReturnUser, { requireFamily } from "@routes/index";
import express, { Request, Response } from "express";

const router = express.Router();

/** Проверяет тело запроса и возвращает поля покупки */
function parseShoppingBody(body: Partial<CreateShoppingDto> | undefined) {
  return {
    name: requiredText(body?.name, "Название", 100),
    category: optionalText(body?.category, "Категория", 50),
    quantity: optionalText(body?.quantity, "Количество", 50),
    buyByDate: optionalDate(body?.buyByDate, "Купить до"),
    frequency: parseEnum(body?.frequency, "Периодичность", Object.values(ShoppingFrequency)),
  };
}

router.post("/create", async (req: Request<{}, {}, CreateShoppingDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);

    const shopping = new Shopping({
      ...parseShoppingBody(req.body),
      createdAt: new Date(),
      createdBy: user._id,
      family_id: familyId
    });

    await shopping.save();

    res.json({ message: "Добавлена покупка" });
  });
});

router.put("/:id", async (req: Request<UpdateShoppingParams, {}, UpdateShoppingDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const fields = parseShoppingBody(req.body);
    const selected = await Shopping.findOne({ _id: req.params.id, family_id: familyId });

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    selected.set(fields);
    await selected.save();
    res.json({ message: "Покупка успешно обновлена" });
  });
});

// отметка «куплено»; для повторяющихся покупок сразу создаём следующую
router.put("/:id/bought", async (req: Request<UpdateShoppingParams, {}, UpdateShoppingDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const bought = req.body?.bought;
    if (typeof bought !== "boolean") {
      throw new HttpError(400, "Поле «bought» должно быть true или false");
    }

    // атомарное обновление: findOneAndUpdate возвращает документ до изменения,
    // поэтому из двух одновременных запросов «куплено» только один увидит bought=false
    const selected = await Shopping.findOneAndUpdate(
      { _id: req.params.id, family_id: familyId },
      bought ? { $set: { bought: true, boughtAt: new Date() } } : { $set: { bought: false }, $unset: { boughtAt: 1 } }
    );

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    const wasBought = !!selected.bought;

    // повтор создаём только при переходе «не куплено → куплено», чтобы повторный запрос не плодил дубликаты
    const days = SHOPPING_FREQUENCY_DAYS[selected.frequency];
    if (bought && !wasBought && days) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + days);

      await new Shopping({
        name: selected.name,
        category: selected.category,
        quantity: selected.quantity,
        buyByDate: nextDate,
        frequency: selected.frequency,
        createdAt: new Date(),
        createdBy: user._id,
        family_id: familyId,
      }).save();
    }

    res.json({ message: "Покупка успешно обновлена" });
  });
});

router.delete("/:id", async (req: Request, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);

    const deletedDocument = await Shopping.findOneAndDelete({ _id: req.params.id, family_id: familyId });

    if (!deletedDocument) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    res.status(200).json({ message: 'Запись успешно удалена' });
  });
});

router.get("", async (req: Request, res: Response<ShoppingsResponseDto | MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const shoppings = await Shopping.find({ family_id: familyId });

    res.json(shoppings);
  });
});

export default router;
