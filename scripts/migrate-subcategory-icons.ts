/**
 * Assign proper mdi:* icons to all subcategories.
 * Run: npx tsx scripts/migrate-subcategory-icons.ts
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
const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

// slug → mdi icon
const ICONS: Record<string, string> = {
  // hogar
  limpieza:              "mdi:spray-bottle",
  planchado:             "mdi:iron",
  mudanzas:              "mdi:truck",
  jardineria:            "mdi:flower",
  piscina:               "mdi:pool",
  decoracion:            "mdi:sofa",
  "cuidado-ninos":       "mdi:baby-carriage",
  "cuidado-mayores":     "mdi:account-heart",
  "seguridad-hogar":     "mdi:shield-home",

  // salud
  "centro-medico":       "mdi:hospital-building",
  nutricion:             "mdi:food-apple",
  psicologia:            "mdi:brain",
  fisio:                 "mdi:run",
  infantil:              "mdi:baby-face",
  dental:                "mdi:tooth",
  geriatria:             "mdi:human-cane",
  yoga:                  "mdi:yoga",
  "aseguradoras-salud":  "mdi:shield-cross",
  farmacias:             "mdi:pharmacy",

  // belleza
  peluqueria:            "mdi:content-cut",
  "manicura-pedicura":   "mdi:hand-wave",
  "tratamiento-facial":  "mdi:face-woman-shimmer",
  "tratamiento-corporal":"mdi:human",
  maquillaje:            "mdi:lipstick",
  depilacion:            "mdi:razor",
  spa:                   "mdi:hot-tub",
  "terapias-alternativas":"mdi:leaf",

  // restauracion
  pizza:                 "mdi:pizza",
  pasta:                 "mdi:noodles",
  sushi:                 "mdi:fish",
  vegan:                 "mdi:sprout",
  carne:                 "mdi:food-steak",
  pescado:               "mdi:fish",
  tacos:                 "mdi:taco",
  cocina:                "mdi:pot-steam",
  "dulces-postres":      "mdi:cupcake",
  poke:                  "mdi:bowl-mix",
  catering:              "mdi:silverware-fork-knife",
  "a-domicilio":         "mdi:moped",

  // aprende
  baile:                 "mdi:dance-ballroom",
  idiomas:               "mdi:translate",
  instrumentos:          "mdi:music",
  deportes:              "mdi:soccer",
  "fotografia-video":    "mdi:camera",
  "clases-repaso":       "mdi:pencil",
  "ski-snow":            "mdi:ski",

  // servicios-profesionales
  "legal-juridico":      "mdi:scale-balance",
  "financiero-contable": "mdi:cash-multiple",
  "consultoria-asesoria":"mdi:lightbulb",
  ett:                   "mdi:account-group",
  traducciones:          "mdi:translate",
  influencers:           "mdi:instagram",
  rrhh:                  "mdi:account-tie",
  "servicios-cliente":   "mdi:headset",

  // transporte
  taxi:                  "mdi:taxi",
  bus:                   "mdi:bus",
  "alquiler-vehiculo":   "mdi:car-key",
  "compra-vehiculo":     "mdi:car",
  "venta-vehiculo":      "mdi:car-arrow-right",
  paqueteria:            "mdi:package-variant",
  "aseguradoras-vehiculo":"mdi:shield-car",
  gruas:                 "mdi:tow-truck",
  "taller-mecanico":     "mdi:wrench",

  // mascotas
  veterinarias:          "mdi:doctor",
  paseadores:            "mdi:dog",
  "lavaderos-mascotas":  "mdi:shower",
  "alimentacion-mascotas":"mdi:bone",
  adiestramiento:        "mdi:dog-side",
  "guarderias-mascotas": "mdi:home-heart",

  // eventos
  "empresas-eventos":    "mdi:domain",
  bodas:                 "mdi:ring",
  "despedidas-cumpleanos":"mdi:cake",
  "dj-musica-vivo":      "mdi:disc",
  promocionales:         "mdi:bullhorn",
  "sin-animo-lucro":     "mdi:hand-heart",
  conciertos:            "mdi:microphone",
  arte:                  "mdi:palette",
  "deportivos-eventos":  "mdi:trophy",
  floristerias:          "mdi:flower-tulip",

  // construccion
  arquitectura:          "mdi:ruler-square",
  diseno:                "mdi:pencil-ruler",
  materiales:            "mdi:brick",
  fontaneria:            "mdi:pipe",
  carpinteria:           "mdi:saw-blade",
  electricidad:          "mdi:lightning-bolt",
  reformas:              "mdi:home-edit",
  "montaje-muebles":     "mdi:table-furniture",
  "soluciones-eco":      "mdi:leaf-circle",

  // inmobiliaria
  "compra-inmueble":     "mdi:home-plus",
  "venta-inmueble":      "mdi:home-minus",
  "alquiler-inmueble":   "mdi:key",

  // hoteles
  hostal:                "mdi:bunk-bed",
  apartamentos:          "mdi:city",
  bb:                    "mdi:coffee",
  "hotel-basico":        "mdi:star-outline",
  "hotel-medio":         "mdi:star-half-full",
  "hotel-superior":      "mdi:star",
  "hotel-lujo":          "mdi:crown",
  villas:                "mdi:home-city",
  camping:               "mdi:campfire",
};

async function migrate() {
  await mongoose.connect(MONGODB_URI!, { dbName: "vale" });
  console.log("✅ Connected\n");

  let updated = 0;
  for (const [slug, icon] of Object.entries(ICONS)) {
    const result = await Category.updateOne({ slug }, { $set: { icon } });
    if (result.modifiedCount > 0) {
      console.log(`  ✓ ${slug} → ${icon}`);
      updated++;
    } else {
      console.log(`  - ${slug} (not found or unchanged)`);
    }
  }

  console.log(`\n✅ Done — ${updated} subcategory icons updated`);
  await mongoose.disconnect();
}

migrate().catch((e) => { console.error("❌", e); process.exit(1); });
