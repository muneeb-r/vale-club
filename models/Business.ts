import mongoose, { Schema, Document } from "mongoose";
import "./Category";
import "./Plan";

export type BusinessStatus = "pending" | "inreview" | "active" | "blocked" | "rejected";

export interface IBusiness extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  description: string;
  prices?: string;
  gallery: string[];
  location: {
    placeName?: string; // establishment name from Google Maps
    address?: string;
    city?: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    // GeoJSON Point for geospatial queries ($near, radius filters)
    geoPoint?: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
  };
  categories: mongoose.Types.ObjectId[];
  contactWhatsApp?: string;
  contactEmail?: string;
  contactWeb?: string;
  contactInstagram?: string;
  contactPhone?: string;
  rating: number;
  reviewCount: number;
  status: "pending" | "inreview" | "active" | "blocked" | "rejected";
  ownerId: mongoose.Types.ObjectId;
  plan: "free" | "paid";
  planId?: mongoose.Types.ObjectId;
  featuredUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    logo: { type: String },
    description: { type: String, default: "" },
    prices: { type: String },
    gallery: [{ type: String }],
    location: {
      placeName: { type: String },
      address: { type: String },
      city: { type: String },
      country: { type: String, default: "Guatemala" },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      geoPoint: {
        type: { type: String, enum: ["Point"] },
        coordinates: { type: [Number] }, // [lng, lat]
      },
    },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    contactWhatsApp: { type: String },
    contactEmail: { type: String },
    contactWeb: { type: String },
    contactInstagram: { type: String },
    contactPhone: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "inreview", "active", "blocked", "rejected"],
      default: "pending",
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: { type: String, enum: ["free", "paid"], default: "free" },
    planId: { type: Schema.Types.ObjectId, ref: "Plan" },
    featuredUntil: { type: Date },
  },
  { timestamps: true },
);

// Text index for full-text search
BusinessSchema.index(
  { name: "text", description: "text" },
  { weights: { name: 10, description: 1 }, name: "business_text_index" },
);

// Compound indexes for filtered queries
BusinessSchema.index({ status: 1, rating: -1 });
BusinessSchema.index({ "location.city": 1, status: 1, rating: -1 });
BusinessSchema.index({ categories: 1, status: 1, rating: -1 });
// 2dsphere index for geospatial radius queries ($near, $geoWithin)
BusinessSchema.index({ "location.geoPoint": "2dsphere" });

// Force recompile when schema changes — safe because connectDB caches the connection
if (mongoose.models.Business) {
  delete (mongoose.models as Record<string, unknown>).Business;
}
export const Business = mongoose.model<IBusiness>("Business", BusinessSchema);
