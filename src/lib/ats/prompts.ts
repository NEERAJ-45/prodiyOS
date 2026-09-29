export interface AnalyzePromptArgs {
  resume: string;
  jobDescription: string;
  roleTitle?: string | null;
}

const SCORE_KEYS_DOC = `- atsScore (0-100): overall ATS parsing friendliness.
- matchScore (0-100): how well the resume matches the JD.
- structure (0-100): standard sections (contact, summary, skills, experience, education), no exotic formatting.
- keywords (0-100): share of JD keywords covered.
- actionVerbs (0-100): use of strong action verbs in bullets.
- quantifiableImpact (0-100): use of numbers/measurable impact.
- length (0-100): appropriate length (1-2 pages).
- contactInfo (0-100): presence of clear contact/identity info.`;

export function analyzePrompt({ resume, jobDescription, roleTitle }: AnalyzePromptArgs): string {
  const roleLine = roleTitle?.trim()
    ? `The candidate is targeting the role: "${roleTitle}". Emphasize keywords relevant to this role even where the JD is generic.\n\n`
    : '';
  return `You are a senior resume writer and ATS expert. Analyze the LaTeX resume against the job description.

Your score must be HONEST. Only count a keyword as "present" if it actually appears in the resume. Never fabricate skills. You may note in recommendations which JD keywords could legitimately be added.

${roleLine}Return STRICT JSON only, no markdown, with this exact shape:
{
  "atsScore": 0,
  "matchScore": 0,
  "structure": 0,
  "keywords": 0,
  "actionVerbs": 0,
  "quantifiableImpact": 0,
  "length": 0,
  "contactInfo": 0,
  "missingKeywords": [],
  "presentKeywords": [],
  "strengths": [],
  "weaknesses": [],
  "recommendations": []
}

${SCORE_KEYS_DOC}
- missingKeywords: JD keywords/skills absent from the resume. List ONLY specific, impactful terms (skills, technologies, tools, frameworks, certifications, or concrete qualifications) — never generic filler like "strong", "ability", "experience", "communication", "team", "driven", or common English words the JD uses in prose. Cap at 12. If a keyword is already covered in the resume, do not list it.
- presentKeywords: JD keywords actually found in the resume.
- strengths/weaknesses: short bullets about the resume.
- recommendations: concrete, actionable changes, ordered by impact. Where truthful, include exact LaTeX lines to add.

JOB DESCRIPTION:
${jobDescription}

RESUME (LaTeX source):
${resume}`;
}

export function optimizePrompt({ resume, jobDescription, roleTitle }: AnalyzePromptArgs): string {
  const roleLine = roleTitle?.trim()
    ? `The candidate is targeting the role: "${roleTitle}". Prioritize keywords relevant to this role. If the JD is generic, weight terms related to "${roleTitle}".\n`
    : '';
  return `You are a senior resume writer. Rewrite the LaTeX resume to maximize ATS match with the job description.

${roleLine}Rules:
- Keep the SAME LaTeX document class, packages, and COMPLETE set of sections. Do NOT remove, merge, or rename sections like Education, Projects, Experience, Skills, Certifications, or Summary — even if the JD does not mention them. Preserve every section that exists in the original resume.
- Preserve ALL existing content with IDENTICAL factual density: every course, project, employer, degree, certification, tool, date, city, and numeric detail. Do NOT delete, merge, rewrite-away, or shorten any existing bullet or item. Content preservation outranks the one-page goal.
- Do NOT abbreviate, truncate, or remove prior achievements to fit. Iff it cannot fit on one page, compress the LAYOUT instead of the content: tighten margins, spacing, and font sizes; further condense only filler/boilerplate words, never facts.
- Preserve truthful experience; do NOT invent roles, employers, or degrees.
- Where a JD keyword is genuinely supported by the candidate's background, work it into bullet points and the skills list naturally.
- Use concise, action-oriented bullets with measurable impact where honest.
- Keep it to AT MOST 1.2 pages (A4) via the layout-compression rule above — never by deleting, merging, or shortening real content. Slightly over one page is acceptable; preserving content is more important than page count.
- The optimized LaTeX must contain BOTH \\begin{document} and \\end{document}, with the full document body between them.

Return STRICT JSON only (no markdown) with this exact shape:
{
  "optimizedSource": "",
  "contentPreserved": true,
  "atsScore": 0,
  "matchScore": 0,
  "structure": 0,
  "keywords": 0,
  "actionVerbs": 0,
  "quantifiableImpact": 0,
  "length": 0,
  "contactInfo": 0,
  "missingKeywords": [],
  "presentKeywords": [],
  "strengths": [],
  "weaknesses": [],
  "recommendations": []
}

- optimizedSource: the complete rewritten LaTeX source as a single string (escape all double quotes and backslashes).
- contentPreserved: true ONLY if you kept every section name, every real fact (courses, projects, employers, degrees, certifications), and every individual item from the original. Set false if you dropped, merged, renamed, or trimmed any real content, item, or section.
- Scores and lists describe the optimized version.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME (LaTeX source):
${resume}`;
}

// Humanizer skill: 26 patterns that turn AI-drafted resume text into writing that
// sounds like a person did it. Each pattern is applied only where it genuinely fits.
const HUMANIZER_PATTERNS = `
1. ai-opener-cliche — Replace openers like "Passionate ... with a proven track record", "Results-driven ... leveraging ...", "Dynamic ... dedicated to ..." with a direct, specific first sentence.
2. corporate-filler — Replace "leveraged", "spearheaded", "utilized", "facilitated", "orchestrated", "employed" with the plain verb: used, led, ran, wrote, built, fixed, taught, sold.
3. adjective-stacks — Collapse stacks like "robust, scalable, high-performance" to at most one adjective, or drop it when a number can carry the claim.
4. buzzword-hunter — Delete "seamlessly", "cutting-edge", "state-of-the-art", "best-in-class", "world-class", "synergy", "game-changer", "mission-critical" unless they name something real.
5. length-variation — Vary bullet and sentence length. No two consecutive bullets should land within ~3 words of the same length; break one long bullet into a short one.
6. active-voice — "X was built by the team" → "The team built X". Keep implied first person ("Built", "Designed", "Led").
7. numbers-over-adjectives — "Dramatically improved performance" → keep the concrete number ("cut load time 40%"). If no number exists, say what changed plainly.
8. one-concrete-detail — Prefer one specific detail (tool, scale, user count, timeframe) over three vague qualities.
9. drop-hedging — Remove "helped to", "was responsible for", "assisted in", "worked on" when the person actually did it. Own the verb.
10. contractions-in-prose — In summary/profile prose, contractions are fine ("don't", "I've", "we're") when they read naturally. Never use contractions inside bullets.
11. no-noun-triples — Break "innovation, collaboration, and excellence" style triples into a real sentence or cut them.
12. no-buzzword-triplets — Remove stacked HR phrasing like "cross-functional stakeholder alignment driving synergy across teams" unless every word is literally true.
13. transition-chains — Do not stack "Furthermore,", "Moreover,", "Additionally," at the starts of sentences/bullets. Most bullets need no transition at all.
14. varied-verb-starts — Never start 3+ consecutive bullets with the same verb, especially "Developed"/"Responsible".
15. no-dash-chains — Avoid em-dash and semicolon chains; use two plain sentences or a comma.
16. no-restated-content — Do not repeat the same achievement in both the summary and the bullet list. Keep each fact in its strongest single place.
17. weave-tools — Do not append a bolted-on tool clause ("... by utilizing React, TypeScript, and Node"). Weave the tool into the achievement itself.
18. no-fuzzy-quantifiers — Replace "various", "multiple", "several", "numerous" with the actual count when it exists; otherwise rephrase.
19. de-nominalize — "development of the pipeline" → "developed the pipeline"; "implementation of tests" → "implemented tests".
20. plain-words — Latinate swaps: utilize→use, commence→start, endeavor→try, obtain→get, purchase→buy, require→need, sufficient→enough.
21. kill-intensifiers — Remove "very", "extremely", "highly", "truly", "deeply" and empty superlatives ("highly skilled", "deeply knowledgeable").
22. name-it — Replace category words with the real name: "a web application" → the app's name; "a popular JS library" → React.
23. tense-consistency — Past roles: past tense throughout. Current role: present tense. Never mix within one role.
24. no-template-symmetry — Avoid every bullet reading as "Did X by doing Y to achieve Z". Vary the sentence shapes.
25. honesty-guard — Never invent numbers, tools, employers, titles, dates, or metrics. If a claim cannot be verified from the original, leave the original wording.
26. latex-safety — Only rewrite visible text content. Keep document class, packages, \\section names, formatting commands, contact details, and overall structure byte-identical apart from the reworded text. Output must contain both \\begin{document} and \\end{document}.
`;

export function humanizePrompt({ resume }: { resume: string }): string {
  return `You are an expert humanizer of resume writing. You rewrite AI-drafted resume text so a real person could have written it — plain, specific, uneven, and honest — while keeping every fact.

Apply the following patterns where each genuinely fits (skip any that would distort the truth or break LaTeX):

${HUMANIZER_PATTERNS}

Non-negotiable rules:
- Preserve EVERY section, employer, degree, course, project, certification, tool, date, city, and number. Do not drop, merge, rename, or shorten any item. Content preservation outranks style.
- Do not invent facts. Truthfulness outranks every pattern.
- This is a rewrite, not an optimization: keep the same content and structure; only change HOW things are worded.
- LaTeX must stay compilable: same document class and packages, both \\begin{document} and \\end{document} present.

Return STRICT JSON only (no markdown) with this exact shape:
{
  "optimizedSource": "",
  "contentPreserved": true,
  "patternsFound": [
    { "section": "", "pattern": "", "before": "", "after": "" }
  ],
  "atsScore": 0,
  "matchScore": 0,
  "structure": 0,
  "keywords": 0,
  "actionVerbs": 0,
  "quantifiableImpact": 0,
  "length": 0,
  "contactInfo": 0,
  "strengths": [],
  "weaknesses": [],
  "recommendations": []
}

- optimizedSource: the complete rewritten LaTeX as a single string (escape quotes and backslashes).
- contentPreserved: true ONLY if every section and every real fact survived unchanged in meaning.
- patternsFound: one entry per actual change, capped at 20, ordered by importance. Use the pattern number+name (e.g. "2. corporate-filler") as "pattern", the section name as "section", and short before/after excerpts (max ~150 chars each) as evidence. If nothing needed changing, return [].
- scores: rate the rewritten version honestly (0-100 each). Leave missingKeywords/presentKeywords out — there is no job description.

RESUME (LaTeX source):
${resume}`;
}

