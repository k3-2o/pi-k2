# Detection Layers — The Full Model

AI text is detectable at three layers, each progressively harder to scrub. This file is the deep reference: the complete tell catalogs per layer and the research they come from. SKILL.md has the compressed version and the workflow.

## Why layers matter (the non-obvious part)

Scrubbing only Layer 1 makes you MORE detectable, not less (June Kim 2026): a "humanizer" that swaps surface tells for rhetorical polish is more transparent to a stronger model, because the structure (L2) and argument graph (L3) remain, and the polish itself is a tell. Style cracks in 1 adversarial iteration, structure in 2. The only signal that survives feedback is domain substance. **Fixes must go deep, not just surface.**

---

## Layer 1 — Surface (lexical + punctuation tells)

### Focal words (Kobak et al. 2025; "Why does ChatGPT delve so much?" arXiv:2412.11385)

Statistically overrepresented in AI text vs. pre-LLM baseline. Ratio (r) = frequency vs. baseline.

- **delve / delves / delving** (r≈28) — strongest single marker.
- underscores / underscoring (r≈13.8), showcasing / showcases (r≈10.7), pivotal, intricate, meticulously, realm, aligns, underpins, garnered, bolstering, notably.
- The 21 "focal words": delve, intricate, commendable, meticulous, surpass, elevate, foster, tapestry, realm, navigate, landscape, pivotal, resonate, testament, underscore, showcasing, compelling, paramount, crucial, unwavering, alignment.
- Full 900-word excess-vocab list: github.com/berenslab/llm-excess-vocab.

### Prestige-noun cluster

tapestry, landscape, realm, mosaic, ecosystem, symphony, labyrinth, beacon, cornerstone, bedrock, testament, cacophony, kaleidoscope, odyssey.

### Corporate-inflation adjectives

robust, seamless, pivotal, vibrant, dynamic, comprehensive, multifaceted, nuanced, holistic, cutting-edge, state-of-the-art, transformative, groundbreaking, unparalleled, profound, innovative, ever-evolving, ever-changing.

### Inflated verbs

leverage, utilize, harness, streamline, facilitate, optimize, empower, navigate, illuminate, bolster, foster, elevate, align, unpack, embrace, unlock.

### Signposting filler

- "it's important to note that…"
- "it's worth noting that…"
- "it's worth mentioning that…"
- "that being said…"
- "in today's fast-paced world…"
- "in an ever-evolving landscape…"
- "navigating the complexities of…"
- "a deeper understanding of…"
- "at its core…"
- "at the heart of…"
- "when it comes to…"
- "in the realm of…"
- "play a (vital/pivotal/crucial/significant) role in…"
- "stand(s) as a testament to…"
- "a nuanced take / understanding of…"
- "delve into the intricacies of…"
- "dive deep into…"
- "let's break it down" / "let's unpack this"

### Closing rituals

- "in conclusion…"
- "in summary…"
- "overall…"
- "ultimately…"
- "remember, when doing X it's important to consider…"
- "as we navigate [X], it's essential that we…"
- "the journey doesn't end here…"
- "hope this helps!" / "let me know if you'd like me to go deeper!"

### Rhetorical moves

- **Negated contrast / negative parallelism**: "it's not X, it's Y"; "this isn't just a product, it's a revolution." Scales fractally — whole posts built of stacked "not X but Y." Among the most diagnostic single moves.
- **Flattened tricolon / rule of three**: "Fast. Simple. Effective." Three parallel phrases, equal length, identically punctuated. (Distinct from the classical Ciceronian tricolon.)
- **Participial tail**: a floating participial phrase restating the main clause: "…, marking a pivotal moment in…" / "…, underscoring its importance for future research."
- **Hedge-and-reassure** (Claude especially): qualifier + immediate reassurance, often three hedges stacked before saying anything.
- **Puffed-up significance**: a minor thing inflated to "a pivotal moment in the evolution of…"
- **False concession / both-sides hedge**: "while critics argue X, supporters maintain Y; the truth lies somewhere in between."
- **Aphoristic closure**: paragraphs end on a pseudo-profound pull-quote.

### Punctuation & formatting

- **Additive em dashes**: em dashes attaching qualifying/explanatory segments (additive) rather than sharp parenthetical asides (disruptive). Human em dashes *interrupt*; AI em dashes *append*. Distribution matters more than presence. Human band: 0–2 / 1000 words; AI: 6–12+ / 1000.
- Curly/smart quotes and apostrophes where context uses straight.
- Unicode flair in wrong places (𝗯𝗼𝗹𝗱, → arrows, • bullets in non-technical prose).
- Title-case headings where none belong; H2/H3 in short pieces that don't need them.
- Emoji section bullets (🚀 🔑 💡 ✅) — RLHF marketing-blog residue.
- Near-perfect grammar, zero contractions, zero fragments.

---

## Layer 2 — Structure (burstiness, templatedness, shape)

- **Low burstiness**: uniform sentence length (14–22 words median, small variance). Humans burst — short declaratives punctuated by long clausal ones. GPTZero's original signal.
- **Low perplexity**: token-by-token predictability — the next word is always the safest.
- **Templatedness**: repeated part-of-speech tag templates across sentences (Shaib et al. 2024b). Bloomberry: 82% of AI outputs follow a predictable four-part sentence cadence; 64% reuse identical vocabulary clusters across unrelated prompts.
- **Five-paragraph-essay shape** scaled to any length: intro + 3 body + recap. Section summaries close every subsection ("in summary," "overall").
- **Excessive signposting**: "first we'll look at… second… finally…"
- **Flat affect / no mood drift**: a single temperature held across the whole piece. Real writing shifts analytical → annoyed → tender.
- **Resolution bias**: endings tie up; the model doesn't trust the reader with ambiguity.
- **Nested bullets for non-list ideas**: bullet-point fetish, bold-stemmed list items where a paragraph would do.
- **Bad-subject problem** (Shankar): the grammatical subject isn't the sentence's actual topic; orphaned demonstratives ("this highlights…") with no referent.
- **Hypotactic smoothness, no fragments**: sentences always resolve; no anacoluthon, no comma splices, no fragments. Real prose misbehaves.
- **Missing concrete particulars**: no Tuesday, no specific brand, no specific month, no regional accent.

---

## Layer 3 — Narrative / argument graph (the durable signal)

The layer that survives "humanizing." From StoryScope and June Kim's experiment.

### StoryScope findings (Russell et al. 2026, arXiv:2604.03136)

- 61,608 stories, 5 LLMs (Claude, GPT, Gemini, Kimi, DeepSeek), 93.2% macro-F1 detection using **narrative structure alone** — no word choice, no sentence style.
- AI clusters tightly; humans scatter. AI = safe, predictable choices; humans = erratic, novel ones.
- AI almost never tangents, subplots, flashbacks, or unresolved bits. Humans do constantly.
- AI plays safe and vague; humans name real places, reference real things, address the reader.
- Per-model signatures: Claude = restrained, quiet endings, never escalates; GPT = gossip/exuberance; Gemini = grim/dark settings.
- Even after "humanizing" (surface-tell removal), the structural signature survives.

### June Kim's six structural dimensions (june.kim/slop-detection)

1. **Falsifiable-claim density** — does the text make claims that could be wrong?
2. **Novel-concept introduction** — does it introduce anything not in the generic prompt?
3. **Argument dependency chain** ← *strongest discriminator*. Real essays force later paragraphs to inherit constraints from earlier ones; AI stacks self-contained units you could shuffle.
4. **Specificity ratio** — concrete particulars vs. generics.
5. **Interchangeability index** — could this paragraph be swapped with one from another piece on another topic?
6. **Hedging frequency**.

### June Kim's adversarial results (load-bearing for this skill)

- 16/16 blind detection; originals 8.3, slop 6.7.
- Humanizing slop made scores **WORSE** (3.6 → 2.4) — swapped structural tells for rhetorical ones a stronger model found more transparent.
- An adversarial humanizer that knew the exact rubric gamed every dimension (6.7 vs originals 5.4) but the classifier still caught all 6 — via a qualitative "could this have come from a generic prompt?" question. **The rubric was the exploit surface, not the defense.**
- Style cracked in 1 iteration, structure in 2.
- Only survivor = **domain substance** (real citations, real equations, real architecture — "things GPT-5.4 can't invent on demand").
- The "superhumanizer" is a **dehumanizer**: optimizing for structural necessity strips asides, reactions, personality — "structurally necessary and nothing else."

### The Shaib slop taxonomy (arXiv:2509.19163) — 7 codes, 3 themes

- **Information Utility**: Density (verbose, little info), Relevance (off-task).
- **Information Quality**: Factuality (hallucinated/fabricated), Bias (lack of needed subjectivity / over-objectivity).
- **Style Quality**: Structure (Repetition + Templatedness), Coherence, Tone (Fluency, Verbosity, Word Complexity, Tone).
- Strongest predictors of "slop": Relevance, Density, Tone.
- **LLMs cannot self-detect slop**: GPT-5, DeepSeek-V3, o3-mini all κ≈0; reasoning models fixate on Density and miss the rest. → A self-audit by the same model class that wrote the draft is unreliable on L3; lean on the deterministic scorer for L1/L2 and on the structured self-audit questions for L3.

### What actually defeats all layers

Grounded specificity + controlled messiness + a voice with opinions/stakes. Not a checklist. Not polish. The thing only a person who did the work could have written.

---

## Research citations

- **Russell, Rajendhran, Pham, Iyyer, Wieting (2026).** *StoryScope: Investigating idiosyncrasies in AI fiction.* arXiv:2604.03136. — narrative-structure detection, 93.2%, per-model signatures, scatter-vs-cluster. [Source of the YouTube video.]
- **Shaib, Chakrabarty, Garcia-Olano, Wallace (2026).** *Measuring AI "Slop" in Text.* arXiv:2509.19163. Northeastern + Meta. — the 7-code slop taxonomy, expert annotation, LLMs can't self-detect.
- **June Kim (2026).** *Can You Detect AI Slop?* june.kim/slop-detection + github.com/kimjune01/reasoning-filter. — six structural dimensions, adversarial humanizer, "rubric as exploit surface," domain substance as the surviving moat.
- **Kobak, Greshake, et al. (2025).** *Stylistic and vocabulary changes in biomedical abstracts post-LLM.* Science Advances. — 15M PubMed abstracts, 13.5–40% LLM-penetrated, focal-word r-ratios. github.com/berenslab/llm-excess-vocab.
- **"Why does ChatGPT delve so much?"** arXiv:2412.11385. — 21 focal words.
- **Vollmer (2026).** *A Field Guide to AI Tells.* matthewvollmer.substack.com. — the compiled taxonomy (lexical/syntactic/rhetorical/tonal/formatting/domain/model-specific), drawing on Wikipedia's *Signs of AI Writing*, Neil Clarke, Vauhini Vara.
- **McGovern, Stureborg, Suhara, Alikaniotis (2025).** *Your Large Language Models Are Leaving Fingerprints.* GenAIDetect workshop. — n-gram + POS-feature classifiers, model fingerprints.
- **Bharadwaj, Malaviya, Joshi, Yatskar (2025).** *Flattery, Fluff, and Fog.* arXiv:2506.05339. — reward models overweight length, structure, jargon, sycophancy, vagueness.
- **Hans, Schwarzschild, et al. (2024).** *Binoculars: zero-shot detection of machine-generated text.* arXiv:2401.12070. — 0.95 AUROC.
- **Mitchell et al. (2023).** *DetectGPT.* — probability-curvature zero-shot detection.
- **Russell, Karpinska, Iyyer (2025).** *People who frequently use ChatGPT are accurate detectors.* ACL 2025. — heavy LLM users detect at ~90%.
- **Liang et al. (2023).** Stanford HAI. — detectors false-positive 61% on non-native English writers (ethics caution: detection is unreliable and biased; never treat a flag as proof).
- **Chakrabarty, Laban, Wu (2024).** *Art or artifice? LLMs and the false promise of creativity.* CHI 2024.
- **Chakrabarty, Laban, Wu (2025a).** *AI-slop to AI-polish?* arXiv:2504.07532. — LAMP editing taxonomy (cliché, unnecessary exposition, lack of specificity).
- **Shankar.** sh-reya.com/blog/ai-writing. — bad-subject problem, bullet overuse.
- **Bloomberry (2026).** *AI Writing Dialects / AI Sentence DNA.* — 7,400+ catalogued patterns, 82% four-part cadence, 64% identical vocabulary clusters.
