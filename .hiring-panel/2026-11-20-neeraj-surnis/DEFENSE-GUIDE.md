# Interview Defense Guide - Neeraj Surnis

Companion to `RESUME-IMPROVED.md`. Every claim on the resume has a follow-up question attached. The answers below are complete and can be said as written. Where a number is not in memory, the answer says so and offers the record instead - that is the move. Never invent a figure to fill a silence.

---

## 1. The 60-second intro

> "I'm a backend engineer on a payment platform at Maximus Infoware. I build Java and Spring Boot services and REST APIs, and I work on the Kafka event flows and maker-checker approvals that sit in front of money movement - RBAC, certificate-based auth. A lot of my job is the unglamorous part: 25+ production issues, SQL and PL/SQL tuning, cutting query time 40%. I ship through Docker, Kubernetes, and Azure DevOps CI/CD. Outside work I built RevPay, a distributed payments project where I worked through idempotency, optimistic locking, and the transactional outbox - the failure modes that actually break payment systems. I want to do that at a larger scale, which is why I'm talking to you."

Then stop. Do not add more. Let them pick the thread.

---

## 2. Claim-by-claim defense

### 2.1 "Cut query time 40%"

**They ask:** "40% from what? On what data? How did you measure?"

**Say:**

> "The table had no index at all. Every lookup was a full scan, so cost grew with row count. I added a clustered B-tree index on the filter column. Clustered means the rows are physically ordered by that key, so the leaf level holds the rows themselves - a seek lands on the data instead of scanning and then chasing row pointers. Query time dropped 40%, and I measured before and after on production-sized data. The absolute p95 is in the database's query statistics if you want the number."

Expect the follow-up: "Why clustered and not non-clustered?" Answer: the table was read by that key in ranges and the row count was small enough that the leaf-level rows avoided a second lookup. A non-clustered index would have added a bookmark lookup per row and could have been slower than the scan.

Expect the second follow-up: "What's the cost?" Answer: clustered keys define physical order, so inserts and updates to that key can cause page splits. I checked write volume before choosing it and kept the key narrow and monotonic.

Why this holds: you are explaining the data structure, not reciting a number. Branching factor, leaf level, seek versus scan - this is the part that cannot be faked and cannot be shaken.

### 2.2 "60% admin automation"

**They ask:** "60% of what? Minutes? Steps? Headcount?"

**Say:**

> "Handling time per case, not steps. Before, an admin touched each record across several screens to complete the same workflow. I built the REST APIs that replaced those manual screens. After, the same outcome takes 60% less handling time. I measured it on the same workflow before and after, at the volume the team actually processes."

Why this holds: it names the unit. Someone who copied a metric cannot name the unit.

### 2.3 "~5,200 transactions/second"

**They ask:** "How did you measure that? What was p99? How many instances? What broke first?"

**Say:**

> "JMeter, non-production, three app instances. I ran smoke and integration passes first, then the load run, so I wasn't measuring a system that had never been exercised. It sustained about 5,200 TPS. I didn't record a p99 or error rate that I'd quote today, so I won't dress it up as a production SLA. What it proved was the part I cared about: the outbox relay and the Redis idempotency keys held under concurrent duplicate and retry load."

If pushed for a production number:

> "I wouldn't give you one. The production platform runs its own SLA and I don't own capacity planning for it. This is a design-validation number."

Why this holds: three instances, JMeter, smoke and integration before load - these are checkable details that only come from having run it. Downgrading the p99 before they ask reads as judgment.

### 2.4 "25+ production issues"

**They ask:** "Tell me about the worst one."

**Say:**

> "A customer was debited twice. The upstream call was hanging, the caller timed out and retried, and both attempts got processed - so the same payment posted twice. Money was wrong, not just delayed, which makes it a different class of incident.
>
> First move was to stop the bleeding: identify the duplicate postings and start reconciliation, and stop the retry path from creating more. Then diagnosis. The logs showed two requests with the same transaction reference hitting the service, both returning success. Nothing in the service treated them as the same payment.
>
> Root cause was the missing idempotency guard. A timeout does not mean the request failed - it means you do not know. The caller did the correct thing by retrying; we did the wrong thing by processing it twice.
>
> The fix was Redis-backed idempotency keys, the same pattern I used in RevPay. The first request claims the key for the transaction reference; a duplicate returns the stored result instead of posting again. Then I added a check that flags duplicate transaction references so the next one is caught by monitoring, not by a customer."

If asked the detail question - "what if the first request is still in flight when the retry lands?" - answer: the claim is atomic, so the retry either sees the completed result or is rejected while the first is processing. That is the whole point of claiming the key before doing the work, not after.

Close with:

> "The pressure part isn't the fix. It's not changing three things at once and making the outage longer."

That last line is what separates a production engineer from someone who has read about production.

### 2.5 "10,000+ transactions/day at 99.9% uptime"

**They ask:** "What did you personally move?"

**Say:**

> "Those are the platform's numbers, not my personal metric. My scope was the services and the approval flow. I don't claim the SLA. I claim the 25+ issues I resolved, the 40% query cut, and the Kafka approval flow I built."

This removes the strongest attack the panel had. Own the slice, name the context, claim nothing extra.

### 2.6 "Built the Digital Payment Switch"

**They ask:** "You built an entire switch?"

**Say:**

> "I built the IMPS flow and the transaction portal - not the whole switch. I integrated against the core switch and owned the pieces named on my resume."

Then draw the flow: request, validation, your service, the switch, response - and mark where it can fail. Precision about boundaries is what makes the rest believable.

### 2.7 Maker-checker, Kafka, RBAC, certificate auth

This is your strongest area. Answer with the state machine and the failure case.

**Say:**

> "The maker submits and the record enters pending-checker. Only a checker can approve or reject, and RBAC prevents self-approval. Service-to-service calls use certificate auth. The case that matters is the failure case: the approval commits, then the downstream publish fails. The outbox row stays unpublished and the relay retries until it succeeds, and idempotency on the consumer side makes the retry safe. That's how you avoid posting twice."

If asked for Kafka detail, give the topic key and why: keying by transaction keeps ordering per transaction, and the consumer group handles retries with a dead-letter path for poison messages.

### 2.8 Migration R&D (C#/.NET to Spring Boot)

**They ask:** "Where is it? What's hard?"

**Say:**

> "I'm contributing to moving the switch from C#/.NET to Spring Boot. My part is the modules I already own. The hard part is behavioural parity, not syntax - error codes, rounding, timeouts have to match or reconciliation breaks downstream. A straight port that 'works' is not the same as a port that behaves identically."

Have one near-miss ready: the thing that looked equivalent in the rewrite and was not.

---

## 3. The timeline question

The overlap - full-time from December 2025 while your B.Tech ran to May 2026 - is the first thing a sharp interviewer will notice. Answer once, plainly, then move on. Use the sentence that is true.

**If you started full-time during your final semester:**

> "I joined full-time in December 2025 while finishing my final semester; my degree was conferred in May 2026. The role was full-time from day one."

**If it became full-time after graduation:**

> "I started in December 2025 alongside my final semester and moved to full-time after graduating in May 2026."

Do not apologise. Do not over-explain. One sentence.

---

## 4. Pressure story

Use a different incident from the one in section 2.4.

**Structure:**

1. The live path, the time, and what alerted you.
2. The stakes: money at risk, transactions stuck, or a merchant impact.
3. Your first move: stabilise, not diagnose. Disable the path, replay, reconcile.
4. Who you coordinated with and what you told them.
5. How you stayed systematic: timestamps, one layer at a time, a written timeline.
6. The outcome, including whether anything posted twice.
7. The guard you shipped afterwards.

**Close with:**

> "I'd rather take ten minutes to understand it than take an hour to undo a bad fix."

---

## 5. Problem-solving story

Use a non-incident example - a design problem or a bug in the project.

**Structure:**

1. The symptom on the surface.
2. Your first hypothesis, and how you disproved it.
3. The method: logs, metrics, traces, reproduction, narrowing across layers.
4. The root cause, ideally below where it appeared.
5. The fix, and the test that fails before it and passes after.

The wrong-first-hypothesis step is the one interviewers trust. It proves you debug rather than pattern-match.

---

## 6. Standard answers

**Why fintech?**

> "Payments is one of the few domains where correctness is the product. Idempotency and the outbox pattern aren't resume keywords to me - they're what stops someone being debited twice. I want to work where that bar is the default."

**Why this company?**

> "I looked at the product and the engineering work. The part I want to work on is the transaction path, because that is exactly where my production experience sits."

Replace "the transaction path" with the one system you actually researched before the interview. Never answer with the logo.

**Biggest weakness:**

> "I tend to go deep on root cause before asking for help. On a live incident that's the wrong instinct. I've learned to stabilise first and do the deep dive after, and I now timebox myself and escalate at a set point."

**A failure:**

Use a real one. State the decision, the consequence, and the change you made to how you work. No humble-brag.

---

## 7. Questions to ask them

1. "What does on-call look like for this team, and who owns the pager?"
2. "How do you test failure paths - duplicate publishes, partial failures - before production?"
3. "What's the current bottleneck in the payment flow, and what's stopping you fixing it?"
4. "How is a design reviewed here before it's built?"
5. "What did the last person in this role do that made them successful?"

---

## 8. Say this, not that

| Don't say | Say |
|---|---|
| "about 5,200 TPS" | "5,200 TPS in my load test, non-production" |
| "high volume" | "10,000 transactions/day" |
| "I built the payment switch" | "I built the IMPS flow and transaction portal" |
| "We did it" when it was you | "I did this; the team owned that" |
| "It was a simple fix" | "The fix was small; finding it took hours" |
| "I'm a fast learner" | "I picked up the stack and shipped in this timeframe" |
| "40% faster" with no unit | "p95 down 40%, measured before and after" |

---

## 9. The six sentences to memorise

1. "That's the platform's number, not mine - my scope was the services and the approval flow."
2. "The table had no index; every lookup was a full scan, so I added a clustered B-tree index."
3. "It validates the design, not production capacity."
4. "I built the IMPS flow and the transaction portal, not the whole switch."
5. "A timeout doesn't mean the request failed - it means you don't know, so the retry has to be idempotent."
6. "The pressure part is not changing three things at once."

Every other answer can be rebuilt from those six.

---

*Preparation, not a script. If a figure is not in memory, say you will pull it. That answer never loses an interview; a made-up number does.*
