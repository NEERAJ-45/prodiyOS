# Hiring Panel — Neeraj Surnis

Target: Software Engineer (backend, Java / Spring Boot) at a fintech or large tech company.
Source: `Neeraj_Surnis_Resume_Mastercard.pdf` (Downloads).
Review date: 2026-11-20.

## Verdicts

| Reviewer | Verdict | What decided it |
|---|---|---|
| Automated screen (original) | PASS | On-target keywords, clean single column. Flagged tenure math, thin production observability, one vague bullet. |
| Hiring manager | INTERVIEW | Real payment work (IMPS, maker-checker, certificate auth) beats generic CRUD at 1 year. Timeline pause. |
| Reader 1 — hiring manager | MAYBE | Timeline overlap discounts the whole resume; "built a full switch" is not credible at junior level. |
| Reader 2 — rival applicant | MAYBE | "High-volume" contradicted by 10,000/day (~0.1 TPS); non-production 5,200 TPS is a vanity benchmark. |
| Reader 3 — CEO | MAYBE | 10,000/day stat credits the platform, not the candidate; 40% has no baseline. |
| Reader 4 — recruiter (30 s) | MAYBE | "about 1 year of combined full-time and internship" reads as padding; buzzword summary. |
| Reader 5 — teammate | MAYBE | Boilerplate Agile line, passive "contribute", no collaboration or ownership signals. |
| Automated screen (improved) | PASS | Structure, dates, and keyword coverage clean; no blockers. |

## What is wrong — merged, worst first

1. **Tenure math contradicted itself.** `"about 1 year of combined full-time and internship experience"` against `"December 2025 - Present"` and `"B.Tech ... September 2023 - May 2026"`. Readers stopped trusting the top third. (Screen, hiring manager, readers 1 and 4.)
2. **"High-volume" was contradicted by its own number.** `"high-volume payment transaction processing"` + `"10,000+ daily transactions"` is ~0.1 TPS. (Readers 2 and 3, screen.)
3. **Three metrics with no baseline or method.** `"reducing query times by 40%"`, `"improving admin process automation by 60%"`, `"reached about 5,200 transactions per second"` — each invites one interview question that collapses it. (Hiring manager, readers 1–3.)
4. **Metrics credited the platform, not the candidate.** `"on a production payment platform handling 10,000+ daily transactions at 99.9% uptime"` describes the product, not what he changed. (Reader 3, screen.)
5. **Duty language instead of outcomes.** `"Develop and maintain..."`, `"Work in an Agile/Scrum team following IT control and secure-delivery practices."`, `"Contribute to an R&D initiative..."` — no ownership, no result. (Readers 3 and 5, hiring manager.)
6. **A junior claiming a whole payment switch, plus C#/.NET dilution.** `"Built the Digital Payment Switch (IMPS and Transaction Portal) using C#, ASP.NET, React, and SQL Server"` — credibility stretch and it pulls focus off the Java role. (Reader 1; screen.)
7. **Summary was a buzzword dump that led with tenure.** `"idempotency keys, optimistic locking, and the transactional outbox pattern"` in the intro, plus the "1 year" framing. (Reader 4.)
8. **Unnamed technology in a precise resume.** `"backed by a non-relational database"` where every other line names the stack. (Screen.)
9. **Observability and ops proof sat only in the personal project.** `"added AWS X-Ray and CloudWatch"` under RevPay; production role had no testing, monitoring, or on-call evidence. (Screen.)
10. **No collaboration signals.** Every bullet was solo-framed: no PRs reviewed, runbooks, pairing, handoff, or on-call. (Reader 5.)

## What changed in the rebuild

- Deleted the tenure claim; the dates now speak for themselves.
- Removed "high-volume"; the platform number is stated as scope, not as his impact.
- Moved the three strongest metrics into an `IMPACT SNAPSHOT` directly under the summary.
- Rewrote bullets to start with the action and end with the result; dropped the Agile boilerplate.
- Named MongoDB.
- Kept the Digital Payment Switch but positioned the Java migration as the forward-looking work.
- Everything removed was either unverifiable ornament or repetition. No employer, date, title, or number was added.

## Screen verdict, before and after

- Before: **PASS** (5 flags, all content-level).
- After: **PASS** (2 minor flags: non-standard `IMPACT SNAPSHOT` heading, C#/.NET bullet under a Java title — neither blocks).

## Add these only if true (ranked by lift)

1. Query baseline and dataset size for the 40% (`120 ms → 72 ms p95, 40M rows`).
2. One production incident story with severity and MTTR.
3. Load-test harness for 5,200 TPS (tool, instance count, p99, error rate).
4. Which modules of the Digital Payment Switch he actually delivered.
5. Deployment frequency or rollback time for the CI/CD line.
6. Any collaboration fact: PRs reviewed, runbooks, on-call, mentoring.
7. What "60% admin automation" measured, in absolute terms.

---

Made with /hiring-panel by Alex Chen (@nocodealex) · chen.media
