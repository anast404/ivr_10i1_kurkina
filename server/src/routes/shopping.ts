import { CreateShoppingDto, ShoppingsResponseDto, UpdateShoppingDto, UpdateShoppingParams } from "@/dto/shopping";
import Shopping from "@/models/Shopping";
import { MsgResponseDto, } from "@dto/index";
import checkAuthAndReturnUser, { requireFamily } from "@routes/index";
import express, { Request, Response } from "express";

const router = express.Router();

router.post("/create", async (req: Request<{}, {}, CreateShoppingDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const { name, category, quantity, buyByDate, frequency } = req.body;

    const shopping = new Shopping({
      name,
      category,
      quantity,
      buyByDate,
      frequency,
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
    const { id } = req.params;
    const { name, category, quantity, buyByDate, frequency } = req.body;
    const selected = await Shopping.findOne({ _id: id, family_id: familyId });

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    selected.name = name;
    selected.category = category;
    selected.quantity = quantity;
    selected.buyByDate = buyByDate;
    selected.frequency = frequency;

    await selected.save();
    res.json({ message: "Покупка успешно обновлена" });
  });
});

router.put("/:id/bought", async (req: Request<UpdateShoppingParams, {}, UpdateShoppingDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const { id } = req.params;
    const { bought } = req.body;
    const selected = await Shopping.findOne({ _id: id, family_id: familyId });

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    selected.bought = bought;
    selected.boughtAt = bought ? new Date() : undefined;

    await selected.save();
    res.json({ message: "Покупка успешно обновлена" });
  });
});

router.delete("/:id", async (req: Request, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const familyId = requireFamily(user);
    const { id } = req.params;

    const deletedDocument = await Shopping.findOneAndDelete({ _id: id, family_id: familyId });

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
