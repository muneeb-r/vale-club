import mongoose, { Schema, Document } from "mongoose";
import "./User";

export interface IPasswordResetToken extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string; // hashed token stored in DB
  expiresAt: Date;
  usedAt?: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  usedAt: { type: Date },
});

export const PasswordResetToken =
  (mongoose.models.PasswordResetToken as mongoose.Model<IPasswordResetToken>) ||
  mongoose.model<IPasswordResetToken>(
    "PasswordResetToken",
    PasswordResetTokenSchema,
  );
