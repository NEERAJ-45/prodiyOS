export interface BookEntry {
  slug: string;
  title: string;
  category: string;
  path: string;
}

const books: BookEntry[] = [
  { slug: 'clean-code', title: 'Clean Code', category: '01-Foundations', path: '01-Foundations/clean-code.pdf' },
  { slug: 'effective-java', title: 'Effective Java (3rd Edition)', category: '01-Foundations', path: '01-Foundations/Effective Java (3rd Edition).pdf' },
  { slug: 'java-concurrency', title: 'Java Concurrency in Practice', category: '01-Foundations', path: '01-Foundations/Java Concurrency in Practice.pdf' },
  { slug: 'spring-boot', title: 'Spring Boot in Action', category: '01-Foundations', path: '01-Foundations/Spring Boot in Action.pdf' },
  { slug: 'postgresql-up-running', title: 'PostgreSQL Up & Running', category: '02-Distributed-Systems', path: '02-Distributed-Systems/002-OReilly.PostgreSQL.Up.and.Running.2nd.Edition.2014.12.pdf' },
  { slug: 'database-internals', title: 'Database Internals', category: '02-Distributed-Systems', path: '02-Distributed-Systems/Database Internals.pdf' },
  { slug: 'designing-data-intensive', title: 'Designing Data Intensive Applications', category: '02-Distributed-Systems', path: '02-Distributed-Systems/Designing Data Intensive Applications.pdf' },
  { slug: 'kafka-definitive-guide', title: 'Kafka: The Definitive Guide', category: '02-Distributed-Systems', path: '02-Distributed-Systems/Kafka The Definitive Guide Real-Time Data and Stream Processing at Scale, Second Edition by Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty (z-lib.org).pdf' },
  { slug: 'building-microservices', title: 'Building Microservices', category: '02-Distributed-Systems', path: '02-Distributed-Systems/Sam Newman-Building Microservices-O\'Reilly Media (2015).pdf' },
  { slug: 'domain-driven-design', title: 'Domain-Driven Design', category: '03-Architecture', path: '03-Architecture/Domain-Driven Design.pdf' },
  { slug: 'microservices-patterns', title: 'Microservices Patterns', category: '03-Architecture', path: '03-Architecture/Microservices.Patterns.Examples.Chris.Richardson.pdf' },
  { slug: 'patterns-enterprise-architecture', title: 'Patterns of Enterprise Application Architecture', category: '03-Architecture', path: '03-Architecture/Patterns of Enterprise Application Architecture.pdf' },
  { slug: 'system-design-interview', title: 'System Design Interview', category: '03-Architecture', path: '03-Architecture/SystemDesignInterview.pdf' },
  { slug: 'devops-handbook', title: 'DevOps Handbook', category: '04-Performance', path: '04-Performance/devops-handbook.pdf' },
  { slug: 'high-perf-mysql', title: 'High Performance MySQL', category: '04-Performance', path: '04-Performance/high-performance-mysql-4th.pdf' },
  { slug: 'site-reliability-engineering', title: 'Site Reliability Engineering', category: '04-Performance', path: '04-Performance/Site Reliability Engineering.pdf' },
  { slug: 'art-of-scalability', title: 'The Art of Scalability', category: '04-Performance', path: '04-Performance/The Art of Scalability.pdf' },
  { slug: 'advanced-unix-programming', title: 'Advanced Programming in the UNIX Environment', category: '05-Deep-Mastery', path: '05-Deep-Mastery/Advanced.Programming.in.the.UNIX.Environment.3rd.Edition.0321637739.pdf' },
  { slug: 'computer-systems-programmer-perspective', title: 'Computer Systems: A Programmer\'s Perspective', category: '05-Deep-Mastery', path: '05-Deep-Mastery/Computer Systems A Programmers Perspective 2nd Edition---Randal Bryant David Hallaron.pdf' },
  { slug: 'tcp-ip-illustrated', title: 'TCP/IP Illustrated Vol 1', category: '05-Deep-Mastery', path: '05-Deep-Mastery/Richard_Stevens-TCP-IP_Illustrated-EN.pdf' },
  { slug: 'tcp-ip-illustrated-vol3', title: 'TCP/IP Illustrated Vol 3', category: '05-Deep-Mastery', path: '05-Deep-Mastery/tcp_ip-illustrated-vol-3.pdf' },
  { slug: 'tcp-ip-illustrated-vol2', title: 'TCP/IP Illustrated Vol 2', category: '05-Deep-Mastery', path: '05-Deep-Mastery/TCP-IP-Illustrated-Volume-2-The-Implementation.pdf' },
  { slug: 'linux-programming-interface', title: 'The Linux Programming Interface', category: '05-Deep-Mastery', path: '05-Deep-Mastery/The Linux Programming Interface-Michael Kerrisk.pdf' },
  { slug: 'accelerate', title: 'Accelerate', category: '06-Meta-Learning', path: '06-Meta-Learning/Accelerate The Science of Lean Software and DevOps Building and Scaling High Performing Technology Organizations by Nicole Forsgren Jez Humble Gene Kim.pdf' },
  { slug: 'mythical-man-month', title: 'The Mythical Man-Month', category: '06-Meta-Learning', path: '06-Meta-Learning/Addison.Wesley.The.Mythical.Man-Month.Essays.on.Software.Engineering.20th.Anniversary.Edition.pdf' },
  { slug: 'thinking-fast-slow', title: 'Thinking, Fast and Slow', category: '06-Meta-Learning', path: '06-Meta-Learning/Daniel Kahneman-Thinking, Fast and Slow  .pdf' },
  { slug: 'pragmatic-programmer', title: 'The Pragmatic Programmer', category: '06-Meta-Learning', path: '06-Meta-Learning/the-pragmatic-programmer.pdf' },
  { slug: 'dsa-made-easy', title: 'Data Structures and Algorithms Made Easy in Java', category: '07-Others', path: '07-Others/Data Structures and Algorithms Made Easy in Java.pdf' },
  { slug: 'head-first-java', title: 'Head First Java', category: '07-Others', path: '07-Others/Head First Java.pdf' },
  { slug: 'java-complete-reference', title: 'Java: The Complete Reference', category: '07-Others', path: '07-Others/Java - The Complete Reference - 11 Edition.pdf' },
  { slug: 'java-8-in-action', title: 'Java 8 in Action', category: '07-Others', path: '07-Others/Java 8 in Action.pdf' },
  { slug: 'operating-systems-three-easy', title: 'Operating Systems: Three Easy Pieces', category: '07-Others', path: '07-Others/Operating Systems - Three Easy Pieces.pdf' },
  { slug: 'java-notes-part-1', title: 'Java Notes - Part 1', category: '07-Others', path: '07-Others/Java-Notes/JAVA NOTES/Part-1.pdf' },
  { slug: 'java-notes-part-2', title: 'Java Notes - Part 2', category: '07-Others', path: '07-Others/Java-Notes/JAVA NOTES/Part-2.pdf' },
];

export const categoryLabels: Record<string, string> = {
  '01-Foundations': 'Foundations',
  '02-Distributed-Systems': 'Distributed Systems',
  '03-Architecture': 'Architecture',
  '04-Performance': 'Performance',
  '05-Deep-Mastery': 'Deep Mastery',
  '06-Meta-Learning': 'Meta Learning',
  '07-Others': 'Others',
};

export default books;

export function getBookBySlug(slug: string): BookEntry | undefined {
  return books.find((b) => b.slug === slug);
}
