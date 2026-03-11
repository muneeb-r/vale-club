/**
 * VALE Database Seed Script
 * Run: npx tsx scripts/seed.ts
 *
 * Requires .env.local with MONGODB_URI and optionally:
 *   ADMIN_EMAIL (default: admin@vale.club)
 *   ADMIN_PASSWORD (default: admin123!)
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(__dirname, "../.env.local");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in .env.local");
  process.exit(1);
}

// Inline schemas (avoid importing from Next.js models directly in scripts)
const CategorySchema = new mongoose.Schema(
  {
    name: String,
    nameEn: String,
    slug: String,
    icon: String,
    order: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    email: String,
    passwordHash: String,
    role: { type: String, enum: ["admin", "business_owner", "user"], default: "user" },
    name: String,
  },
  { timestamps: true }
);

const Category =
  (mongoose.models.Category as mongoose.Model<mongoose.Document>) ||
  mongoose.model("Category", CategorySchema);

const User =
  (mongoose.models.User as mongoose.Model<mongoose.Document>) ||
  mongoose.model("User", UserSchema);

const CATEGORIES = [
  { name: "Hogar",         nameEn: "Home",          nameCa: "Llar",            slug: "hogar",        icon: "mdi:home",            order: 1  },
  { name: "Salud",         nameEn: "Health",         nameCa: "Salut",           slug: "salud",        icon: "mdi:heart-pulse",     order: 2  },
  { name: "Belleza",       nameEn: "Beauty",         nameCa: "Bellesa",         slug: "belleza",      icon: "mdi:spa",             order: 3  },
  { name: "Restauración",  nameEn: "Food & Dining",  nameCa: "Restauració",     slug: "restauracion", icon: "mdi:food-fork-drink", order: 4  },
  { name: "Educación",     nameEn: "Education",      nameCa: "Educació",        slug: "educacion",    icon: "mdi:school",          order: 5  },
  { name: "Tecnología",    nameEn: "Technology",     nameCa: "Tecnologia",      slug: "tecnologia",   icon: "mdi:laptop",          order: 6  },
  { name: "Transporte",    nameEn: "Transport",      nameCa: "Transport",       slug: "transporte",   icon: "mdi:car",             order: 7  },
  { name: "Mascotas",      nameEn: "Pets",           nameCa: "Mascotes",        slug: "mascotas",     icon: "mdi:paw",             order: 8  },
  { name: "Eventos",       nameEn: "Events",         nameCa: "Esdeveniments",   slug: "eventos",      icon: "mdi:party-popper",    order: 9  },
  { name: "Finanzas",      nameEn: "Finance",        nameCa: "Finances",        slug: "finanzas",     icon: "mdi:cash",            order: 10 },
  { name: "Construcción",  nameEn: "Construction",   nameCa: "Construcció",     slug: "construccion", icon: "mdi:hammer",          order: 11 },
  { name: "Inmobiliaria",  nameEn: "Real Estate",    nameCa: "Immobiliària",    slug: "inmobiliaria", icon: "mdi:office-building", order: 12 },
  { name: "Hoteles",       nameEn: "Hotels",         nameCa: "Hotels",          slug: "hoteles",      icon: "mdi:bed",             order: 13 },
];

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!, { dbName: "vale" });
  console.log("✅ Connected");

  // Seed categories
  console.log("📁 Seeding categories...");
  for (const cat of CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true }
    );
  }
  console.log(`✅ ${CATEGORIES.length} categories seeded`);

  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@vale.club";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.collection.insertOne({
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "admin",
      name: "Admin VALE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  console.log("\n🎉 Seed complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
