import mongoose, { Schema, Document } from "mongoose";
import "./ShopService";

export interface IShopOrder extends Document {
  _id: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  type: "purchase" | "quote";
  name: string;
  email: string;
  message: string;
  status: "new" | "in_progress" | "done" | "cancelled";
  adminNote: string;
  paymentStatus?: "unpaid" | "paid";
  redsysOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShopOrderSchema = new Schema<IShopOrder>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "ShopService",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["purchase", "quote"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["new", "in_progress", "done", "cancelled"],
      default: "new",
      index: true,
    },
    adminNote: { type: String, default: "" },
    paymentStatus: { type: String, enum: ["unpaid", "paid"] },
    redsysOrderId: { type: String },
  },
  { timestamps: true },
);

export const ShopOrder =
  (mongoose.models.ShopOrder as mongoose.Model<IShopOrder>) ||
  mongoose.model<IShopOrder>("ShopOrder", ShopOrderSchema);
