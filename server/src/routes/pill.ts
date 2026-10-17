import { CreatePillDto, MsgResponseDto, PillResponseDto, UpdatePillDto } from "@dto/index";
import Pill from "@models/Pill";
import checkAuthAndReturnUser, { requireFamily } from "@routes/index";
import { optionalNumber, optionalText, parseDate, requiredText } from "@/utils/validation";
import express, { Request, Response } from "express";

const router = express.Router();

/** Проверяет тело запроса и возвращает поля лекарства */
function parsePillBody(body: Partial<CreatePillDto> | undefined) {
  return {
    name: requiredText(body?.name, "Название", 100),
    description: optionalText(body?.description, "Назначение", 500),
    quantity: optionalNumber(body?.quantity, "Количество", 0),
    expiresAt: parseDate(body?.expiresAt, "Срок годности"),
  };
}

// создаем запись о лекарстве
router.post("/create", async (req: Request<{}, {}, CreatePillDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);

    const pill = new Pill({
      ...parsePillBody(req.body),
      createdAt: new Date(),
      createdBy: user._id,
      family_id: familyId,
    });
    await pill.save();

    res.json({ message: "Лекарство добавлено в аптечку" });
  });
});

router.post("/update", async (req: Request<{}, {}, UpdatePillDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const fields = parsePillBody(req.body);
    // ищем только среди записей своей семьи
    const selected = await Pill.findOne({ _id: req.body?.id, family_id: familyId });

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    selected.set(fields);
    await selected.save();
    res.json({ message: "Лекарство успешно обновлено" });
  });
});

router.delete("/:id", async (req: Request, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);

    const deletedDocument = await Pill.findOneAndDelete({ _id: req.params.id, family_id: familyId });

    if (!deletedDocument) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    res.status(200).json({ message: 'Запись успешно удалена' });
  });
});

router.get("", async (req: Request, res: Response<PillResponseDto | MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const pills = await Pill.find({ family_id: familyId });

    res.json(pills);
  });
});

export default router;
