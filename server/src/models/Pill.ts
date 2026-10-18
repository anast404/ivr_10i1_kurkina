import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IPill extends Document {
  name: string;
  description?: string;
  expiresAt: Date;
  quantity?: number;
  createdAt: Date;
  createdBy: Types.ObjectId;
  family_id: Types.ObjectId;
}

const pillSchema = new Schema<IPill>({
  name: { type: String, required: true },
  description: { type: String },
  expiresAt: { type: Date, required: true },
  quantity: { type: Number },
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

// все выборки данных идут по семье
pillSchema.index({ family_id: 1 });

const Pill: Model<IPill> = mongoose.model<IPill>("Pill", pillSchema);

export default Pill;
