import mongoose, { Schema, Document } from "mongoose";

export interface ISiteSettings extends Document {
  _id: mongoose.Types.ObjectId;
  // Bank / payment details shown to business owners when requesting a plan
  bankDetails: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    iban?: string;
    swift?: string;
    reference?: string;  // e.g. "Use your business name as reference"
    extraInfo?: string;  // free-text instructions
  };
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    bankDetails: {
      bankName: { type: String, default: "" },
      accountHolder: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      iban: { type: String, default: "" },
      swift: { type: String, default: "" },
      reference: { type: String, default: "" },
      extraInfo: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const SiteSettings =
  (mongoose.models.SiteSettings as mongoose.Model<ISiteSettings>) ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
