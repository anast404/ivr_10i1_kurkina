import { WaterFrequency } from "@/constants/plant";
import { CreatePlantDto, PlantsResponseDto, PutCareDto, PutCareParams, UpdatePlanParams, UpdatePlantDto } from "@/dto/plant";
import { optionalText, parseDate, parseEnum, requiredText } from "@/utils/validation";
import { MsgResponseDto, } from "@dto/index";
import Plant from "@models/Plant";
import checkAuthAndReturnUser, { requireFamily } from "@routes/index";
import express, { Request, Response } from "express";

const router = express.Router();

/** Проверяет тело запроса и возвращает поля растения */
function parsePlantBody(body: Partial<CreatePlantDto> | undefined) {
  return {
    name: requiredText(body?.name, "Название", 100),
    description: optionalText(body?.description, "Особенности ухода", 1000),
    waterFrequency: parseEnum(body?.waterFrequency, "Частота полива", Object.values(WaterFrequency)),
    lastWateredAt: parseDate(body?.lastWateredAt, "Дата последнего полива"),
  };
}

router.post("/create", async (req: Request<{}, {}, CreatePlantDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const fields = parsePlantBody(req.body);

    const plant = new Plant({
      ...fields,
      createdAt: new Date(),
      createdBy: user._id,
      family_id: familyId,
      careHistory: [{
        createdAt: new Date(),
        createdBy: user._id,
      }]
    });

    await plant.save();

    res.json({ message: "Добавлено растение" });
  });
});

router.put("/:id", async (req: Request<UpdatePlanParams, {}, UpdatePlantDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const fields = parsePlantBody(req.body);
    const selected = await Plant.findOne({ _id: req.params.id, family_id: familyId });

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    selected.set(fields);
    await selected.save();
    res.json({ message: "Растение успешно обновлено" });
  });
});

// полив: пишем в историю и обновляем дату последнего полива (от неё считается статус)
router.put("/:id/care", async (req: Request<PutCareParams, {}, PutCareDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const note = optionalText(req.body?.note, "Примечание", 200);
    const selected = await Plant.findOne({ _id: req.params.id, family_id: familyId });

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    const now = new Date();
    selected.careHistory.push({
      note,
      createdAt: now,
      createdBy: user._id,
    });
    selected.lastWateredAt = now;

    await selected.save();
    res.json({ message: "Растение успешно полито" });
  });
});

router.delete("/:id", async (req: Request, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);

    const deletedDocument = await Plant.findOneAndDelete({ _id: req.params.id, family_id: familyId });

    if (!deletedDocument) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    res.status(200).json({ message: 'Запись успешно удалена' });
  });
});

router.get("", async (req: Request, res: Response<PlantsResponseDto | MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const plants = await Plant.find({ family_id: familyId });

    res.json(plants);
  });
});

export default router;
