import mongoose, { Schema, Document } from "mongoose";

export interface IPendingRedsysPayment extends Document {
  orderId: string;
  type: "plan" | "shop";
  status: "pending" | "paid" | "failed";
  // Plan fields
  businessId?: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  billingCycle?: "monthly" | "yearly";
  // Shop fields
  serviceId?: mongoose.Types.ObjectId;
  customerName?: string;
  customerEmail?: string;
  customerMessage?: string;
  // Payment
  amount: number; // EUR cents
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const PendingRedsysPaymentSchema = new Schema<IPendingRedsysPayment>(
  {
    orderId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["plan", "shop"], required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    businessId: { type: Schema.Types.ObjectId, ref: "Business" },
    planId: { type: Schema.Types.ObjectId, ref: "Plan" },
    billingCycle: { type: String, enum: ["monthly", "yearly"] },
    serviceId: { type: Schema.Types.ObjectId, ref: "ShopService" },
    customerName: { type: String },
    customerEmail: { type: String },
    customerMessage: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "978" },
  },
  { timestamps: true }
);

// Auto-expire pending payments after 2 hours
PendingRedsysPaymentSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7200, partialFilterExpression: { status: "pending" } }
);

export const PendingRedsysPayment =
  (mongoose.models.PendingRedsysPayment as mongoose.Model<IPendingRedsysPayment>) ||
  mongoose.model<IPendingRedsysPayment>("PendingRedsysPayment", PendingRedsysPaymentSchema);
