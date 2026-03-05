/**
 * Migration: update category icons to Iconify format (mdi:xxx)
 * Run: npx tsx scripts/migrate-category-icons.ts
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

const CategorySchema = new mongoose.Schema({ name: String, slug: String, icon: String }, { strict: false });
const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

const SLUG_TO_ICON: Record<string, string> = {
  hogar:        "mdi:home",
  salud:        "mdi:heart-pulse",
  belleza:      "mdi:spa",
  restauracion: "mdi:food-fork-drink",
  educacion:    "mdi:school",
  tecnologia:   "mdi:laptop",
  transporte:   "mdi:car",
  mascotas:     "mdi:paw",
  eventos:      "mdi:party-popper",
  finanzas:     "mdi:cash",
};

async function migrate() {
  await mongoose.connect(MONGODB_URI!, { dbName: "vale" });
  console.log("✅ Connected");

  const cats = await Category.find({});
  let updated = 0;

  for (const cat of cats) {
    const iconName = SLUG_TO_ICON[cat.slug];
    if (iconName && cat.icon !== iconName) {
      await Category.updateOne({ _id: cat._id }, { $set: { icon: iconName } });
      console.log(`  ✓ ${cat.slug}: "${cat.icon}" → "${iconName}"`);
      updated++;
    } else {
      console.log(`  – ${cat.slug}: skipped (icon="${cat.icon}")`);
    }
  }

  console.log(`\n✅ Done. ${updated} updated.`);
  await mongoose.disconnect();
}

migrate().catch((e) => { console.error("❌", e); process.exit(1); });
