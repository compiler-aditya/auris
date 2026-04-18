import type { VisionResult } from "./specs/types.js";

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Gemini identifies the subject AND authors a character spec for it in one call.
 *
 * The 12 category archetypes at .kiro/specs/categories/ are no longer the
 * runtime source of voice — they live on as tonal examples that shape the
 * prompt below. Every photographed object gets its *own* voice, name, greeting,
 * and ambient bed, generated from what Gemini actually sees in the frame.
 *
 * Landmarks and pair-unlocks are exceptions — those remain hand-authored so
 * the Taj Mahal always speaks as itself and candle+mirror always summons the
 * same emergent voice.
 */
const PROMPT = `You are the observer for Auris — a voice-first app where anything photographed speaks back in character.

Given the attached photograph, identify the subject(s) and write a **character spec** for this specific object.

Return minified JSON with no markdown and no commentary, matching:

{
  "primary":   { "category": "string", "attributes": ["string"], "confidence": 0..1 },
  "secondary": null | { "category": "string", "attributes": ["string"], "confidence": 0..1 },
  "landmark_slug": null | "kebab-case-slug",
  "description": "one natural sentence about what is specifically in frame",
  "character": {
    "name": "short display name for THIS specific thing — e.g. 'the worn MacBook', 'a tired jade plant', 'the chipped coffee mug'",
    "voice_design": "60-400 char voice design prompt specific to this photo. Follow this template: [age + gender], [accent or regional grain], [timbre], [cadence], [emotional baseline]. [One unique detail that gives the voice body]. Do not use FX words like echo or reverb.",
    "greeting": "1-2 sentence first thing this specific thing would say to the person photographing it. Warm, specific, slightly whimsical. Notices the viewer or the moment, not generic. Must be at least 30 characters.",
    "ambient": "short phrase describing the quiet ambient sound that would be around this thing — room tone, soft traffic, wind, distant birds, etc. No music.",
    "traits": ["3-5 lowercase trait words, e.g. observant, gentle, a-little-lonely"],
    "emotional_baseline": "short phrase — e.g. 'patient curiosity', 'quiet pride', 'lively alertness'"
  }
}

**Rules (tonal identity — enforce strictly):**
- Warm, slightly whimsical, never uncanny, never dark, never scolding.
- Specific over general. A laptop is not just 'an appliance'; it is a *specific* laptop with wear marks and a 3pm mood.
- The character notices the viewer. Speaks from its own point of view.
- Never mentions being an AI, model, or generated.
- Never delivers Wikipedia facts — a thing speaks as itself, not about itself.
- Never cheeky, ironic-for-its-own-sake, or snarky-by-default.

**Category taxonomy** (primary.category must be one of these — used only for tonal grouping in analytics, NOT for runtime voice lookup):
houseplant, appliance, furniture, vehicle, food, tool, accessory, building, landscape, street-object, animal, artwork.

**Allowed generics** for primary.category when the subject is more specific than a category and is one of these pair-matching candidates:
pigeon, candle, mirror, key, door, plate, fork, book, pen, paper, coffee-cup, laptop, ring, letter.

**landmark_slug**: non-null ONLY if you recognize a famous landmark: taj-mahal, rajwada-indore, gateway-of-india, red-fort, chai-stall, banyan-tree, arabian-sea, indian-railway-station. Otherwise null.

**secondary**: non-null only when the frame contains two clearly distinct primary objects of roughly equal importance. Don't invent one to be helpful.

**attributes**: 3-6 lowercase tags (color, material, condition, era, mood).

Good greeting examples:
- "Crumbs, huh? That guy over there has a bagel. I'm calculating trajectories."   (pigeon)
- "I noticed you haven't been home much. Everything okay?"                          (houseplant)
- "Third one today. Worried about you."                                             (coffee mug)
- "You came back. The light moved while you were gone."                             (desk chair)

Bad (do not do):
- "Hello! I'm a houseplant."  (generic, announces itself)
- "As an AI character, I..."  (breaks character)
- "Stay hydrated!"             (moralizes)`;

interface RichCharacter {
  name: string;
  voice_design: string;
  greeting: string;
  ambient: string;
  traits: string[];
  emotional_baseline: string;
}

/** Extended vision result with a photo-specific character spec. */
export interface RichVisionResult extends VisionResult {
  character?: RichCharacter;
}

export async function identify(
  imageBase64: string,
  mimeType: string,
): Promise<RichVisionResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7, // higher = more character variation per object
    },
  };

  const res = await fetch(`${ENDPOINT}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseVisionJson(text);
}

export function parseVisionJson(raw: string): RichVisionResult {
  const trimmed = raw.trim().replace(/^```json\s*|\s*```$/g, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return fallback("unparseable vision response");
  }
  if (!parsed || typeof parsed !== "object") return fallback("non-object");
  const p = parsed as Record<string, unknown>;
  const primary = asSubject(p.primary);
  if (!primary) return fallback("missing primary");
  const secondary = p.secondary ? asSubject(p.secondary) ?? undefined : undefined;
  const landmark_slug = typeof p.landmark_slug === "string" ? p.landmark_slug : undefined;
  const description = typeof p.description === "string" ? p.description : "";
  const character = asCharacter(p.character);
  return { primary, secondary, landmark_slug, description, character };
}

function asSubject(v: unknown) {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.category !== "string") return null;
  const attrs = Array.isArray(o.attributes)
    ? o.attributes.filter((x): x is string => typeof x === "string")
    : [];
  const confidence =
    typeof o.confidence === "number" ? Math.min(Math.max(o.confidence, 0), 1) : 0.5;
  return { category: o.category, attributes: attrs, confidence };
}

function asCharacter(v: unknown): RichCharacter | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name : "";
  const voice_design = typeof o.voice_design === "string" ? o.voice_design : "";
  const greeting = typeof o.greeting === "string" ? o.greeting : "";
  const ambient = typeof o.ambient === "string" ? o.ambient : "";
  const traits = Array.isArray(o.traits)
    ? o.traits.filter((x): x is string => typeof x === "string")
    : [];
  const emotional_baseline =
    typeof o.emotional_baseline === "string" ? o.emotional_baseline : "";
  if (!name || !voice_design || !greeting) return undefined;
  return { name, voice_design, greeting, ambient, traits, emotional_baseline };
}

function fallback(reason: string): RichVisionResult {
  console.warn(`[vision] fallback: ${reason}`);
  return {
    primary: { category: "artwork", attributes: [], confidence: 0.3 },
    description: "I can't quite see you, but I'm here.",
  };
}
