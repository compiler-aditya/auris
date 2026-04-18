import Link from "next/link";

export const dynamic = "force-dynamic";

interface VoiceCard {
  name: string;
  quote: string;
  kind: "Category" | "Landmark" | "Pair unlock";
  when: string;
  cover: string;
  pair?: boolean;
  href?: string;
}

/**
 * /voices — Recent voices grid. Uses curated sample data keyed to the design;
 * swap to `/api/voices/recent` once the endpoint ships.
 */
const SAMPLE: VoiceCard[] = [
  { name: "Houseplant", quote: "I noticed you haven't been home much. Everything okay?", kind: "Category", when: "3 convos · now", cover: "radial-gradient(70% 60% at 40% 40%,#86a674 0%,#2e4a2c 70%,#14201a 100%)" },
  { name: "Rajwada", quote: "Another one with a phone. Come closer — the light is better.", kind: "Landmark", when: "4 convos · yesterday", cover: "linear-gradient(160deg,#f1c486 0%,#c46d2f 45%,#4a1f0c 100%)" },
  { name: "Pigeon", quote: "Crumbs, huh? That guy over there has a bagel.", kind: "Category", when: "1 convo · today", cover: "radial-gradient(70% 60% at 50% 40%,#b4b6b3 0%,#555a55 60%,#1d1f1c 100%)" },
  { name: "Coffee mug", quote: "Third one today. Laptop's warm. You're fine.", kind: "Category", when: "2 convos · tue", cover: "radial-gradient(70% 60% at 50% 50%,#e0c9a8 0%,#8a5d3a 60%,#3a1f10 100%)" },
  { name: "The Threshold", quote: "You found me. What do you want to know?", kind: "Pair unlock", when: "1 convo · mon", cover: "radial-gradient(60% 50% at 30% 50%,#c44a2b 0%,#661f0f 50%,#0a0906 100%)", pair: true },
  { name: "Lamp", quote: "Mind the wire. It remembers being stepped on.", kind: "Category", when: "1 convo · last wk", cover: "radial-gradient(60% 50% at 50% 30%,#ffd97a 0%,#8a521e 55%,#251308 100%)" },
  { name: "Kettle", quote: "Nearly boiling. You always forget me.", kind: "Category", when: "2 convos · last wk", cover: "radial-gradient(70% 60% at 40% 40%,#bfc9d0 0%,#4b5359 60%,#1a1d20 100%)" },
  { name: "Taj Mahal", quote: "Quieter once. The river came closer then.", kind: "Landmark", when: "1 convo · last mo", cover: "radial-gradient(70% 60% at 50% 50%,#e8dac4 0%,#9a8369 60%,#2f271e 100%)" },
];

export default function VoicesPage() {
  return (
    <div className="min-h-screen">
      <nav className="px-8 py-6 flex items-center justify-between max-w-[1480px] mx-auto">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <span className="w-2 h-2 rounded-full bg-rust" />
          <span className="font-display italic text-2xl">Auris</span>
        </Link>
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink3">
          voices you&rsquo;ve met
        </div>
      </nav>

      <main className="px-8 md:px-12 py-10 max-w-[1480px] mx-auto">
        <header className="flex justify-between items-end flex-wrap gap-4 mb-7">
          <div>
            <h1 className="font-display italic font-normal text-4xl md:text-5xl leading-none tracking-[-0.02em] m-0">
              Voices you&rsquo;ve met
            </h1>
            <div className="text-ink3 text-sm mt-1.5">
              {SAMPLE.filter((s) => s.kind === "Category").length} characters ·{" "}
              {SAMPLE.filter((s) => s.kind === "Landmark").length} landmarks ·{" "}
              {SAMPLE.filter((s) => s.kind === "Pair unlock").length} rare pairing
            </div>
          </div>

          <div className="flex gap-1.5 p-1 bg-paper2 border border-line rounded-full">
            {["All", "Categories", "Landmarks", "Pairings"].map((k, i) => (
              <button
                key={k}
                type="button"
                className={
                  "px-3.5 py-2 border-none rounded-full text-xs transition " +
                  (i === 0
                    ? "bg-card text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "bg-transparent text-ink3 hover:text-ink")
                }
              >
                {k}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SAMPLE.map((c) => (
            <article
              key={c.name}
              className={
                "bg-paper2 border rounded-[18px] overflow-hidden flex flex-col relative " +
                (c.pair ? "border-rustsoft" : "border-line")
              }
            >
              <div
                className="aspect-square relative overflow-hidden"
                style={{ background: c.cover }}
              >
                {c.pair && (
                  <div
                    className="absolute inset-0 z-[1]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(196,74,43,0.35), transparent 60%)",
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 z-[1]"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)",
                  }}
                />
                <div
                  className={
                    "absolute top-3 left-3 px-2.5 py-1 rounded-full font-mono text-[9px] tracking-[0.18em] uppercase z-[2] " +
                    (c.pair
                      ? "bg-rust text-white"
                      : "bg-white/92 text-ink2 backdrop-blur-sm")
                  }
                >
                  {c.pair ? `◇ ${c.kind}` : c.kind}
                </div>
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white z-[2] font-display italic text-[26px] leading-none tracking-[-0.01em]">
                  {c.name}
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div
                  className="font-display italic text-[15px] leading-[1.35] text-ink2 overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  &ldquo;{c.quote}&rdquo;
                </div>
                <div className="flex justify-between items-center mt-auto font-mono text-[10px] tracking-[0.14em] uppercase text-ink3">
                  <span>{c.kind}</span>
                  <span>
                    <span className="text-ink4">· </span>
                    {c.when}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="mt-14 pt-5 border-t border-line flex justify-between font-mono text-[11px] tracking-[0.18em] uppercase text-ink3">
          <Link href="/" className="hover:text-ink transition">← home</Link>
          <span>{SAMPLE.length} voices · memory</span>
        </footer>
      </main>
    </div>
  );
}
