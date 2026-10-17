import Family from "@models/Family";
import Pill from "@models/Pill";
import Plant from "@models/Plant";
import Shopping from "@models/Shopping";
import User, { IUser } from "@models/User";

/**
 * Пользователь выходит из семьи.
 * Если остальные участники есть и вышел владелец — владение переходит старейшему участнику.
 * Если участников не осталось — семья и все её данные удаляются.
 */
export async function leaveFamily(user: IUser): Promise<void> {
  const familyId = user.family_id;
  if (!familyId) {
    return;
  }

  user.family_id = undefined;
  await user.save();

  const rest = await User.find({ family_id: familyId }).sort({ _id: 1 }).limit(1);

  if (rest.length === 0) {
    await Promise.all([
      Pill.deleteMany({ family_id: familyId }),
      Plant.deleteMany({ family_id: familyId }),
      Shopping.deleteMany({ family_id: familyId }),
      Family.deleteOne({ _id: familyId }),
    ]);
    return;
  }

  const family = await Family.findById(familyId);
  if (family && String(family.owner_id) === String(user._id)) {
    family.owner_id = rest[0]._id;
    await family.save();
  }
}
