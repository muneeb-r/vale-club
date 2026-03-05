/**
 * Migrate existing Plan documents from old string format to bilingual {es, en} format.
 * Uses Ollama (local LLM) to translate ES features → EN.
 *
 * Run with: npx tsx scripts/migrate-plans-bilingual.ts
 *
 * Requirements:
 *   - Ollama running locally: `ollama serve`
 *   - Model available: `ollama pull llama3.2` (or any model)
 *   - MONGODB_URI set in .env.local
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set in .env.local");
  process.exit(1);
}

// Raw schema — bypasses current model validation so we can read old string data
const RawPlanSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const RawPlan = mongoose.models.RawPlan || mongoose.model("RawPlan", RawPlanSchema, "plans");

// ── Ollama helpers ────────────────────────────────────────────────────────────

async function ollamaTranslate(text: string): Promise<string> {
  const prompt = `Translate the following Spanish business directory feature text to English. Reply with ONLY the English translation, nothing else, no quotes, no explanation.

Spanish: ${text}
English:`;

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response.trim();
}

async function ollamaTranslateName(esName: string): Promise<string> {
  const prompt = `Translate the following Spanish subscription plan name to English. Reply with ONLY the English name, nothing else.

Examples:
Gratuito → Free
Básico → Basic
Pro → Pro

Spanish: ${esName}
English:`;

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response.trim();
}

// ── Migration ─────────────────────────────────────────────────────────────────

async function migrate() {
  await mongoose.connect(uri as string);
  console.log("Connected to MongoDB\n");

  // Check Ollama is reachable
  try {
    const ping = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!ping.ok) throw new Error("not ok");
    console.log(`Ollama reachable at ${OLLAMA_URL} — model: ${OLLAMA_MODEL}\n`);
  } catch {
    console.error(`Cannot reach Ollama at ${OLLAMA_URL}. Make sure it's running with: ollama serve`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plans = await RawPlan.find().lean() as any[];
  console.log(`Found ${plans.length} plan(s)\n`);

  for (const plan of plans) {
    const id = plan._id;
    console.log(`─── Plan: ${JSON.stringify(plan.name)} (id: ${id})`);

    // ── Migrate name ──────────────────────────────────────────────────────────
    let newName: { es: string; en: string };

    if (typeof plan.name === "string") {
      const esName = plan.name;
      console.log(`  name: "${esName}" → translating to EN...`);
      const enName = await ollamaTranslateName(esName);
      console.log(`  name EN: "${enName}"`);
      newName = { es: esName, en: enName };
    } else if (plan.name && typeof plan.name === "object") {
      const { es = "", en = "" } = plan.name as { es?: string; en?: string };
      if (en) {
        console.log(`  name already bilingual: ${es} / ${en} — skipping`);
        newName = { es, en };
      } else {
        console.log(`  name missing EN, translating "${es}"...`);
        const enName = await ollamaTranslateName(es);
        console.log(`  name EN: "${enName}"`);
        newName = { es, en: enName };
      }
    } else {
      console.log("  name is missing — skipping");
      newName = { es: "", en: "" };
    }

    // ── Migrate features ──────────────────────────────────────────────────────
    const rawFeatures: unknown[] = Array.isArray(plan.features) ? plan.features : [];
    const newFeatures: { es: string; en: string }[] = [];

    for (const f of rawFeatures) {
      if (typeof f === "string") {
        // Old string format — translate
        console.log(`  feature: "${f}" → translating...`);
        const en = await ollamaTranslate(f);
        console.log(`    EN: "${en}"`);
        newFeatures.push({ es: f, en });
      } else if (f && typeof f === "object") {
        const fo = f as { es?: string; en?: string };
        if (fo.en) {
          // Already bilingual
          console.log(`  feature already bilingual: "${fo.es}" / "${fo.en}" — keeping`);
          newFeatures.push({ es: fo.es ?? "", en: fo.en });
        } else if (fo.es) {
          // Has ES, missing EN — translate
          console.log(`  feature missing EN: "${fo.es}" → translating...`);
          const en = await ollamaTranslate(fo.es);
          console.log(`    EN: "${en}"`);
          newFeatures.push({ es: fo.es, en });
        } else {
          newFeatures.push({ es: "", en: "" });
        }
      }
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    await RawPlan.updateOne(
      { _id: id },
      { $set: { name: newName, features: newFeatures } }
    );
    console.log(`  ✓ Saved\n`);
  }

  console.log("Migration complete.");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
