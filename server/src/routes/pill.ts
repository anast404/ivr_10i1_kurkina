import { CreatePillDto, MsgResponseDto, PillResponseDto, UpdatePillDto } from "@dto/index";
import Pill from "@models/Pill";
import checkAuthAndReturnUser from "@routes/index";
import express, { Request, Response } from "express";

const router = express.Router();

// создаем запись о лекарстве
router.post("/create", async (req: Request<{}, {}, CreatePillDto>, res: Response<MsgResponseDto>) => {
  // проверяем валидацию и возвращаем запись активного пользователя
  await checkAuthAndReturnUser(req, res, async (user) => {
    const { name, description, quantity, expiresAt } = req.body;

    const pill = new Pill({
      name,
      description,
      quantity,
      expiresAt,
      createdAt: new Date(),
      createdBy: user._id,
      family_id: user.family_id,
    });
    await pill.save();

    res.json({ message: "Лекарство добавлено в аптечку" });
  });
});

router.post("/update", async (req: Request<{}, {}, UpdatePillDto>, res: Response<MsgResponseDto>) => {
  // проверяем валидацию и возвращаем запись активного пользователя
  await checkAuthAndReturnUser(req, res, async () => {
    const { id, name, description, quantity, expiresAt } = req.body;
    const selected = await Pill.findById(id);

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    selected.name = name;
    selected.description = description;
    selected.quantity = quantity;
    selected.expiresAt = expiresAt;

    await selected.save();
    res.json({ message: "Лекарство успешно обновлено" });
  });
});

router.delete("/:id", async (req: Request, res: Response<MsgResponseDto>) => {
  // проверяем авторизацию и возвращаем текущего пользователя
  await checkAuthAndReturnUser(req, res, async () => {
    const { id } = req.params;

    const deletedDocument = await Pill.findByIdAndDelete(id);

    if (!deletedDocument) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    res.status(200).json({ message: 'Запись успешно удалена' });
  });
}
);

router.get("", async (req: Request, res: Response<PillResponseDto | MsgResponseDto>) => {
  // проверяем автоизацию
  await checkAuthAndReturnUser(req, res, async (user) => {
    const pills = await Pill.find({ family_id: user.family_id });

    res.json(pills);
  });
});

export default router;
