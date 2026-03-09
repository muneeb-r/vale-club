/**
 * Remove "Everything included in the Basic Plan" feature from all plans.
 * Run: npx tsx scripts/fix-plan-features.ts
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../.env.local");
if (existsSync(envPath)) dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("❌ MONGODB_URI not set"); process.exit(1); }

const PlanSchema = new mongoose.Schema({}, { strict: false });
const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);

async function run() {
  await mongoose.connect(MONGODB_URI!, { dbName: "vale" });
  console.log("✅ Connected\n");

  const plans = await Plan.find({}).lean() as any[];

  for (const plan of plans) {
    const name = typeof plan.name === "object" ? plan.name.es || plan.name.en : plan.name;
    console.log(`Plan: ${name}`);
    console.log("  Features before:", JSON.stringify(plan.features));

    const filtered = (plan.features ?? []).filter((f: any) => {
      const text = typeof f === "string" ? f : (f.es || f.en || "");
      const textEn = typeof f === "string" ? f : (f.en || f.es || "");
      // Remove any "included in Basic/Pro" type features
      return !text.toLowerCase().includes("basic") &&
             !textEn.toLowerCase().includes("basic") &&
             !text.toLowerCase().includes("básico") &&
             !text.toLowerCase().includes("incluido en") &&
             !textEn.toLowerCase().includes("included in");
    });

    if (filtered.length !== (plan.features ?? []).length) {
      await Plan.updateOne({ _id: plan._id }, { $set: { features: filtered } });
      console.log("  Features after: ", JSON.stringify(filtered));
      console.log("  ✓ Updated\n");
    } else {
      console.log("  – No matching features to remove\n");
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => { console.error("❌", e); process.exit(1); });
