import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;    // Spanish
  nameEn: string;  // English
  nameCa: string;  // Catalan
  slug: string;
  icon: string;
  description?: string;
  parentCategory?: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },        // Spanish name
    nameEn: { type: String, required: true, trim: true },      // English name
    nameCa: { type: String, default: "", trim: true },         // Catalan name
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String, default: "🏢" },
    description: { type: String },
    parentCategory: { type: Schema.Types.ObjectId, ref: "Category" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category =
  (mongoose.models.Category as mongoose.Model<ICategory>) ||
  mongoose.model<ICategory>("Category", CategorySchema);
