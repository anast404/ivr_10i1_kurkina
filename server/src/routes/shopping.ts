import { CreateShoppingDto, ShoppingsResponseDto, UpdateShoppingDto, UpdateShoppingParams } from "@/dto/shopping";
import Shopping from "@/models/Shopping";
import { MsgResponseDto, } from "@dto/index";
import checkAuthAndReturnUser from "@routes/index";
import express, { Request, Response } from "express";

const router = express.Router();

router.post("/create", async (req: Request<{}, {}, CreateShoppingDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const { name, category, quantity, buyByDate, frequency } = req.body;

    const shopping = new Shopping({
      name,
      category, 
      quantity, 
      buyByDate, 
      frequency, 
      createdAt: new Date(),
      createdBy: user._id,
      family_id: user.family_id
    });

    await shopping.save();

    res.json({ message: "Добавлена покупка" });
  });
});

router.put("/:id", async (req: Request<UpdateShoppingParams, {}, UpdateShoppingDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async () => {
    const { id } = req.params;
    const { name, category, quantity, buyByDate, frequency } = req.body;
    const selected = await Shopping.findById(id);

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    selected.name = name;
    selected.category = category;
    selected.quantity = quantity;
    selected.buyByDate = buyByDate;
    selected.frequency = frequency;
    // bought,  bought, 
    // boughtAt boughtAt

    await selected.save();
    res.json({ message: "Покупка успешно обновлена" });
  });
});

router.put("/:id/bought", async (req: Request<UpdateShoppingParams, {}, UpdateShoppingDto>, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async () => {
    const { id } = req.params;
    const { bought } = req.body;
    const selected = await Shopping.findById(id);

    if (!selected) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    selected.bought = bought;
    if(bought) {
      selected.boughtAt = new Date()
    } else {
      selected.boughtAt = undefined
    }

    await selected.save();
    res.json({ message: "Покупка успешно обновлена" });
  });
});

router.delete("/:id", async (req: Request, res: Response<MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async () => {
    const { id } = req.params;

    const deletedDocument = await Shopping.findByIdAndDelete(id);

    if (!deletedDocument) {
      res.status(404).json({ message: 'Запись с таким ID не найдена' });
      return;
    }

    res.status(200).json({ message: 'Запись успешно удалена' });
  });
});

router.get("", async (req: Request, res: Response<ShoppingsResponseDto | MsgResponseDto>) => {
  await checkAuthAndReturnUser(req, res, async (user) => {
    const shoppings = await Shopping.find({ family_id: user.family_id });

    res.json(shoppings);
  });
});

export default router;
