import { CreatePlantDto, PlantsResponseDto, PutCareDto, PutCareParams, UpdatePlanParams, UpdatePlantDto } from "@/dto/plant";
import { MsgResponseDto, } from "@dto/index";
import Plant from "@models/Plant";
import checkAuthAndReturnUser, { requireFamily } from "@routes/index";
import express, { Request, Response } from "express";

const router = express.Router();

router.post("/create", async (req: Request<{}, {}, CreatePlantDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const { name, description, waterFrequency, lastWateredAt } = req.body;

    const plant = new Plant({
      name,
      description,
      waterFrequency,
      lastWateredAt,
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
    const { id } = req.params;
    const { name, description, waterFrequency, lastWateredAt } = req.body;
    const selected = await Plant.findOne({ _id: id, family_id: familyId });

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    selected.name = name;
    selected.description = description;
    selected.waterFrequency = waterFrequency;
    selected.lastWateredAt = lastWateredAt;

    await selected.save();
    res.json({ message: "Растение успешно обновлено" });
  });
});

// полив: пишем в историю и обновляем дату последнего полива (от неё считается статус)
router.put("/:id/care", async (req: Request<PutCareParams, {}, PutCareDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const { id } = req.params;
    const { note } = req.body;
    const selected = await Plant.findOne({ _id: id, family_id: familyId });

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    const now = new Date();
    selected.careHistory.push({
      note: note,
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
    const { id } = req.params;

    const deletedDocument = await Plant.findOneAndDelete({ _id: id, family_id: familyId });

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
