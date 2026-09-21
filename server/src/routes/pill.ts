import express, { Request, Response } from "express";
import Pill from "@models/Pill";
import { CreatePillDto, MsgResponseDto, PillResponseDto, UpdatePillDto } from "@dto/index";
import checkAuthAndReturnUser from "@routes/index";

const router = express.Router();

// создаем запись о лекарстве
router.post("/create", async (req: Request<{}, {}, CreatePillDto>, res: Response<MsgResponseDto>) => {
  // проверяем валидацию и возвращаем запись активного пользователя
  await checkAuthAndReturnUser(req, res, async (user) => {
    try {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: message });
    }
  });
});

router.post("/update", async (req: Request<{}, {}, UpdatePillDto>, res: Response<MsgResponseDto>) => {
  // проверяем валидацию и возвращаем запись активного пользователя
  await checkAuthAndReturnUser(req, res, async () => {
    try {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: message });
    }
  });
});

router.delete("/:id", async (req: Request, res: Response<MsgResponseDto>) => {
  // проверяем авторизацию и возвращаем текущего пользователя
  await checkAuthAndReturnUser(req, res, async () => {
    try {
      const { id } = req.params;

      const deletedDocument = await Pill.findByIdAndDelete(id);

      if (!deletedDocument) {
        res.status(404).json({ message: 'Запись с таким ID не найдена' });
        return;
      }

      res.status(200).json({ message: 'Запись успешно удалена' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: message });
    }
  });
}
);

router.get("", async (req: Request, res: Response<PillResponseDto | MsgResponseDto>) => {
  // проверяем автоизацию
  await checkAuthAndReturnUser(req, res, async (user) => {
    try {
      const pills = await Pill.find({ family_id: user.family_id });
      if (!pills?.length) {
        throw new Error("Аптечка пустая");
      }

      res.json(pills);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: message });
    }
  });
});

export default router;
