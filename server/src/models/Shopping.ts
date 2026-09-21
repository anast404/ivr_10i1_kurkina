import { ShoppingFrequency } from "@/constants/shopping";
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IShopping extends Document {
  name: string;
  category?: string;
  quantity?: string;
  buyByDate?: Date;
  frequency: ShoppingFrequency;
  bought?: boolean;
  boughtAt?: Date;
  createdAt: Date;
  createdBy: Types.ObjectId;
  family_id: Types.ObjectId;
}

const shoppingSchema = new Schema<IShopping>({
  name: { type: String, required: true },
  category: { type: String },
  quantity: { type: String },
  buyByDate: { type: Date },
  frequency: { type: String, required: true },
  bought: { type: Boolean },
  boughtAt: { type: Date },
  createdAt: { type: Date, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  family_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
    required: true,
  },
}, {
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

const Shopping: Model<IShopping> = mongoose.model<IShopping>("Shopping", shoppingSchema);

export default Shopping;
