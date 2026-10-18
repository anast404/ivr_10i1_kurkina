import { WaterFrequency } from "@/constants/plant";
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IPlant extends Document {
  name: string;
  description?: string;
  waterFrequency: WaterFrequency;
  lastWateredAt: Date;
  createdAt: Date;
  createdBy: Types.ObjectId;
  family_id: Types.ObjectId;
  careHistory: {
    note?: string;
    createdAt: Date;
    createdBy: Types.ObjectId;
  }[];
}

const careHistorySchema = new Schema({
  note: { type: String },
  createdAt: { type: Date, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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

const plantSchema = new Schema<IPlant>({
  name: { type: String, required: true },
  description: { type: String },
  waterFrequency: { type: String, required: true, enum: Object.values(WaterFrequency) },
  lastWateredAt: { type: Date, required: true },
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
  careHistory: [careHistorySchema],
}, {
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

// все выборки данных идут по семье
plantSchema.index({ family_id: 1 });

const Plant: Model<IPlant> = mongoose.model<IPlant>("Plant", plantSchema);

export default Plant;
