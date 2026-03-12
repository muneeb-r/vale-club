/**
 * Seed parent categories + subcategories from the new structure.
 * Run: npx tsx scripts/seed-subcategories.ts
 *
 * Parent categories are upserted first, then subcategories are linked via parentCategory.
 * Existing records are updated (upsert), nothing is deleted.
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

// ─── Parent categories (top-level) ────────────────────────────────────────────
// Matches the spreadsheet columns. We reuse existing slugs where they exist.
const PARENTS: Array<{ slug: string; name: string; nameEn: string; nameCa: string; icon: string; order: number }> = [
  { slug: "hogar",                name: "Hogar",                  nameEn: "Home",                   nameCa: "Llar",                    icon: "mdi:home",                  order: 1  },
  { slug: "salud",                name: "Salud",                  nameEn: "Health",                 nameCa: "Salut",                   icon: "mdi:heart-pulse",           order: 2  },
  { slug: "belleza",              name: "Belleza",                nameEn: "Beauty",                 nameCa: "Bellesa",                 icon: "mdi:spa",                   order: 3  },
  { slug: "restauracion",         name: "Restauración",           nameEn: "Food & Dining",          nameCa: "Restauració",             icon: "mdi:food-fork-drink",       order: 4  },
  { slug: "aprende",              name: "Aprende",                nameEn: "Learn",                  nameCa: "Aprèn",                   icon: "mdi:school",                order: 5  },
  { slug: "servicios-profesionales", name: "Servicios Profesionales", nameEn: "Professional Services", nameCa: "Serveis Professionals",  icon: "mdi:briefcase",             order: 6  },
  { slug: "transporte",           name: "Transporte",             nameEn: "Transport",              nameCa: "Transport",               icon: "mdi:car",                   order: 7  },
  { slug: "mascotas",             name: "Mascotas",               nameEn: "Pets",                   nameCa: "Mascotes",                icon: "mdi:paw",                   order: 8  },
  { slug: "eventos",              name: "Eventos",                nameEn: "Events",                 nameCa: "Esdeveniments",           icon: "mdi:party-popper",          order: 9  },
  { slug: "construccion",         name: "Construcción",           nameEn: "Construction",           nameCa: "Construcció",             icon: "mdi:hammer",                order: 10 },
  { slug: "inmobiliaria",         name: "Inmobiliaria",           nameEn: "Real Estate",            nameCa: "Immobiliària",            icon: "mdi:office-building",       order: 11 },
  { slug: "hoteles",              name: "Hoteles",                nameEn: "Hotels",                 nameCa: "Hotels",                  icon: "mdi:bed",                   order: 12 },
];

// ─── Subcategories keyed by parent slug ───────────────────────────────────────
const SUBCATEGORIES: Record<string, Array<{ slug: string; name: string; nameEn: string; nameCa: string; icon: string; order: number }>> = {
  hogar: [
    { slug: "limpieza",            name: "Limpieza",            nameEn: "Cleaning",             nameCa: "Neteja",               icon: "mdi:spray-bottle",      order: 1  },
    { slug: "planchado",           name: "Planchado",           nameEn: "Ironing",              nameCa: "Planxat",              icon: "mdi:iron",              order: 2  },
    { slug: "mudanzas",            name: "Mudanzas",            nameEn: "Moving",               nameCa: "Mudances",             icon: "mdi:truck",             order: 3  },
    { slug: "jardineria",          name: "Jardinería",          nameEn: "Gardening",            nameCa: "Jardineria",           icon: "mdi:flower",            order: 4  },
    { slug: "piscina",             name: "Piscina",             nameEn: "Swimming Pool",        nameCa: "Piscina",              icon: "mdi:pool",              order: 5  },
    { slug: "decoracion",          name: "Decoración",          nameEn: "Decoration",           nameCa: "Decoració",            icon: "mdi:sofa",              order: 6  },
    { slug: "cuidado-ninos",       name: "Cuidado de niños",    nameEn: "Childcare",            nameCa: "Cura de nens",         icon: "mdi:baby-carriage",     order: 7  },
    { slug: "cuidado-mayores",     name: "Cuidado de personas mayores", nameEn: "Elderly Care", nameCa: "Cura de gent gran",    icon: "mdi:account-heart",     order: 8  },
    { slug: "seguridad-hogar",     name: "Seguridad en tu hogar", nameEn: "Home Security",     nameCa: "Seguretat a la llar",  icon: "mdi:shield-home",       order: 9  },
  ],
  salud: [
    { slug: "centro-medico",       name: "Centro médico",       nameEn: "Medical Centre",       nameCa: "Centre mèdic",         icon: "mdi:hospital-building", order: 1  },
    { slug: "nutricion",           name: "Nutrición",           nameEn: "Nutrition",            nameCa: "Nutrició",             icon: "mdi:food-apple",        order: 2  },
    { slug: "psicologia",          name: "Psicología",          nameEn: "Psychology",           nameCa: "Psicologia",           icon: "mdi:brain",             order: 3  },
    { slug: "fisio",               name: "Fisio",               nameEn: "Physiotherapy",        nameCa: "Fisio",                icon: "mdi:run",               order: 4  },
    { slug: "infantil",            name: "Infantil",            nameEn: "Paediatrics",          nameCa: "Infantil",             icon: "mdi:baby-face",         order: 5  },
    { slug: "dental",              name: "Dental",              nameEn: "Dental",               nameCa: "Dental",               icon: "mdi:tooth",             order: 6  },
    { slug: "geriatria",           name: "Geriatría",           nameEn: "Geriatrics",           nameCa: "Geriatria",            icon: "mdi:human-cane",        order: 7  },
    { slug: "yoga",                name: "Yoga",                nameEn: "Yoga",                 nameCa: "Ioga",                 icon: "mdi:yoga",              order: 8  },
    { slug: "aseguradoras-salud",  name: "Aseguradoras",        nameEn: "Insurers",             nameCa: "Asseguradores",        icon: "mdi:shield-cross",      order: 9  },
    { slug: "farmacias",           name: "Farmacias",           nameEn: "Pharmacies",           nameCa: "Farmàcies",            icon: "mdi:pharmacy",          order: 10 },
  ],
  belleza: [
    { slug: "peluqueria",          name: "Peluquería",          nameEn: "Hair Salon",           nameCa: "Perruqueria",          icon: "mdi:content-cut",       order: 1  },
    { slug: "manicura-pedicura",   name: "Manicura / Pedicura", nameEn: "Manicure / Pedicure",  nameCa: "Manicura / Pedicura",  icon: "mdi:hand-wave",         order: 2  },
    { slug: "tratamiento-facial",  name: "Tratamiento facial",  nameEn: "Facial Treatment",     nameCa: "Tractament facial",    icon: "mdi:face-woman-shimmer",order: 3  },
    { slug: "tratamiento-corporal",name: "Tratamiento corporal",nameEn: "Body Treatment",       nameCa: "Tractament corporal",  icon: "mdi:human",             order: 4  },
    { slug: "maquillaje",          name: "Maquillaje",          nameEn: "Make-up",              nameCa: "Maquillatge",          icon: "mdi:lipstick",          order: 5  },
    { slug: "depilacion",          name: "Depilación",          nameEn: "Hair Removal",         nameCa: "Depilació",            icon: "mdi:razor",             order: 6  },
    { slug: "spa",                 name: "Spa",                 nameEn: "Spa",                  nameCa: "Spa",                  icon: "mdi:hot-tub",           order: 7  },
    { slug: "terapias-alternativas",name: "Terapias alternativas",nameEn: "Alternative Therapies",nameCa: "Teràpies alternatives",icon: "mdi:leaf",             order: 8  },
  ],
  restauracion: [
    { slug: "pizza",               name: "Pizza",               nameEn: "Pizza",                nameCa: "Pizza",                icon: "mdi:pizza",             order: 1  },
    { slug: "pasta",               name: "Pasta",               nameEn: "Pasta",                nameCa: "Pasta",                icon: "mdi:noodles",           order: 2  },
    { slug: "sushi",               name: "Sushi",               nameEn: "Sushi",                nameCa: "Sushi",                icon: "mdi:fish",              order: 3  },
    { slug: "vegan",               name: "Vegano",              nameEn: "Vegan",                nameCa: "Vegà",                 icon: "mdi:sprout",            order: 4  },
    { slug: "carne",               name: "Carne",               nameEn: "Meat",                 nameCa: "Carn",                 icon: "mdi:food-steak",        order: 5  },
    { slug: "pescado",             name: "Pescado",             nameEn: "Fish",                 nameCa: "Peix",                 icon: "mdi:fish",              order: 6  },
    { slug: "tacos",               name: "Tacos",               nameEn: "Tacos",                nameCa: "Tacos",                icon: "mdi:taco",              order: 7  },
    { slug: "cocina",              name: "Cocina",              nameEn: "Kitchen",              nameCa: "Cuina",                icon: "mdi:pot-steam",         order: 8  },
    { slug: "dulces-postres",      name: "Dulces y postres",    nameEn: "Sweets & Desserts",    nameCa: "Dolços i postres",     icon: "mdi:cupcake",           order: 9  },
    { slug: "poke",                name: "Poké",                nameEn: "Poké",                 nameCa: "Poké",                 icon: "mdi:bowl-mix",          order: 10 },
    { slug: "catering",            name: "Catering",            nameEn: "Catering",             nameCa: "Càtering",             icon: "mdi:silverware-fork-knife", order: 11 },
    { slug: "a-domicilio",         name: "A domicilio",         nameEn: "Home delivery",        nameCa: "A domicili",           icon: "mdi:moped",             order: 12 },
  ],
  aprende: [
    { slug: "baile",               name: "Baile",               nameEn: "Dance",                nameCa: "Ball",                 icon: "mdi:dance-ballroom",    order: 1  },
    { slug: "idiomas",             name: "Idiomas",             nameEn: "Languages",            nameCa: "Idiomes",              icon: "mdi:translate",         order: 2  },
    { slug: "instrumentos",        name: "Instrumentos",        nameEn: "Instruments",          nameCa: "Instruments",          icon: "mdi:music",             order: 3  },
    { slug: "deportes",            name: "Deportes",            nameEn: "Sports",               nameCa: "Esports",              icon: "mdi:soccer",            order: 4  },
    { slug: "fotografia-video",    name: "Fotografía / Vídeo",  nameEn: "Photography / Video",  nameCa: "Fotografia / Vídeo",   icon: "mdi:camera",            order: 5  },
    { slug: "clases-repaso",       name: "Clases de repaso",    nameEn: "Tutoring",             nameCa: "Classes de repàs",     icon: "mdi:pencil",            order: 6  },
    { slug: "ski-snow",            name: "Ski / Snow",          nameEn: "Ski / Snow",           nameCa: "Esquí / Neu",          icon: "mdi:ski",               order: 7  },
  ],
  "servicios-profesionales": [
    { slug: "legal-juridico",      name: "Legal / Jurídico",    nameEn: "Legal",                nameCa: "Legal / Jurídic",      icon: "mdi:scale-balance",     order: 1  },
    { slug: "financiero-contable", name: "Financiero / Contable",nameEn: "Financial / Accounting",nameCa: "Financer / Comptable",icon: "mdi:cash-multiple",     order: 2  },
    { slug: "consultoria-asesoria",name: "Consultoría / Asesoría",nameEn: "Consulting / Advisory",nameCa: "Consultoria / Assessoria",icon: "mdi:lightbulb",     order: 3  },
    { slug: "ett",                 name: "ETT",                 nameEn: "Temp Agency",          nameCa: "ETT",                  icon: "mdi:account-group",     order: 4  },
    { slug: "traducciones",        name: "Traducciones",        nameEn: "Translations",         nameCa: "Traduccions",          icon: "mdi:translate",         order: 5  },
    { slug: "influencers",         name: "Influencers",         nameEn: "Influencers",          nameCa: "Influencers",          icon: "mdi:instagram",         order: 6  },
    { slug: "rrhh",                name: "RRHH",                nameEn: "HR",                   nameCa: "RRHH",                 icon: "mdi:account-tie",       order: 7  },
    { slug: "servicios-cliente",   name: "Servicios al cliente",nameEn: "Customer Service",     nameCa: "Serveis al client",    icon: "mdi:headset",           order: 8  },
  ],
  transporte: [
    { slug: "taxi",                name: "Taxi",                nameEn: "Taxi",                 nameCa: "Taxi",                 icon: "mdi:taxi",              order: 1  },
    { slug: "bus",                 name: "Bus",                 nameEn: "Bus",                  nameCa: "Bus",                  icon: "mdi:bus",               order: 2  },
    { slug: "alquiler-vehiculo",   name: "Alquiler",            nameEn: "Rental",               nameCa: "Lloguer",              icon: "mdi:car-key",           order: 3  },
    { slug: "compra-vehiculo",     name: "Compra",              nameEn: "Purchase",             nameCa: "Compra",               icon: "mdi:car",               order: 4  },
    { slug: "venta-vehiculo",      name: "Venta",               nameEn: "Sale",                 nameCa: "Venda",                icon: "mdi:car-arrow-right",   order: 5  },
    { slug: "paqueteria",          name: "Paquetería",          nameEn: "Parcel Delivery",      nameCa: "Paqueteria",           icon: "mdi:package-variant",   order: 6  },
    { slug: "aseguradoras-vehiculo",name: "Aseguradoras",       nameEn: "Insurers",             nameCa: "Asseguradores",        icon: "mdi:shield-car",        order: 7  },
    { slug: "gruas",               name: "Grúas",               nameEn: "Tow Trucks",           nameCa: "Grues",                icon: "mdi:tow-truck",         order: 8  },
    { slug: "taller-mecanico",     name: "Taller mecánico",     nameEn: "Mechanics",            nameCa: "Taller mecànic",       icon: "mdi:wrench",            order: 9  },
  ],
  mascotas: [
    { slug: "veterinarias",        name: "Veterinarias",        nameEn: "Vet",                  nameCa: "Veterinàries",         icon: "mdi:doctor",            order: 1  },
    { slug: "paseadores",          name: "Paseadores",          nameEn: "Dog Walkers",          nameCa: "Passejadors",          icon: "mdi:dog",               order: 2  },
    { slug: "lavaderos-mascotas",  name: "Lavaderos",           nameEn: "Pet Wash",             nameCa: "Rentadors",            icon: "mdi:shower",            order: 3  },
    { slug: "alimentacion-mascotas",name: "Alimentación",       nameEn: "Pet Food",             nameCa: "Alimentació",          icon: "mdi:bone",              order: 4  },
    { slug: "adiestramiento",      name: "Adiestramiento",      nameEn: "Training",             nameCa: "Adreçament",           icon: "mdi:dog-side",          order: 5  },
    { slug: "guarderias-mascotas", name: "Guarderías",          nameEn: "Pet Day Care",         nameCa: "Llars d'infants",      icon: "mdi:home-heart",        order: 6  },
  ],
  eventos: [
    { slug: "empresas-eventos",    name: "Empresas",            nameEn: "Corporate Events",     nameCa: "Empreses",             icon: "mdi:domain",            order: 1  },
    { slug: "bodas",               name: "Bodas",               nameEn: "Weddings",             nameCa: "Casaments",            icon: "mdi:ring",              order: 2  },
    { slug: "despedidas-cumpleanos",name: "Despedidas / Cumpleaños",nameEn: "Hen/Stag / Birthdays",nameCa: "Comiataments / Aniversaris",icon: "mdi:cake", order: 3  },
    { slug: "dj-musica-vivo",      name: "DJ / Música en vivo", nameEn: "DJ / Live Music",      nameCa: "DJ / Música en directe",icon: "mdi:disc",             order: 4  },
    { slug: "promocionales",       name: "Promocionales",       nameEn: "Promotional",          nameCa: "Promocionals",         icon: "mdi:bullhorn",          order: 5  },
    { slug: "sin-animo-lucro",     name: "Sin ánimo de lucro",  nameEn: "Non-profit",           nameCa: "Sense ànim de lucre",  icon: "mdi:hand-heart",        order: 6  },
    { slug: "conciertos",          name: "Conciertos",          nameEn: "Concerts",             nameCa: "Concerts",             icon: "mdi:microphone",        order: 7  },
    { slug: "arte",                name: "Arte",                nameEn: "Art",                  nameCa: "Art",                  icon: "mdi:palette",           order: 8  },
    { slug: "deportivos-eventos",  name: "Deportivos",          nameEn: "Sports Events",        nameCa: "Esportius",            icon: "mdi:trophy",            order: 9  },
    { slug: "floristerias",        name: "Floristerías",        nameEn: "Florists",             nameCa: "Floristeries",         icon: "mdi:flower-tulip",      order: 10 },
  ],
  construccion: [
    { slug: "arquitectura",        name: "Arquitectura",        nameEn: "Architecture",         nameCa: "Arquitectura",         icon: "mdi:ruler-square",      order: 1  },
    { slug: "diseno",              name: "Diseño",              nameEn: "Design",               nameCa: "Disseny",              icon: "mdi:pencil-ruler",      order: 2  },
    { slug: "materiales",          name: "Materiales",          nameEn: "Materials",            nameCa: "Materials",            icon: "mdi:brick",             order: 3  },
    { slug: "fontaneria",          name: "Fontanería",          nameEn: "Plumbing",             nameCa: "Fontaneria",           icon: "mdi:pipe",              order: 4  },
    { slug: "carpinteria",         name: "Carpintería",         nameEn: "Carpentry",            nameCa: "Fusteria",             icon: "mdi:saw-blade",         order: 5  },
    { slug: "electricidad",        name: "Electricidad",        nameEn: "Electricity",          nameCa: "Electricitat",         icon: "mdi:lightning-bolt",    order: 6  },
    { slug: "reformas",            name: "Reformas",            nameEn: "Renovations",          nameCa: "Reformes",             icon: "mdi:home-edit",         order: 7  },
    { slug: "montaje-muebles",     name: "Montaje de muebles",  nameEn: "Furniture Assembly",   nameCa: "Muntatge de mobles",   icon: "mdi:table-furniture",   order: 8  },
    { slug: "soluciones-eco",      name: "Soluciones ECO",      nameEn: "ECO Solutions",        nameCa: "Solucions ECO",        icon: "mdi:leaf-circle",       order: 9  },
  ],
  inmobiliaria: [
    { slug: "compra-inmueble",     name: "Compra",              nameEn: "Purchase",             nameCa: "Compra",               icon: "mdi:home-plus",         order: 1  },
    { slug: "venta-inmueble",      name: "Venta",               nameEn: "Sale",                 nameCa: "Venda",                icon: "mdi:home-minus",        order: 2  },
    { slug: "alquiler-inmueble",   name: "Alquiler",            nameEn: "Rental",               nameCa: "Lloguer",              icon: "mdi:key",               order: 3  },
  ],
  hoteles: [
    { slug: "hostal",              name: "Hostal",              nameEn: "Hostel",               nameCa: "Hostal",               icon: "mdi:bunk-bed",          order: 1  },
    { slug: "apartamentos",        name: "Apartamentos",        nameEn: "Apartments",           nameCa: "Apartaments",          icon: "mdi:city",              order: 2  },
    { slug: "bb",                  name: "B&B",                 nameEn: "B&B",                  nameCa: "B&B",                  icon: "mdi:coffee",            order: 3  },
    { slug: "hotel-basico",        name: "Básico",              nameEn: "Basic",                nameCa: "Bàsic",                icon: "mdi:star-outline",      order: 4  },
    { slug: "hotel-medio",         name: "Medio",               nameEn: "Mid-range",            nameCa: "Mitjà",                icon: "mdi:star-half-full",    order: 5  },
    { slug: "hotel-superior",      name: "Superior",            nameEn: "Superior",             nameCa: "Superior",             icon: "mdi:star",              order: 6  },
    { slug: "hotel-lujo",          name: "Lujo",                nameEn: "Luxury",               nameCa: "Luxe",                 icon: "mdi:crown",             order: 7  },
    { slug: "villas",              name: "Villas",              nameEn: "Villas",               nameCa: "Vil·les",              icon: "mdi:home-city",         order: 8  },
    { slug: "camping",             name: "Camping",             nameEn: "Camping",              nameCa: "Càmping",              icon: "mdi:campfire",          order: 9  },
  ],
};

async function seed() {
  await mongoose.connect(MONGODB_URI!, { dbName: "vale" });
  console.log("✅ Connected\n");

  // 1. Upsert parent categories
  const parentIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const parent of PARENTS) {
    const doc = await Category.findOneAndUpdate(
      { slug: parent.slug },
      { $set: { ...parent, isActive: true, parentCategory: null } },
      { upsert: true, new: true }
    );
    parentIds[parent.slug] = doc._id;
    console.log(`  ✓ Parent: ${parent.slug}`);
  }

  // 2. Upsert subcategories
  let subCount = 0;
  for (const [parentSlug, subs] of Object.entries(SUBCATEGORIES)) {
    const parentId = parentIds[parentSlug];
    if (!parentId) { console.warn(`  ⚠️  Parent not found: ${parentSlug}`); continue; }
    for (const sub of subs) {
      await Category.findOneAndUpdate(
        { slug: sub.slug },
        {
          $set: {
            name: sub.name,
            nameEn: sub.nameEn,
            nameCa: sub.nameCa,
            slug: sub.slug,
            icon: sub.icon,
            order: sub.order,
            isActive: true,
            parentCategory: parentId,
          },
        },
        { upsert: true, new: true }
      );
      subCount++;
    }
    console.log(`  ✓ ${subs.length} subcategories under "${parentSlug}"`);
  }

  console.log(`\n✅ Done — ${PARENTS.length} parents + ${subCount} subcategories seeded`);
  await mongoose.disconnect();
}

seed().catch((e) => { console.error("❌", e); process.exit(1); });
