/**
 * VALE Demo Seed Script
 * Seeds 15 users, 15 businesses, and 30–60 reviews with realistic Guatemalan data.
 * Run: npx tsx scripts/seed-demo.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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

// ── Inline schemas ─────────────────────────────────────────────────────────

const CategorySchema = new mongoose.Schema({ name: String, nameEn: String, slug: String, icon: String, order: Number, isActive: { type: Boolean, default: true } }, { timestamps: true });
const UserSchema = new mongoose.Schema({ email: String, passwordHash: String, role: { type: String, default: "user" }, name: String, avatar: String }, { timestamps: true });
const BusinessSchema = new mongoose.Schema({
  name: String, slug: String, logo: String, description: String, prices: String, gallery: [String],
  location: { address: String, city: String, country: { type: String, default: "Guatemala" }, coordinates: { lat: Number, lng: Number }, geoPoint: { type: { type: String }, coordinates: [Number] } },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  contactWhatsApp: String, contactEmail: String, contactWeb: String, contactInstagram: String, contactPhone: String,
  rating: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 },
  status: { type: String, default: "active" },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  plan: { type: String, default: "free" }, featuredUntil: Date,
}, { timestamps: true });
const ReviewSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: Number, text: String,
  proofUrl: { type: String, default: "https://placehold.co/400x300?text=Comprobante" },
  proofStatus: { type: String, default: "approved" },
  isPublished: { type: Boolean, default: true },
  businessReply: String, businessRepliedAt: Date,
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Business = mongoose.models.Business || mongoose.model("Business", BusinessSchema);
const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

// ── Data ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Restauración", nameEn: "Food & Dining", slug: "restauracion", icon: "mdi:food-fork-drink", order: 1 },
  { name: "Salud", nameEn: "Health", slug: "salud", icon: "mdi:hospital-box", order: 2 },
  { name: "Belleza", nameEn: "Beauty", slug: "belleza", icon: "mdi:scissors-cutting", order: 3 },
  { name: "Tecnología", nameEn: "Technology", slug: "tecnologia", icon: "mdi:laptop", order: 4 },
  { name: "Educación", nameEn: "Education", slug: "educacion", icon: "mdi:school", order: 5 },
  { name: "Hogar", nameEn: "Home", slug: "hogar", icon: "mdi:home-city", order: 6 },
  { name: "Transporte", nameEn: "Transport", slug: "transporte", icon: "mdi:car", order: 7 },
  { name: "Mascotas", nameEn: "Pets", slug: "mascotas", icon: "mdi:paw", order: 8 },
  { name: "Eventos", nameEn: "Events", slug: "eventos", icon: "mdi:party-popper", order: 9 },
  { name: "Finanzas", nameEn: "Finance", slug: "finanzas", icon: "mdi:bank", order: 10 },
];

const USERS = [
  { name: "Carlos Mendoza", email: "carlos@demo.com" },
  { name: "Ana García", email: "ana@demo.com" },
  { name: "Luis Rodríguez", email: "luis@demo.com" },
  { name: "María López", email: "maria@demo.com" },
  { name: "José Martínez", email: "jose@demo.com" },
  { name: "Sofia Herrera", email: "sofia@demo.com" },
  { name: "Diego Pérez", email: "diego@demo.com" },
  { name: "Valentina Cruz", email: "valentina@demo.com" },
  { name: "Andrés Torres", email: "andres@demo.com" },
  { name: "Camila Flores", email: "camila@demo.com" },
  { name: "Roberto Castillo", email: "roberto@demo.com" },
  { name: "Isabella Morales", email: "isabella@demo.com" },
  { name: "Fernando Jiménez", email: "fernando@demo.com" },
  { name: "Gabriela Reyes", email: "gabriela@demo.com" },
  { name: "Miguel Vargas", email: "miguel@demo.com" },
];

const BUSINESSES = [
  {
    name: "Restaurante La Fogata", slug: "restaurante-la-fogata",
    description: "Cocina guatemalteca tradicional con los mejores chiles rellenos y pepián de la zona. Ambiente familiar y acogedor en el corazón de la ciudad.",
    prices: "Q45–Q120 por persona", city: "Guatemala",
    cats: ["restauracion"], contactPhone: "+502 2345-6789", contactInstagram: "@lafogatagtm",
    contactWhatsApp: "+50212345678", plan: "paid",
    featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Café Quetzal", slug: "cafe-quetzal",
    description: "Specialty coffee con granos de origen guatemalteco directamente de las fincas del Altiplano. También ofrecemos desayunos y postres artesanales.",
    prices: "Q25–Q60", city: "Antigua Guatemala",
    cats: ["restauracion"], contactInstagram: "@cafequetzal",
    contactEmail: "hola@cafequetzal.com", plan: "paid",
    featuredUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Clínica Bienestar", slug: "clinica-bienestar",
    description: "Centro médico familiar con atención en medicina general, pediatría, ginecología y nutrición. Más de 10 años sirviendo a la comunidad.",
    prices: "Consulta desde Q150", city: "Guatemala",
    cats: ["salud"], contactPhone: "+502 2456-7890",
    contactWeb: "https://clinicabienestar.com", plan: "paid",
    featuredUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Salón Glam", slug: "salon-glam",
    description: "Salón de belleza especializado en coloración, cortes modernos, tratamientos capilares y manicure. Usamos productos profesionales de alta calidad.",
    prices: "Corte desde Q80, color desde Q250", city: "Guatemala",
    cats: ["belleza"], contactWhatsApp: "+50212567890", contactInstagram: "@glamgtm", plan: "free",
  },
  {
    name: "TechFix Guatemala", slug: "techfix-guatemala",
    description: "Reparación y mantenimiento de computadoras, laptops, tablets y teléfonos. Servicio técnico certificado con garantía en todos los trabajos.",
    prices: "Diagnóstico gratuito, reparación desde Q150", city: "Guatemala",
    cats: ["tecnologia"], contactPhone: "+502 2678-9012",
    contactEmail: "soporte@techfix.com.gt", plan: "free",
  },
  {
    name: "Academia Linguae", slug: "academia-linguae",
    description: "Escuela de idiomas con cursos de inglés, francés y alemán para todas las edades. Grupos reducidos y metodología comunicativa probada.",
    prices: "Q600/mes por nivel", city: "Guatemala",
    cats: ["educacion"], contactWeb: "https://linguae.edu.gt",
    contactPhone: "+502 2789-0123", plan: "paid",
    featuredUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Ferretería El Constructor", slug: "ferreteria-el-constructor",
    description: "Todo lo que necesitas para tus proyectos de construcción y remodelación. Amplio inventario de materiales, herramientas y acabados.",
    prices: "Precio de mayoreo disponible", city: "Mixco",
    cats: ["hogar"], contactPhone: "+502 2890-1234",
    contactWhatsApp: "+50212890123", plan: "free",
  },
  {
    name: "Express Cargo GT", slug: "express-cargo-gt",
    description: "Servicio de mensajería y paquetería en toda Guatemala. Entrega el mismo día en la capital y siguiente día en el interior.",
    prices: "Capital desde Q35, interior desde Q65", city: "Guatemala",
    cats: ["transporte"], contactPhone: "+502 2901-2345",
    contactWeb: "https://expresscargo.com.gt", plan: "free",
  },
  {
    name: "Veterinaria Patitas", slug: "veterinaria-patitas",
    description: "Atención médica veterinaria integral para mascotas. Consultas, vacunación, cirugías, peluquería y tienda de accesorios para tus animales.",
    prices: "Consulta Q80, cirugías desde Q500", city: "Guatemala",
    cats: ["mascotas"], contactWhatsApp: "+50213012345",
    contactInstagram: "@patitasvet", plan: "paid",
    featuredUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
  {
    name: "EventosPro", slug: "eventospro-guatemala",
    description: "Organización integral de eventos: bodas, quinceañeras, corporativos y más. Decoración, catering, fotografía y coordinación completa.",
    prices: "Consulta personalizada sin costo", city: "Guatemala",
    cats: ["eventos"], contactEmail: "info@eventospro.com.gt",
    contactWhatsApp: "+50213123456", plan: "paid",
    featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Asesoría Contable Torres", slug: "asesoria-contable-torres",
    description: "Servicios contables y fiscales para empresas y personas individuales. Declaraciones de ISR, IVA, auditorías y asesoría empresarial.",
    prices: "Desde Q800/mes para pymes", city: "Guatemala",
    cats: ["finanzas"], contactPhone: "+502 2234-5678",
    contactEmail: "contacto@contablestorres.com", plan: "free",
  },
  {
    name: "Pizzería Napoli", slug: "pizzeria-napoli",
    description: "Auténtica pizza italiana horneada en horno de leña. Masa madre, ingredientes importados y recetas tradicionales napolitanas.",
    prices: "Pizza individual Q75, familiar Q195", city: "Antigua Guatemala",
    cats: ["restauracion"], contactInstagram: "@napoligtm",
    contactPhone: "+502 2345-6780", plan: "free",
  },
  {
    name: "Centro Odontológico Smile", slug: "centro-odontologico-smile",
    description: "Clínica dental con tecnología de punta. Ortodoncia, implantes, blanqueamiento, limpieza y emergencias dentales. Atención sin dolor.",
    prices: "Limpieza Q150, consulta Q100", city: "Zona 10, Guatemala",
    cats: ["salud"], contactPhone: "+502 2456-7891",
    contactWeb: "https://smileguatemala.com", plan: "free",
  },
  {
    name: "Gym Power Zone", slug: "gym-power-zone",
    description: "Gimnasio equipado con lo último en máquinas de cardio y pesas. Clases de spinning, crossfit, yoga y entrenadores personales certificados.",
    prices: "Mensualidad Q250, clases sueltas Q35", city: "Guatemala",
    cats: ["salud", "hogar"], contactInstagram: "@powerzonegtm",
    contactWhatsApp: "+50213456789", plan: "free",
  },
  {
    name: "Tienda Verde Orgánicos", slug: "tienda-verde-organicos",
    description: "Productos orgánicos, naturales y saludables directamente de productores locales. Frutas, verduras, snacks sin gluten y superalimentos.",
    prices: "Canasta semanal desde Q180", city: "Guatemala",
    cats: ["restauracion", "salud"], contactEmail: "pedidos@tiendeverde.com",
    contactInstagram: "@tiendevertegt", plan: "free",
  },
];

const REVIEW_TEXTS: Record<number, string[]> = {
  5: [
    "Excelente servicio, superó mis expectativas. Definitivamente volvería.",
    "Todo perfecto: atención, calidad y precio. Lo recomiendo ampliamente.",
    "Una experiencia increíble. El personal es muy amable y profesional.",
    "De los mejores en Guatemala. Calidad de primer nivel.",
    "Muy satisfecho con el resultado. Rápido, eficiente y a buen precio.",
    "Increíble experiencia desde que entré hasta que salí. Todo impecable.",
    "El mejor servicio que he recibido en mucho tiempo. Sin duda regreso.",
    "100% recomendado. Calidad y atención que pocas veces se encuentran.",
    "Me sorprendió gratamente. Personal muy capacitado y amable.",
    "Superaron mis expectativas en todo sentido. ¡Volvería mil veces!",
    "Servicio de primera. Se nota que se preocupan por sus clientes.",
    "Excelente trato, precios justos y resultado impecable. Diez de diez.",
  ],
  4: [
    "Muy buen servicio, solo le falta un poco de atención en los detalles.",
    "Buena calidad general, recomendado. Volveré pronto.",
    "Muy buena experiencia. El tiempo de espera fue un poco largo pero valió la pena.",
    "Buen lugar, buena atención. Le daría 5 estrellas si el local fuera más grande.",
    "Satisfecho con el servicio. Buena relación calidad-precio.",
    "Muy buena atención al cliente. El resultado fue el esperado.",
    "Recomendable, aunque hay algunos aspectos menores que pueden pulir.",
    "Buen trabajo en general. Personal amigable y profesional.",
    "Experiencia positiva. Volveré a visitarles sin duda.",
    "Cumplió con lo prometido. Buena experiencia en general.",
    "Muy competente y servicial. Solo le falta un poco de rapidez.",
    "Buen servicio, instalaciones cómodas. Lo recomendaría a conocidos.",
  ],
  3: [
    "Regular, esperaba un poco más pero cumple su función.",
    "El servicio es bueno pero hay aspectos a mejorar.",
    "Ni muy bien ni muy mal. Puede mejorar en atención al cliente.",
    "Aceptable. La calidad es inconsistente según el día.",
    "Está bien para ser primera vez, pero hay margen de mejora.",
    "Servicio normal, nada que destaque pero tampoco que decepcione.",
    "Promedio. Con un poco más de esfuerzo podría ser excelente.",
    "Bien pero con potencial de mejorar. Lo intentaré de nuevo.",
    "Resultados aceptables. Esperaba algo más dado el precio.",
    "Está bien, aunque la espera fue un poco larga para lo que se hizo.",
  ],
  2: [
    "Tuve problemas con la atención. Esperaba más dado el precio.",
    "No fue lo que esperaba. El servicio tardó demasiado.",
    "La calidad dejó mucho que desear en esta ocasión.",
    "Poco profesional. Necesitan mejorar bastante.",
    "Decepcionate. No volvería a menos que cambien de actitud.",
    "Mala organización y tiempos de espera exagerados.",
    "El servicio no justifica el precio que cobran.",
    "Trato frío y resultado mediocre. Esperaba más.",
  ],
  1: [
    "Mala experiencia. No lo recomendaría a nadie.",
    "Pésimo servicio, nunca volvería. Muy decepcionante.",
    "No cumplen lo que prometen. Una lástima.",
    "Terrible atención. Perdí tiempo y dinero.",
    "Lo peor que he experimentado. Sin profesionalismo.",
  ],
};

const BUSINESS_REPLIES = [
  "¡Muchas gracias por su reseña! Nos alegra que haya tenido una buena experiencia.",
  "Gracias por visitarnos y compartir su opinión. ¡Esperamos verle pronto!",
  "Apreciamos sus comentarios. Seguimos trabajando para mejorar cada día.",
  "¡Gracias! Su opinión nos ayuda a crecer. ¡Bienvenido de vuelta cuando quiera!",
  "Lamentamos no haber cumplido sus expectativas. Le invitamos a darnos otra oportunidad.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Seed ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!, { dbName: "vale" });
  console.log("✅ Connected\n");

  // 1. Categories
  console.log("📁 Seeding categories...");
  const categoryIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: { ...cat, isActive: true } },
      { upsert: true, new: true }
    );
    categoryIds[cat.slug] = doc._id;
  }
  console.log(`   ✅ ${CATEGORIES.length} categories\n`);

  // 2. Users (role: "user")
  console.log("👥 Seeding users...");
  const passwordHash = await bcrypt.hash("demo1234!", 10);
  const userIds: mongoose.Types.ObjectId[] = [];
  for (const u of USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      userIds.push(existing._id);
      continue;
    }
    const doc = await User.create({ ...u, passwordHash, role: "user" });
    userIds.push(doc._id);
  }
  console.log(`   ✅ ${USERS.length} users (password: demo1234!)\n`);

  // 3. Business owners + businesses
  console.log("🏢 Seeding businesses...");
  const businessIds: mongoose.Types.ObjectId[] = [];
  for (const biz of BUSINESSES) {
    // Create or reuse an owner account
    const ownerEmail = `owner.${slug(biz.name)}@demo.com`;
    let owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
      owner = await User.create({
        name: `Dueño — ${biz.name}`,
        email: ownerEmail,
        passwordHash,
        role: "business_owner",
      });
    }

    // Resolve category ids
    const catIds = (biz.cats || []).map((s: string) => categoryIds[s]).filter(Boolean);

    const existing = await Business.findOne({ slug: biz.slug });
    if (existing) {
      businessIds.push(existing._id);
      console.log(`   ↩ skip existing: ${biz.name}`);
      continue;
    }

    const lat = 14.6 + (Math.random() - 0.5) * 0.4;
    const lng = -90.5 + (Math.random() - 0.5) * 0.4;

    const doc = await Business.create({
      name: biz.name,
      slug: biz.slug,
      description: biz.description,
      prices: biz.prices,
      location: {
        city: biz.city,
        country: "Guatemala",
        address: `${randInt(1, 30)} Calle ${randInt(1, 20)}-${randInt(10, 99)}, Zona ${randInt(1, 15)}`,
        coordinates: { lat, lng },
        geoPoint: { type: "Point", coordinates: [lng, lat] },
      },
      categories: catIds,
      contactPhone: biz.contactPhone,
      contactEmail: biz.contactEmail,
      contactWeb: biz.contactWeb,
      contactInstagram: biz.contactInstagram,
      contactWhatsApp: biz.contactWhatsApp,
      status: "active",
      ownerId: owner._id,
      plan: biz.plan || "free",
      featuredUntil: biz.featuredUntil,
      rating: 0,
      reviewCount: 0,
    });

    businessIds.push(doc._id);
    console.log(`   ✅ ${biz.name}`);
  }
  console.log(`   ✅ ${businessIds.length} businesses\n`);

  // 4. Reviews
  console.log("⭐ Seeding reviews...");
  let reviewCount = 0;
  const usedPairs = new Set<string>();

  // Load existing pairs to avoid duplicates
  const existingReviews = await Review.find({}).select("userId businessId").lean();
  for (const r of existingReviews) {
    usedPairs.add(`${r.userId}-${r.businessId}`);
  }

  for (const bizId of businessIds) {
    const numReviews = randInt(10, 13);
    const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5);
    let added = 0;

    for (const uid of shuffledUsers) {
      if (added >= numReviews) break;
      const pairKey = `${uid}-${bizId}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      // Weight ratings toward higher scores (more realistic)
      const ratingWeights = [1, 2, 5, 8, 10];
      const total = ratingWeights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * total;
      let rating = 1;
      for (let i = 0; i < ratingWeights.length; i++) {
        rand -= ratingWeights[i];
        if (rand <= 0) { rating = i + 1; break; }
      }

      const texts = REVIEW_TEXTS[rating] || REVIEW_TEXTS[3];
      const text = pick(texts);

      // 40% of reviews have a business reply
      const hasReply = Math.random() < 0.4;
      const createdAt = new Date(Date.now() - randInt(1, 180) * 24 * 60 * 60 * 1000);

      await Review.create({
        businessId: bizId,
        userId: uid,
        rating,
        text,
        proofUrl: "https://placehold.co/400x300?text=Comprobante",
        proofStatus: "approved",
        isPublished: true,
        businessReply: hasReply ? pick(BUSINESS_REPLIES) : undefined,
        businessRepliedAt: hasReply ? new Date(createdAt.getTime() + randInt(1, 5) * 24 * 60 * 60 * 1000) : undefined,
        createdAt,
        updatedAt: createdAt,
      });

      added++;
      reviewCount++;
    }

    // Recompute rating for this business
    const result = await Review.aggregate([
      { $match: { businessId: bizId, isPublished: true } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const { avg = 0, count = 0 } = result[0] ?? {};
    await Business.findByIdAndUpdate(bizId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: count,
    });
  }

  console.log(`   ✅ ${reviewCount} reviews seeded\n`);
  console.log("🎉 Demo seed complete!");
  console.log("   Users: carlos@demo.com ... miguel@demo.com  (password: demo1234!)");
  console.log("   Owners: owner.restaurante-la-fogata@demo.com ... etc.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
