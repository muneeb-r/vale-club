/**
 * Seed initial subscription plans.
 * Run with: npx tsx scripts/seed-plans.ts
 *
 * Plans generated with ollama llama3.2:3b — features in ES + EN.
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set in .env.local");
  process.exit(1);
}

const PlanSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    features: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);

const plans = [
  {
    name: "Gratuito",
    price: 0,
    features: [
      "Perfil completo en el directorio",
      "Aparece en resultados de búsqueda",
      "Contacto directo por WhatsApp, email y web",
      "Panel de control para gestionar tu información",
    ],
    isActive: true,
  },
  {
    name: "Básico",
    price: 10,
    features: [
      "Todo lo incluido en el plan Gratuito",
      "Promoción en la página principal",
      "Badge verificado en tu perfil",
      "Soporte por email del equipo VALE",
    ],
    isActive: true,
  },
  {
    name: "Pro",
    price: 20,
    features: [
      "Todo lo incluido en el plan Básico",
      "Posición prioritaria en búsquedas",
      "Badge Pro destacado en el directorio",
      "Soporte prioritario del equipo VALE",
    ],
    isActive: true,
  },
];

async function seed() {
  await mongoose.connect(uri as string);
  console.log("Connected to MongoDB");

  // Only insert if no plans exist yet
  const existing = await Plan.countDocuments();
  if (existing > 0) {
    console.log(`${existing} plans already exist — skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  await Plan.insertMany(plans);
  console.log(`Seeded ${plans.length} plans.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
