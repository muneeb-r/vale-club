import mongoose, { Schema, Document } from "mongoose";
import "./Business";
import "./Plan";
import "./User";
import "./SubscriptionRequest";

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  // Snapshot fields — stored at subscription time so history is accurate even if plan changes
  planName: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  requestId?: mongoose.Types.ObjectId;
  approvedByAdminId?: mongoose.Types.ObjectId;
  // Track when warning email was sent to avoid duplicates
  renewalWarningSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    planName: { type: String, required: true },
    price: { type: Number, required: true },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    requestId: { type: Schema.Types.ObjectId, ref: "SubscriptionRequest" },
    approvedByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
    renewalWarningSentAt: { type: Date },
  },
  { timestamps: true },
);

// Compound index for cron queries: find active subscriptions by end date
SubscriptionSchema.index({ status: 1, endDate: 1 });

if (mongoose.models.Subscription) {
  delete (mongoose.models as Record<string, unknown>).Subscription;
}
export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema,
);
