/**
 * Seed Vale Shop categories + services
 * Run: npx tsx scripts/seed-shop.ts
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

const ShopCategorySchema = new mongoose.Schema({}, { strict: false });
const ShopServiceSchema = new mongoose.Schema({}, { strict: false });
const ShopCategory = mongoose.models.ShopCategory || mongoose.model("ShopCategory", ShopCategorySchema);
const ShopService = mongoose.models.ShopService || mongoose.model("ShopService", ShopServiceSchema);

const CATEGORIES = [
  { slug: "reels",    name: { es: "Reels",           en: "Reels",         ca: "Reels"          }, icon: "mdi:video",          order: 1, isActive: true },
  { slug: "chatbots", name: { es: "Chatbots",         en: "Chatbots",      ca: "Chatbots"        }, icon: "mdi:robot",          order: 2, isActive: true },
  { slug: "web",      name: { es: "Web",              en: "Web",           ca: "Web"             }, icon: "mdi:web",            order: 3, isActive: true },
  { slug: "otros",    name: { es: "Otros servicios",  en: "Other services",ca: "Altres serveis"  }, icon: "mdi:star-circle",    order: 4, isActive: true },
];

async function seed() {
  await mongoose.connect(MONGODB_URI!, { dbName: "vale" });
  console.log("✅ Connected\n");

  // Upsert categories
  const catIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of CATEGORIES) {
    const doc = await ShopCategory.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, new: true }
    );
    catIds[cat.slug] = doc._id;
    console.log(`  ✓ Category: ${cat.slug}`);
  }

  // Re-seed services
  await ShopService.deleteMany({});
  const SERVICES = [
    // Reels
    { category: catIds["reels"], name: { es: "1 Reel", en: "1 Reel", ca: "1 Reel" }, description: { es: "Producción de un reel profesional para redes sociales.", en: "Production of one professional reel for social media.", ca: "Producció d'un reel professional per a xarxes socials." }, price: 100, priceType: "fixed", order: 1, isActive: true },
    { category: catIds["reels"], name: { es: "Pack 5 Reels", en: "Pack 5 Reels", ca: "Pack 5 Reels" }, description: { es: "Pack promocional de 5 reels profesionales.", en: "Promotional pack of 5 professional reels.", ca: "Pack promocional de 5 reels professionals." }, price: 500, promoPrice: 400, priceType: "fixed", order: 2, isActive: true },
    // Chatbots
    { category: catIds["chatbots"], name: { es: "Chatbot Básico Web", en: "Basic Web Chatbot", ca: "Chatbot Bàsic Web" }, description: { es: "Chatbot básico integrado en tu web.", en: "Basic chatbot integrated into your website.", ca: "Chatbot bàsic integrat al teu web." }, price: 2000, priceType: "fixed", order: 1, isActive: true },
    { category: catIds["chatbots"], name: { es: "Chatbot Intermedio", en: "Intermediate Chatbot", ca: "Chatbot Intermedi" }, description: { es: "Chatbot intermedio con funcionalidades avanzadas.", en: "Intermediate chatbot with advanced features.", ca: "Chatbot intermedi amb funcionalitats avançades." }, price: 3000, priceType: "fixed", order: 2, isActive: true },
    { category: catIds["chatbots"], name: { es: "Chatbot Pro", en: "Pro Chatbot", ca: "Chatbot Pro" }, description: { es: "Chatbot Pro con WhatsApp + web. Incluye 200 mensajes al mes.", en: "Pro chatbot with WhatsApp + web. Includes 200 messages/month.", ca: "Chatbot Pro amb WhatsApp + web. Inclou 200 missatges al mes." }, price: 4000, priceType: "fixed", order: 3, isActive: true },
    { category: catIds["chatbots"], name: { es: "Chatbot Ilimitado", en: "Unlimited Chatbot", ca: "Chatbot Il·limitat" }, description: { es: "Solución de chatbot personalizada sin límites.", en: "Custom unlimited chatbot solution.", ca: "Solució de chatbot personalitzada sense límits." }, priceType: "quote", order: 4, isActive: true },
    // Web
    { category: catIds["web"], name: { es: "Web Corporativa Sencilla", en: "Simple Corporate Website", ca: "Web Corporativa Senzilla" }, description: { es: "Web corporativa de hasta 5 páginas.", en: "Corporate website up to 5 pages.", ca: "Web corporativa de fins a 5 pàgines." }, price: 1500, priceType: "fixed", order: 1, isActive: true },
    { category: catIds["web"], name: { es: "Web Corporativa Media", en: "Medium Corporate Website", ca: "Web Corporativa Mitja" }, description: { es: "Web corporativa con más páginas y funcionalidades.", en: "Corporate website with more pages and features.", ca: "Web corporativa amb més pàgines i funcionalitats." }, price: 2300, priceType: "fixed", order: 2, isActive: true },
    { category: catIds["web"], name: { es: "Web Pro / Ecommerce / Tienda Online", en: "Pro Web / Ecommerce / Online Store", ca: "Web Pro / Ecommerce / Botiga Online" }, description: { es: "Solución web avanzada o tienda online a medida.", en: "Advanced web solution or custom online store.", ca: "Solució web avançada o botiga online a mida." }, priceType: "quote", order: 3, isActive: true },
    // Otros
    { category: catIds["otros"], name: { es: "Motor de Reservas", en: "Booking Engine", ca: "Motor de Reserves" }, description: { es: "Sistema de reservas personalizado para tu negocio.", en: "Custom booking system for your business.", ca: "Sistema de reserves personalitzat per al teu negoci." }, priceType: "quote", order: 1, isActive: true },
    { category: catIds["otros"], name: { es: "Influencer Management", en: "Influencer Management", ca: "Influencer Management" }, description: { es: "Gestión de influencers para tu marca.", en: "Influencer management for your brand.", ca: "Gestió d'influencers per a la teva marca." }, priceType: "quote", order: 2, isActive: true },
  ];

  const result = await ShopService.insertMany(SERVICES);
  console.log(`\n✅ Inserted ${result.length} services`);
  await mongoose.disconnect();
}

seed().catch((e) => { console.error("❌", e); process.exit(1); });
