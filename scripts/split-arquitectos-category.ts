/**
 * Split "Arquitectos e inmobiliarias" into "Construcción" + "Inmobiliaria"
 * Also removes "Vale Shop" category.
 * Run: npx tsx scripts/split-arquitectos-category.ts
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

const CategorySchema = new mongoose.Schema({ name: String, nameEn: String, slug: String, icon: String, order: Number }, { strict: false });
const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

async function run() {
  await mongoose.connect(MONGODB_URI!, { dbName: "vale" });
  console.log("✅ Connected\n");

  // 1. Rename "arquitectos-inmobiliarias" → "Construcción"
  const renamed = await Category.findOneAndUpdate(
    { slug: "arquitectos-inmobiliarias" },
    { $set: { name: "Construcción", nameEn: "Construction", slug: "construccion", icon: "mdi:hammer", order: 11 } },
    { new: true }
  );
  if (renamed) {
    console.log(`✓ Renamed "Arquitectos e inmobiliarias" → "Construcción" (slug: construccion)`);
  } else {
    console.log(`– "arquitectos-inmobiliarias" not found, skipping rename`);
  }

  // 2. Insert "Inmobiliaria" if it doesn't exist
  const exists = await Category.findOne({ slug: "inmobiliaria" });
  if (!exists) {
    await Category.create({ name: "Inmobiliaria", nameEn: "Real Estate", slug: "inmobiliaria", icon: "mdi:office-building", order: 12 });
    console.log(`✓ Created "Inmobiliaria" (slug: inmobiliaria)`);
  } else {
    console.log(`– "inmobiliaria" already exists, skipping`);
  }

  // 3. Update orders for vale-shop and hoteles
  await Category.updateOne({ slug: "vale-shop" }, { $set: { order: 13 } });
  await Category.updateOne({ slug: "hoteles" }, { $set: { order: 14 } });
  console.log(`✓ Updated orders for vale-shop (13) and hoteles (14)`);

  // 4. Remove Vale Shop
  const deleted = await Category.deleteOne({ slug: "vale-shop" });
  if (deleted.deletedCount) {
    console.log(`✓ Deleted "Vale Shop"`);
  } else {
    console.log(`– "vale-shop" not found`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

run().catch((e) => { console.error("❌", e); process.exit(1); });
