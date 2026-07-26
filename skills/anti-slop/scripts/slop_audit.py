#!/usr/bin/env python3
"""slop_audit.py — deterministic Layer 1 + Layer 2 slop scorer.

Reads a file path or stdin (use '-' for stdin) and reports surface + structural
tells that correlate with AI-generated text. Pure stdlib, no dependencies.

Scope: Layer 1 (lexical / punctuation) and part of Layer 2 (burstiness, templatedness).
Layer 3 (argument dependency, narrative scatter, domain substance) CANNOT be scored
automatically — judge it with the qualitative self-audit in SKILL.md.

Sources for thresholds/signals:
  Kobak et al. 2025 (focal words, em-dash density)
  GPTZero (burstiness, perplexity)
  Shaib et al. 2026 (templatedness, slop taxonomy)
  June Kim 2026 (structural tells)
"""
import re
import sys
import math
from collections import Counter

# ---------------------------------------------------------------------------
# Catalogs (mirrors references/detection-layers.md)
# ---------------------------------------------------------------------------

FOCAL_WORDS = {
    # Kobak excess words + 21 focal words + corporate-inflation adjectives + inflated verbs
    "delve", "delves", "delving",
    "underscore", "underscores", "underscoring",
    "showcase", "showcases", "showcasing",
    "pivotal", "intricate", "meticulously", "meticulous",
    "realm", "aligns", "alignment", "underpins", "garnered",
    "bolster", "bolstering", "notably",
    "commendable", "surpass", "elevate", "foster",
    "tapestry", "navigate", "navigating", "landscape",
    "resonate", "testament", "compelling", "paramount", "crucial", "unwavering",
    "mosaic", "ecosystem", "symphony", "labyrinth", "beacon",
    "cornerstone", "bedrock", "cacophony", "kaleidoscope", "odyssey",
    "robust", "seamless", "seamlessly", "vibrant", "dynamic",
    "comprehensive", "multifaceted", "nuanced", "holistic",
    "cutting-edge", "state-of-the-art", "transformative", "groundbreaking",
    "unparalleled", "profound", "innovative", "ever-evolving", "ever-changing",
    "leverage", "leveraging", "utilize", "harness", "streamline",
    "facilitate", "optimize", "empower", "illuminate",
    "unpack", "embrace", "unlock", "paradigm",
}

SIGNPOSTING = [
    "it's important to note", "it is important to note",
    "it's worth noting", "it is worth noting",
    "it's worth mentioning", "it is worth mentioning",
    "that being said",
    "in today's fast-paced", "in an ever-evolving",
    "navigating the complexities",
    "a deeper understanding of",
    "at its core", "at the heart of",
    "when it comes to", "in the realm of",
    "play a vital role", "play a pivotal role", "play a crucial role",
    "play a significant role", "plays a vital role", "plays a pivotal role",
    "plays a crucial role", "plays a significant role",
    "stand as a testament", "stands as a testament",
    "a nuanced take", "a nuanced understanding",
    "delve into the intricacies", "dive deep into",
    "let's break it down", "let's unpack this",
]

CLOSING = [
    "in conclusion", "in summary", "overall,", "overall.",
    "ultimately,", "ultimately.",
    "the journey doesn't end", "the journey does not end",
    "hope this helps", "let me know if you'd like me to go deeper",
    "let me know if you'd like to go deeper",
    "as we navigate", "it's essential that we", "it is essential that we",
    "remember, when",
]

# Sycophantic / tonal openers
SYCOPHANTIC = [
    "great question", "what a thoughtful question", "what a great question",
    "i'm so glad you asked", "i am so glad you asked",
    "you're absolutely right", "you are absolutely right",
    "that's a brilliant observation", "that is a brilliant observation",
    "absolutely!", "certainly!", "of course!", "sure thing",
    "i'd be happy to help", "i would be happy to help",
    "let me explain", "let's dive in", "let's unpack",
]

CONTRACTIONS = [
    "i'm", "i've", "i'll", "i'd", "you're", "you've", "you'll", "you'd",
    "he's", "she's", "it's", "we're", "we've", "we'll", "we'd",
    "they're", "they've", "they'll", "they'd",
    "don't", "doesn't", "didn't", "won't", "wouldn't", "shouldn't", "couldn't",
    "can't", "cannot", "isn't", "aren't", "wasn't", "weren't", "hasn't",
    "haven't", "hadn't", "that's", "there's", "here's", "what's", "who's",
    "let's", "ain't", "y'all", "gonna", "wanna", "gotta", "kinda", "sorta",
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def read_input():
    if len(sys.argv) < 2:
        print("usage: slop_audit.py <file> | -  (use - for stdin)", file=sys.stderr)
        sys.exit(2)
    if sys.argv[1] == "-":
        return sys.stdin.read()
    with open(sys.argv[1], "r", encoding="utf-8", errors="replace") as f:
        return f.read()

def split_sentences(text):
    # Strip markdown headings/lists markers so they don't pollute sentence stats,
    # but keep the prose. Split on sentence enders.
    s = re.sub(r"^[#>\-*\d\.\)\s]+", "", text, flags=re.MULTILINE)  # strip list/heading prefixes
    s = re.sub(r"\s+", " ", s)
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'`(])", s)
    return [p.strip() for p in parts if p.strip()]

def words(text):
    return re.findall(r"[A-Za-z0-9'_\-]+", text.lower())

EM_DASH = "\u2014"  # —

def fmt_hits(counter):
    if not counter:
        return "none"
    return ", ".join(f"{w}({n})" for w, n in counter.most_common())

def band(label, value, ok, ai, unit=""):
    flag = "OK   " if ok else "AI   "
    print(f"  [{flag}] {label:<34} {value}{unit}")

# ---------------------------------------------------------------------------
# Main audit
# ---------------------------------------------------------------------------

def audit(text):
    raw = text
    lower = text.lower()
    wlist = words(text)
    n_words = max(len(wlist), 1)
    per1k = 1000.0 / n_words

    sentences = split_sentences(text)
    sent_lens = [len(words(s)) for s in sentences] if sentences else [0]

    print("=" * 72)
    print(f"SLOP AUDIT  —  {n_words} words, {len(sentences)} sentences")
    print("=" * 72)

    # ---- Layer 1: lexical -------------------------------------------------
    print("\n--- LAYER 1: surface (lexical) ---")

    # focal-word hits: scan PROSE only, not URLs/markdown link targets (those are
    # code, not writing), and skip matches that are CAPITALIZED in source (proper nouns /
    # product names like "Amazon Bedrock" rather than the AI prestige-metaphor).
    text_no_urls = re.sub(r"\]\([^)]*\)", "]", text)            # drop markdown link targets
    text_no_urls = re.sub(r"https?://\S+", "", text_no_urls)      # drop bare URLs
    focal_hits = Counter()
    for w in FOCAL_WORDS:
        for m in re.finditer(r"\b" + re.escape(w) + r"\b", text_no_urls):
            tok = m.group(0)
            if tok[:1].isupper():  # capitalized -> proper noun / brand, not the metaphor
                continue
            focal_hits[w.lower()] += 1
    band("focal-word hits", sum(focal_hits.values()), len(focal_hits) == 0,
         fmt_hits(focal_hits) if focal_hits else "")
    if focal_hits:
        print(f"           (any single focal word is a flag in short text; density ~{sum(focal_hits.values())*per1k:.1f}/1000)")

    sign_hits = Counter()
    for p in SIGNPOSTING:
        n = lower.count(p)
        if n:
            sign_hits[p] += n
    band("signposting phrases", sum(sign_hits.values()), len(sign_hits) == 0,
         fmt_hits(sign_hits) if sign_hits else "")

    close_hits = Counter()
    for p in CLOSING:
        n = lower.count(p)
        if n:
            close_hits[p] += n
    band("closing-ritual phrases", sum(close_hits.values()), len(close_hits) == 0,
         fmt_hits(close_hits) if close_hits else "")

    # em dashes — count ONLY the real U+2014 character (—). The ASCII "--" form is
    # too collision-prone: it matches CLI argument separators like `npm run eval -- file`,
    # shell option terminators, and code. The tell is CLUSTERED ADDITIVE use, not a
    # lone disruptive aside — flag only when 2+ and dense.
    em = text.count(EM_DASH)
    em_density = em * per1k
    em_ok = (em <= 1) or (em_density <= 4.0)
    band("em-dash density", f"{em_density:.1f}/1000", em_ok,
         f"{em} total (flag only if 2+ & dense; human ~0-2/1000, AI ~6-12+/1000; lone disruptive em dash is human)")

    # curly quotes in casual context
    curly = text.count("\u2018") + text.count("\u2019") + text.count("\u201c") + text.count("\u201d")
    band("curly quotes/apostrophes", curly, curly == 0,
         f"{curly} (suspect if context is code/reddit/email)")

    # emoji bullets / unicode bold
    emoji_bullets = len(re.findall(r"^\s*[🚀🔑💡✅🎯🔥📌]\s", text, flags=re.MULTILINE))
    uni_bold = len(re.findall(r"[\U0001D5D4-\U0001D5ED\U0001D5EE-\U0001D607]", text))
    band("emoji bullets / unicode bold", emoji_bullets + uni_bold, (emoji_bullets + uni_bold) == 0, "")

    # ---- Layer 2: structure ----------------------------------------------
    print("\n--- LAYER 2: structure (burstiness, templatedness) ---")

    # bullet / list density — computed early because burstiness is only meaningful for PROSE.
    # A list-dominant text (commands, validation steps) legitimately has little prose; flagging
    # its burstiness would be a false positive.
    bullets = len(re.findall(r"^\s*[-*]\s", text, flags=re.MULTILINE))
    bullet_pct = bullets / max(len(text.splitlines()), 1)
    list_dominant = bullet_pct >= 0.40

    mean = sum(sent_lens) / len(sent_lens) if sent_lens else 0
    var = sum((x - mean) ** 2 for x in sent_lens) / len(sent_lens) if sent_lens else 0
    sd = math.sqrt(var)
    cv = sd / mean if mean else 0
    if list_dominant or len(sentences) < 3:
        print(f"  [SKIP ] burstiness (stdev/mean CV)     {cv:.2f}  (list-dominant: {bullet_pct*100:.0f}% bullet lines / {len(sentences)} sentences — burstiness is a prose metric, n/a here)")
        burstiness_flag = False
    else:
        band("burstiness (stdev/mean CV)", f"{cv:.2f}", cv >= 0.45,
             f"mean={mean:.1f} sd={sd:.1f} min={min(sent_lens)} max={max(sent_lens)} (CV<0.45 = flat/AI band)")
        burstiness_flag = cv < 0.45
    # uniformity: too many sentences in 14-22 band
    mid = sum(1 for l in sent_lens if 14 <= l <= 22)
    mid_pct = mid / len(sent_lens) if sent_lens else 0
    if list_dominant:
        print(f"  [SKIP ] sentences in 14-22 word band   {mid_pct*100:.0f}%  (list-dominant, n/a)")
        mid_flag = False
    else:
        band("sentences in 14-22 word band", f"{mid_pct*100:.0f}%", mid_pct < 0.6,
             f"{mid}/{len(sentences)} (high % = uniform = AI band)")
        mid_flag = mid_pct >= 0.6

    # contractions — humans use them in casual prose, AI near-zero. BUT technical PR
    # descriptions / docs are legitimately contraction-free by convention, so this is a
    # WEAK signal: only flag when the text reads as casual prose (not list/command-dominant).
    contra = 0
    for c in CONTRACTIONS:
        contra += len(re.findall(r"\b" + re.escape(c) + r"\b", lower))
    contra_ok = contra >= 1 or n_words < 100 or list_dominant
    band("contractions", contra, contra_ok,
         f"{contra} (weak signal; 0 in casual prose = AI band, but legit in technical/list writing)")

    # negated contrast "not X but Y" / "isn't just"
    neg = len(re.findall(r"\bnot (?:just|merely|only|simply)\b.{0,40}?\b(?:but|—|--)", lower, re.DOTALL))
    neg += len(re.findall(r"\b(?:isn't|don't|doesn't|aren't|not) (?:just|merely|only|simply)\b", lower))
    band("negated-contrast ('not X, but Y')", neg, neg == 0, f"{neg} hits")

    # participial tail: ", <word>ing ..." at sentence end
    ptail = len(re.findall(r",\s+\w+ing\b[^.!?]{0,60}?$", text, flags=re.MULTILINE))
    band("participial tails (', ...ing')", ptail, ptail <= 1, f"{ptail} (heuristic)")

    # tricolons: 3 consecutive short sentences <=5 words
    tri = 0
    for i in range(len(sent_lens) - 2):
        a, b, c = sent_lens[i:i + 3]
        if a <= 5 and b <= 5 and c <= 5 and a > 0:
            tri += 1
    band("tricolon candidates (3x short)", tri, tri == 0, f"{tri}")

    # type-token ratio (lexical diversity) — only meaningful for >200 words
    if n_words > 200:
        ttr = len(set(wlist)) / n_words
        band("type-token ratio", f"{ttr:.2f}", ttr >= 0.45, f"(<0.45 = repetitive)")
    else:
        print(f"  [SKIP ] type-token ratio            (only meaningful >200 words; have {n_words})")

    # bullet density is computed early in L2 (gates burstiness); just report it here
    band("bullet-line density", f"{bullet_pct*100:.0f}%", bullet_pct < 0.4,
         f"{bullets} bullet lines (high for non-list content = AI band; OK for command/validation lists)")

    # sycophantic opener (first ~3 sentences)
    opener = " ".join(sentences[:3]).lower() if sentences else lower[:200]
    syc_hits = [s for s in SYCOPHANTIC if s in opener]
    band("sycophantic opener", len(syc_hits), len(syc_hits) == 0,
         ", ".join(syc_hits) if syc_hits else "")

    # ---- summary verdict --------------------------------------------------
    print("\n" + "=" * 72)
    print("VERDICT (L1/L2 only — L3 needs the qualitative self-audit in SKILL.md)")
    print("=" * 72)
    flags = (
        (1 if focal_hits else 0) + (1 if sign_hits else 0) + (1 if close_hits else 0) +
        (1 if (em > 1 and em_density > 4.0) else 0) + (1 if burstiness_flag else 0) +
        (1 if mid_flag else 0) + (1 if (not contra_ok and not list_dominant) else 0) +
        (1 if neg else 0) + (1 if tri else 0) + (1 if syc_hits else 0)
    )
    if flags == 0:
        print(f"  L1/L2 clean ({flags} flags). Re-check L3: dependency chains, scatter,")
        print("  grounded substance, opinions/stakes. A clean L1/L2 draft can still")
        print("  read as AI if the argument graph is shufflable and specifics are absent.")
    elif flags <= 2:
        print(f"  L1/L2 borderline ({flags} flags). Fix the flagged items, then re-run.")
    else:
        print(f"  L1/L2 hot ({flags} flags). This reads structurally AI. Do NOT just swap")
        print("  words — rebuild: inject grounded specifics, build dependency chains,")
        print("  break burstiness, add one tangent/aside + an opinion. Then re-run.")
    print()

if __name__ == "__main__":
    audit(read_input())
