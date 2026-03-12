import mongoose, { Schema, Document } from "mongoose";

export type PriceType = "fixed" | "quote"; // fixed = price shown, quote = "a consultar"

export interface IShopService extends Document {
  _id: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId; // ref: ShopCategory
  name: { es: string; en: string; ca: string };
  description?: { es: string; en: string; ca: string };
  price?: number;         // in EUR, null if priceType = "quote"
  priceType: PriceType;
  promoPrice?: number;    // optional promo/pack price
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopServiceSchema = new Schema<IShopService>(
  {
    category: { type: Schema.Types.ObjectId, ref: "ShopCategory", required: true },
    name: {
      es: { type: String, required: true },
      en: { type: String, required: true },
      ca: { type: String, default: "" },
    },
    description: {
      es: { type: String, default: "" },
      en: { type: String, default: "" },
      ca: { type: String, default: "" },
    },
    price: { type: Number },
    priceType: { type: String, required: true, enum: ["fixed", "quote"], default: "fixed" },
    promoPrice: { type: Number },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ShopService =
  (mongoose.models.ShopService as mongoose.Model<IShopService>) ||
  mongoose.model<IShopService>("ShopService", ShopServiceSchema);
