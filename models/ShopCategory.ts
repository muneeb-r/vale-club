import mongoose, { Schema, Document } from "mongoose";

export interface IShopCategory extends Document {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: { es: string; en: string; ca: string };
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopCategorySchema = new Schema<IShopCategory>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: {
      es: { type: String, required: true },
      en: { type: String, required: true },
      ca: { type: String, default: "" },
    },
    icon: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ShopCategory =
  (mongoose.models.ShopCategory as mongoose.Model<IShopCategory>) ||
  mongoose.model<IShopCategory>("ShopCategory", ShopCategorySchema);
