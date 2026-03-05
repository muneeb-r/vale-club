import mongoose, { Schema, Document } from "mongoose";

export interface IPlanFeature {
  es: string;
  en: string;
}

export interface IPlanName {
  es: string;
  en: string;
}

export interface IPlan extends Document {
  _id: mongoose.Types.ObjectId;
  name: IPlanName;
  price: number; // monthly price in EUR
  features: IPlanFeature[]; // bilingual feature list
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      es: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    price: { type: Number, required: true, min: 0 },
    features: [
      {
        es: { type: String, default: "" },
        en: { type: String, default: "" },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Plan =
  (mongoose.models.Plan as mongoose.Model<IPlan>) ||
  mongoose.model<IPlan>("Plan", PlanSchema);
