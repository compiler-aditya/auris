import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { loadAllSpecs } from "@/lib/specs/loader";
import { ConverseButton } from "@/components/ConverseButton";
import { EncounterPlayer } from "@/components/EncounterPlayer";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ g?: string; a?: string; t?: string }>;
}

export const dynamic = "force-dynamic";

interface CharacterView {
  id: string;
  kind: "category" | "landmark";
  display_name: string;
  category_slug?: string;
  landmark_slug?: string;
  first_met?: string;
  visits?: number;
  mood?: string;
  quotes: { when: string; q: string; now?: boolean }[];
  cover_style: string;
}

export default async function CharacterPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const view = await resolveView(id);
  if (!view) notFound();

  const [titleA, titleB] = splitTitle(view.display_name);
  const greetingUrl = sp?.g;
  const ambientUrl = sp?.a;
  const greetingText = sp?.t;
  const hasFreshEncounter = Boolean(greetingUrl);

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* VISUAL column (the photo + eyebrow + name) */}
      <section className="relative overflow-hidden min-h-[420px]" style={{ background: view.cover_style }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,13,11,0) 40%, rgba(14,13,11,0.6) 100%)",
          }}
        />
        <div className="absolute top-6 left-6 right-6 flex justify-between font-mono text-[10px] tracking-[0.2em] uppercase text-[#f5efe0]/70 z-[2]">
          <Link href="/voices" className="hover:text-[#f5efe0]">← shelf</Link>
          <span>{view.kind === "landmark" ? "Landmark" : "Category"}</span>
        </div>
        <div className="absolute bottom-10 left-10 right-10 text-[#f5efe0] z-[2]">
          <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#d89a5a] mb-3.5">
            {view.kind === "landmark" ? "Landmark" : "Category"}
            {view.kind === "landmark" && " · Heritage"}
          </div>
          <h1 className="font-display font-normal text-5xl md:text-[84px] leading-[0.9] tracking-[-0.025em]">
            {titleA}
            {titleB && (
              <>
                , <em className="italic">{titleB}</em>
              </>
            )}
          </h1>
          <div className="mt-3.5 font-display italic text-base md:text-lg" style={{ color: "rgba(245,239,224,0.85)" }}>
            &ldquo;{greetingText ?? view.quotes[0]?.q ?? ""}&rdquo;
          </div>
        </div>
      </section>

      {/* DETAIL column */}
      <section className="p-9 md:p-10 flex flex-col gap-5.5 relative">
        <Link
          href="/voices"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-ink3 hover:text-ink self-start"
        >
          ← back to shelf
        </Link>

        <div className="grid grid-cols-3 gap-5 py-4.5 border-t border-b border-line">
          <Stat k="first met" v={view.first_met ?? "today"} />
          <Stat k="visits" v={String(view.visits ?? 1)} />
          <Stat k="mood" v={view.mood ?? "warm"} />
        </div>

        <div>
          <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink3 m-0 mb-2.5">
            What {pronoun(view.kind)} said
          </h3>
          <div className="flex flex-col gap-3.5">
            {view.quotes.map((q, i) => (
              <div
                key={i}
                className="pl-4 border-l"
                style={{ borderColor: q.now ? "var(--accent)" : "var(--line)" }}
              >
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink3 mb-1">
                  {q.when}
                </div>
                <div
                  className="font-display italic text-[17px] leading-[1.35]"
                  style={{ color: q.now ? "var(--ink)" : "var(--ink-2)" }}
                >
                  &ldquo;{q.q}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>

        {hasFreshEncounter && (
          <EncounterPlayer
            greetingUrl={greetingUrl}
            ambientUrl={ambientUrl}
            greetingText={greetingText}
          />
        )}

        <div className="mt-auto pt-4.5">
          <ConverseButton characterId={view.id} variant="flush" />
        </div>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink3">{k}</div>
      <div className="font-display italic text-[22px] leading-none text-ink">{v}</div>
    </div>
  );
}

function pronoun(kind: CharacterView["kind"]): string {
  return kind === "landmark" ? "it" : "they";
}

function splitTitle(title: string): [string, string | null] {
  // "Rajwada, at dusk" pattern: split on a comma first, else last word.
  if (title.includes(",")) {
    const [a, ...rest] = title.split(",");
    return [a!.trim(), rest.join(",").trim() || null];
  }
  const parts = title.trim().split(/\s+/);
  if (parts.length < 2) return [title, null];
  const last = parts.pop()!;
  return [parts.join(" "), last];
}

async function resolveView(id: string): Promise<CharacterView | null> {
  // Try real DB first
  const specs = await loadAllSpecs().catch(() => null);

  const obj = await queryOne<{
    id: string;
    category: string;
    display_name: string | null;
    created_at: string;
  }>(
    `SELECT id, category, display_name, created_at FROM objects WHERE id = $1`,
    [id],
  ).catch(() => null);

  if (obj && specs) {
    const spec = specs.categories.get(obj.category);
    const convs = await query<{ created_at: string; transcript: unknown }>(
      `SELECT created_at, transcript FROM conversations WHERE object_id = $1 ORDER BY created_at DESC LIMIT 3`,
      [obj.id],
    ).catch(() => []);

    return {
      id: obj.id,
      kind: "category",
      display_name: spec?.display_name ?? obj.display_name ?? obj.category,
      first_met: fmtDate(obj.created_at),
      visits: convs.length || 1,
      mood: spec?.personality.emotional_baseline,
      cover_style: coverForCategory(obj.category),
      quotes: [
        { when: "today · now", q: spec?.greeting_templates[0] ?? "Hello.", now: true },
        ...(spec?.greeting_templates.slice(1, 3) ?? []).map((q, i) => ({
          when: ["yesterday", "earlier this week"][i] ?? "earlier",
          q,
        })),
      ],
    };
  }

  const lm = await queryOne<{
    id: string;
    slug: string;
    name: string;
  }>(`SELECT id, slug, name FROM landmarks WHERE id = $1`, [id]).catch(() => null);

  if (lm && specs) {
    const spec = specs.landmarks.get(lm.slug);
    return {
      id: lm.id,
      kind: "landmark",
      display_name: spec?.display_name ?? lm.name,
      first_met: "recently",
      visits: 1,
      mood: spec?.personality.emotional_baseline,
      cover_style: coverForLandmark(lm.slug),
      quotes: (spec?.greeting_templates ?? ["Hello."]).slice(0, 3).map((q, i) => ({
        when: i === 0 ? "today · now" : ["yesterday", "this week"][i - 1] ?? "earlier",
        q,
        now: i === 0,
      })),
    };
  }

  // Fallback: demo view so the design is reviewable without DB
  if (!specs) return null;
  const fallbackSpec =
    specs.landmarks.get("rajwada-indore") ?? specs.categories.get("houseplant");
  if (!fallbackSpec) return null;

  return {
    id,
    kind: fallbackSpec.kind === "landmark" ? "landmark" : "category",
    display_name: "Rajwada, at dusk",
    first_met: "11 apr",
    visits: 4,
    mood: "warm, weary",
    cover_style: coverForLandmark("rajwada-indore"),
    quotes: [
      { when: "today · 12 min ago", q: "another one with a phone. come closer — the light is better by the carved pillars.", now: true },
      { when: "mon · 14 apr", q: "the pillars hold a different weight at dusk. come back when the crows return." },
      { when: "fri · 11 apr", q: "you didn't look up. do. the ceiling is where I keep 1801." },
    ],
  };
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toLowerCase();
  } catch {
    return "today";
  }
}

function coverForCategory(cat: string): string {
  const m: Record<string, string> = {
    houseplant: "radial-gradient(70% 60% at 40% 40%, #86a674 0%, #2e4a2c 70%, #14201a 100%)",
    animal: "radial-gradient(70% 60% at 50% 40%, #b4b6b3 0%, #555a55 60%, #1d1f1c 100%)",
    food: "radial-gradient(70% 60% at 50% 50%, #e0c9a8 0%, #8a5d3a 60%, #3a1f10 100%)",
    appliance: "radial-gradient(70% 60% at 40% 40%, #bfc9d0 0%, #4b5359 60%, #1a1d20 100%)",
    furniture: "radial-gradient(70% 60% at 50% 50%, #e8dac4 0%, #9a8369 60%, #2f271e 100%)",
  };
  return m[cat] ?? "radial-gradient(70% 60% at 40% 40%, #86a674 0%, #2e4a2c 70%, #14201a 100%)";
}
function coverForLandmark(slug: string): string {
  const m: Record<string, string> = {
    "rajwada-indore": "linear-gradient(160deg, #f1c486 0%, #c46d2f 45%, #4a1f0c 100%)",
    "taj-mahal": "radial-gradient(60% 50% at 50% 30%, #ffd97a 0%, #8a521e 55%, #251308 100%)",
    "banyan-tree": "radial-gradient(70% 60% at 50% 50%, #6b8a5f 0%, #2e3f2a 60%, #14201a 100%)",
  };
  return m[slug] ?? "linear-gradient(160deg, #f1c486 0%, #c46d2f 45%, #4a1f0c 100%)";
}
