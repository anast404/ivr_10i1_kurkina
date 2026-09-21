import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  family_id?: Types.ObjectId;
  isVerified: boolean;
  emailToken?: string;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  family_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
  },
  isVerified: { type: Boolean, default: false },
  emailToken: String,
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
