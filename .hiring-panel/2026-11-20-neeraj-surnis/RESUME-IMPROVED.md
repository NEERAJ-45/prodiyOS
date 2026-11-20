# NEERAJ SURNIS

Thane, Maharashtra | +91 93226 96345 | neerajsurnis@gmail.com | linkedin.com/in/neeraj-surnis | github.com/NEERAJ-45

## SUMMARY

Backend engineer building production payment systems in Java / Spring Boot: Kafka event workflows, maker-checker approvals, RBAC and certificate-based authentication, and SQL / PL-SQL tuning. Ships through Docker, Kubernetes, and Azure DevOps CI/CD; resolves live payment incidents. Built RevPay, a distributed payments project using idempotency keys, optimistic locking, and the transactional outbox pattern.

## IMPACT SNAPSHOT

- Cut query time **40%** on a payment platform serving **10,000+ transactions/day at 99.9% uptime**.
- Resolved **25+ production payment issues** across payment services.
- Load-tested RevPay with JMeter at **~5,200 transactions/second** on a three-instance setup.

## TECHNICAL SKILLS

**Languages:** Java, SQL, PL/SQL, C#, Python, JavaScript
**Backend:** Spring Boot, Spring Data JPA, Hibernate, REST APIs, Swagger/OpenAPI, Microservices, Kafka, Event-Driven Architecture, JWT, RBAC, ASP.NET, FastAPI
**Databases:** Oracle, SQL Server, PostgreSQL, MongoDB, Redis
**DevOps and Cloud:** Docker, Kubernetes, Azure DevOps CI/CD, AWS, Oracle Cloud
**Testing and Tools:** JUnit 5, Mockito, Git, Postman, Jira, Agile/Scrum
**Frontend:** React, Next.js

## PROFESSIONAL EXPERIENCE

**Software Engineer (Java / Spring Boot)** | Maximus Infoware, Thane, Maharashtra | December 2025 – Present
- Build and maintain production Spring Boot microservices and REST APIs for a payment platform serving 10,000+ transactions/day at 99.9% uptime; persist with Spring Data JPA/Hibernate and document with Swagger/OpenAPI.
- Built Kafka event workflows and maker-checker approval flows secured with RBAC and certificate-based authentication.
- Resolved 25+ production payment issues, including a double-debit caused by retried hung API calls; added Redis-backed idempotency keys so retries return the original result instead of posting again.
- Cut query time 40% on an unindexed table by adding a clustered B-tree index, replacing full scans with index seeks.
- Containerized services with Docker and Kubernetes; automated build and deployment through Azure DevOps CI/CD on AWS and Oracle Cloud.
- Built the Digital Payment Switch (IMPS and transaction portal) in C#, ASP.NET, React, and SQL Server, adding real-time interbank transfer support.
- Contributing to the Digital Payment Switch migration from C#/.NET to Spring Boot microservices as part of an R&D initiative.

**Software Developer Intern** | Sainisoft Infotech, Pune, Maharashtra | November 2024 – February 2025
- Built and integrated REST APIs for course management and user workflows, improving admin process automation by 60%.
- Built LMS dashboards for 5,000+ users with role-based access control on MongoDB.

**Full Stack Developer Intern** | Tiyara Innovations LLP, Remote | May 2024 – August 2024
- Integrated backend REST APIs over HTTP/TCP for low-latency data flow across booking workflows.
- Implemented JWT-based authentication, data encryption, and secure session management.

## PROJECTS

**RevPay — Distributed Payment Platform** | Java, Spring Boot, Kafka, Redis, PostgreSQL, Docker, AWS | GitHub
- Designed a Spring Boot microservices payment platform with Kafka event-driven processing; JMeter load tests on a three-instance setup sustained ~5,200 transactions/second in a non-production environment.
- Ensured transactional consistency and safe retries under concurrent load using Redis idempotency keys, `@Version` optimistic locking, and the transactional outbox pattern.
- Unit-tested with JUnit 5 and Mockito; added AWS X-Ray and CloudWatch for distributed tracing and monitoring.

**HustleAI — AI Job Matching Pipeline** | Python, FastAPI, Next.js, MongoDB, Docker | GitHub
- Built a FastAPI REST service that ranks jobs for candidates using Sentence-BERT embeddings and cosine similarity, with MongoDB storage, input validation, structured error handling, and Docker containerization.
- Implemented authentication and session management with NextAuth.js in the Next.js frontend.

## EDUCATION

**B.Tech in Computer Science** | DKTE, Ichalkaranji, Maharashtra | CGPA: 7.86 | September 2023 – May 2026
**Diploma in Computer Engineering** | LESP, Kupwad, Maharashtra | 89% | June 2020 – May 2023

---

Made with /hiring-panel by Alex Chen (@nocodealex) · chen.media
