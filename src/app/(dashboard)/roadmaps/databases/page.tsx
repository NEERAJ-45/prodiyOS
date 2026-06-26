'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import dynamic from 'next/dynamic';

const QuestionsTable = dynamic(() => import('@/components/roadmaps/QuestionsTable'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-zinc-500">Loading Databases roadmap topics...</p>
    </div>
  ),
});

interface QuestionItem {
  id: number;
  title: string;
  difficulty: string;
  link: string;
}

const databasesQuestions: QuestionItem[] = [
  { id: 601, title: 'Introduction to Databases and DBMS Architecture', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/dbms-architecture/' },
  { id: 602, title: 'Relational Data Model and Schemas definition', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/relational-model-in-dbms/' },
  { id: 603, title: 'Entity-Relationship (ER) Modeling & Crow\'s Foot Notation', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/introduction-of-er-model/' },
  { id: 604, title: 'Integrity Constraints: Entity, Referential, and Domain Integrity', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/dbms-integrity-constraints/' },
  { id: 605, title: 'SQL Basics: DDL (Data Definition Language) vs DML (Data Manipulation Language)', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/sql-ddl-dml-tcl-dcl/' },
  { id: 606, title: 'SQL Data Selection, Filtering (WHERE) and Sorting (ORDER BY)', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/sql-where-clause/' },
  { id: 607, title: 'SQL Joins: Inner, Left, Right, Full Outer, Cross, and Self Joins', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/sql-join-set-1-inner-left-right-and-full-joins/' },
  { id: 608, title: 'SQL Aggregation functions and GROUP BY with HAVING clause', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/sql-group-by/' },
  { id: 609, title: 'Subqueries: Nested, Correlated, and EXISTS/NOT EXISTS operators', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/sql-subquery/' },
  { id: 610, title: 'Common Table Expressions (CTEs) & Window Functions (ROW_NUMBER, RANK, DENSE_RANK)', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/sql-window-functions-in-sql/' },
  { id: 611, title: 'SQL Transaction Control Language (TCL): Commit, Rollback, and Savepoints', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/sql-tcl-commands/' },
  { id: 612, title: 'Database Normalization: 1NF, 2NF, 3NF and Boyce-Codd Normal Form (BCNF)', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/introduction-of-database-normalization/' },
  { id: 613, title: 'Advanced Normalization: 4NF, 5NF and Multivalued Dependencies', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/dbms-fourth-normal-form-4nf/' },
  { id: 614, title: 'Denormalization Strategies and Read-Write Performance Trade-offs', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/denormalization-in-databases/' },
  { id: 615, title: 'Indexes: B-Tree and B+ Tree Indexing Structures', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/difference-between-b-tree-and-b-tree/' },
  { id: 616, title: 'Advanced Indexes: Hash, GiST, GIN, and Bitmap Indexes', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/bitmap-indexing-in-dbms/' },
  { id: 617, title: 'Query Execution Plans, Cost-based Optimizers, and EXPLAIN command usage', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/query-optimization-in-dbms/' },
  { id: 618, title: 'ACID Properties and Transaction Life Cycle states', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/acid-properties-in-dbms/' },
  { id: 619, title: 'Concurrency Control: Shared (S) locks, Exclusive (X) locks, and Intent locks', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/lock-based-concurrency-control-protocol-in-dbms/' },
  { id: 620, title: 'Two-Phase Locking (2PL), Strict 2PL, and Rigorous 2PL protocols', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/two-phase-locking-protocol/' },
  { id: 621, title: 'Transaction Isolation Levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/transaction-isolation-levels-dbms/' },
  { id: 622, title: 'Concurrency Anomalies: Dirty Reads, Non-repeatable Reads, Phantom Reads, and Write Skew', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/concurrency-problems-in-dbms-transactions/' },
  { id: 623, title: 'Multi-Version Concurrency Control (MVCC) implementation in PostgreSQL/MySQL', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/multi-version-concurrency-control-mvcc/' },
  { id: 624, title: 'Deadlocks: Detection, Prevention (Wait-Die / Wound-Wait), and Resolution', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/deadlock-in-dbms/' },
  { id: 625, title: 'Write-Ahead Logging (WAL) and ARIES Database Recovery algorithm', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/aries-recovery-algorithm-in-dbms/' },
  { id: 626, title: 'Database View vs Materialized View update strategies', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/difference-between-views-and-materialized-views/' },
  { id: 627, title: 'Stored Procedures, User-Defined Functions, and Triggers', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/stored-procedures-and-triggers-in-sql/' },
  { id: 628, title: 'Full-Text Search Indexing, Tokenizers, and Document vectors', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/what-is-full-text-search/' },
  { id: 629, title: 'Database Connection Pooling and Driver performance tuning', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/what-is-database-connection-pooling/' },
  { id: 630, title: 'Database Replication topologies: Master-Replica and Multi-Master systems', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/data-replication-in-dbms/' },
  { id: 631, title: 'Consensus in Distributed Databases: Paxos and Raft protocols', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/consensus-algorithms-paxos-and-raft/' },
  { id: 632, title: 'Database Sharding, Hash Partitioning, and Range Partitioning designs', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/database-sharding-a-system-design-concept/' },
  { id: 633, title: 'CAP Theorem and Distributed Database trade-offs', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/the-cap-theorem-in-dbms/' },
  { id: 634, title: 'PACELC Theorem: Latency vs Consistency trade-offs under partition and normal states', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/pacelc-theorem-in-distributed-systems/' },
  { id: 635, title: 'Introduction to NoSQL categories: Key-Value, Document, Wide-Column, Graph', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/introduction-to-nosql/' },
  { id: 636, title: 'Document Databases: MongoDB CRUD, Indexes, and Aggregation framework', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/mongodb-introduction/' },
  { id: 637, title: 'Key-Value Stores: Redis data structures, memory eviction, and replication', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/redis-introduction/' },
  { id: 638, title: 'Wide-Column Stores: Cassandra storage model, LSM-Trees, and CQL', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/apache-cassandra-introduction/' },
  { id: 639, title: 'Graph Databases: Neo4j Cypher queries, nodes, and relationships model', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/introduction-to-neo4j-and-graph-databases/' },
  { id: 640, title: 'Consistent Hashing and Distributed Hash Tables (DHT)', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/consistent-hashing/' },
  { id: 641, title: 'Dynamo Paper Architecture: Gossip Protocol, Sloppy Quorums, and Hinted Handoff', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/dynamo-a-distributed-key-value-storage-system/' },
  { id: 642, title: 'Eventual Consistency, Conflict-free Replicated Data Types (CRDTs), and Vector Clocks', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/eventual-consistency-in-distributed-systems/' },
  { id: 643, title: 'Time-Series Databases: InfluxDB and Prometheus storage layout', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/time-series-database/' },
  { id: 644, title: 'Vector Databases: Milvus, Pinecone, pgvector and HNSW search indexing', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/vector-database/' },
  { id: 645, title: 'Search Engines: Elasticsearch Inverted Index and Shard allocation', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/elasticsearch-introduction/' },
  { id: 646, title: 'Object-Relational Mapping (ORM) vs Query Builders vs Raw SQL performance', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/orm-object-relational-mapping/' },
  { id: 647, title: 'Database Migrations and Schema evolution best practices', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/database-migration/' },
  { id: 648, title: 'Database Caching Patterns: Cache-Aside, Write-Through, Write-Behind', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/caching-system-design-concept/' },
  { id: 650, title: 'Distributed Transactions: Two-Phase Commit (2PC) vs Saga pattern', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/two-phase-commit-protocol/' },
  { id: 651, title: 'Database Backups: Logical vs Physical backups and Point-in-Time Recovery (PITR)', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/types-of-database-backups/' }
];

export default function DatabasesQuestionsPage() {
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 min-h-screen">
      <Navbar />
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Roadmaps Hub
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Databases (SQL & NoSQL)</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Foundational relational concepts, transaction concurrency control, execution plan tuning, sharding, replication, and NoSQL datastore paradigms.
            </p>
          </div>
        </div>

        <QuestionsTable
          questions={databasesQuestions}
          storagePrefix="databases"
          searchPlaceholder="Search database topics..."
        />
      </div>
    </div>
  );
}
