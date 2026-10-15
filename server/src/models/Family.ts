import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IFamily extends Document {
  name: string;
  owner_id: Types.ObjectId;
}

const familySchema = new Schema<IFamily>({
  name: { type: String, required: true },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Family: Model<IFamily> = mongoose.model<IFamily>("Family", familySchema);

export default Family;
