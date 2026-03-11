/**
 * Migration: add nameCa (Catalan) to all categories
 * Run: npx tsx scripts/migrate-add-nameca.ts
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

const CategorySchema = new mongoose.Schema({}, { strict: false });
const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

const SLUG_TO_NAMECA: Record<string, string> = {
  hogar:        "Llar",
  salud:        "Salut",
  belleza:      "Bellesa",
  restauracion: "Restauració",
  educacion:    "Educació",
  tecnologia:   "Tecnologia",
  transporte:   "Transport",
  mascotas:     "Mascotes",
  eventos:      "Esdeveniments",
  finanzas:     "Finances",
  construccion: "Construcció",
  inmobiliaria: "Immobiliària",
  hoteles:      "Hotels",
};

async function migrate() {
  await mongoose.connect(MONGODB_URI!, { dbName: "vale" });
  console.log("✅ Connected\n");

  const cats = await Category.find({}).lean() as any[];
  let updated = 0;

  for (const cat of cats) {
    const nameCa = SLUG_TO_NAMECA[cat.slug];
    if (nameCa && cat.nameCa !== nameCa) {
      await Category.updateOne({ _id: cat._id }, { $set: { nameCa } });
      console.log(`  ✓ ${cat.slug}: nameCa = "${nameCa}"`);
      updated++;
    } else {
      console.log(`  – ${cat.slug}: skipped`);
    }
  }

  console.log(`\n✅ Done. ${updated} updated.`);
  await mongoose.disconnect();
}

migrate().catch((e) => { console.error("❌", e); process.exit(1); });
