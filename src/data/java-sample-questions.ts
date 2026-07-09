export const javaSampleQuestions = {
  "title": "Java Interview Preparation - 150 Questions (Basics to Advanced)",
  "total_questions": 150,
  "sections": [
    {
      "section": 1,
      "title": "Java Basics & OOP",
      "questions": [
        {
          "id": 1,
          "question": "What are the main features of Java (platform independence, OOP, robust, etc.)?",
          "answer": "Compiled to bytecode, runs on JVM → \"write once, run anywhere\"; also OOP, multithreaded, automatic memory management."
        },
        {
          "id": 2,
          "question": "JDK vs JRE vs JVM — difference?",
          "answer": "JVM runs bytecode; JRE = JVM + libraries to run apps; JDK = JRE + compiler/dev tools."
        },
        {
          "id": 3,
          "question": "What is the difference between `==` and `.equals()`?",
          "answer": "`==` compares references (memory address) for objects, values for primitives; `.equals()` compares content (if overridden)."
        },
        {
          "id": 4,
          "question": "Explain the four pillars of OOP.",
          "answer": "Encapsulation, Abstraction, Inheritance, Polymorphism."
        },
        {
          "id": 5,
          "question": "Difference between method overloading and overriding.",
          "answer": "Overloading: same name, different params, compile-time (static) binding. Overriding: same signature in subclass, runtime (dynamic) binding."
        },
        {
          "id": 6,
          "question": "What is constructor overloading? Can constructors be overridden?",
          "answer": "Multiple constructors with different params; constructors cannot be overridden, only overloaded."
        },
        {
          "id": 7,
          "question": "Why is Java not 100% object-oriented?",
          "answer": "Because it uses primitive data types (int, char, etc.) which are not objects."
        },
        {
          "id": 8,
          "question": "What is the difference between abstract class and interface?",
          "answer": "Abstract class can have state + constructors + partial implementation; interface (pre-Java 8) only abstract methods, now can have default/static methods; a class can implement multiple interfaces but extend only one class."
        },
        {
          "id": 9,
          "question": "Can an interface extend another interface? Can it extend multiple?",
          "answer": "Yes, and yes — interfaces support multiple inheritance of type."
        },
        {
          "id": 10,
          "question": "What is polymorphism? Compile-time vs runtime polymorphism.",
          "answer": "Compile-time = overloading; Runtime = overriding via dynamic method dispatch."
        },
        {
          "id": 11,
          "question": "What is encapsulation and how is it achieved?",
          "answer": "Wrapping data + methods together; achieved via private fields + public getters/setters."
        },
        {
          "id": 12,
          "question": "What is the `super` keyword used for?",
          "answer": "Access parent class constructor, methods, or fields."
        },
        {
          "id": 13,
          "question": "What is the `this` keyword used for?",
          "answer": "Refers to current instance; resolves naming conflicts, chains constructors."
        },
        {
          "id": 14,
          "question": "What is a static keyword? Static variable vs instance variable?",
          "answer": "Static belongs to class (shared across instances); instance variable belongs to each object separately."
        },
        {
          "id": 15,
          "question": "Can we override static methods?",
          "answer": "No — static methods are hidden, not overridden (no dynamic dispatch); this is called method hiding."
        },
        {
          "id": 16,
          "question": "What is the `final` keyword — variable, method, class?",
          "answer": "final variable = constant; final method = cannot override; final class = cannot extend (e.g., String)."
        },
        {
          "id": 17,
          "question": "What is a constructor? Default constructor?",
          "answer": "Special method to initialize objects; default constructor auto-provided by compiler if none defined."
        },
        {
          "id": 18,
          "question": "Difference between instance initializer block and static block.",
          "answer": "Static block runs once when class loads; instance block runs every time an object is created (before constructor)."
        },
        {
          "id": 19,
          "question": "What is the difference between `String`, `StringBuilder`, and `StringBuffer`?",
          "answer": "String is immutable; StringBuilder is mutable & not thread-safe (fast); StringBuffer is mutable & thread-safe (synchronized)."
        },
        {
          "id": 20,
          "question": "Why is String immutable in Java?",
          "answer": "Security, caching (String pool), thread-safety, and hashcode caching for use in HashMap/HashSet."
        },
        {
          "id": 21,
          "question": "What is the String pool (String constant pool)?",
          "answer": "Special memory region in heap where String literals are stored/reused to save memory."
        },
        {
          "id": 22,
          "question": "Difference between `new String(\"abc\")` and `\"abc\"`.",
          "answer": "Literal reuses pool reference; `new String()` always creates a new object on heap."
        },
        {
          "id": 23,
          "question": "What are wrapper classes? What is autoboxing/unboxing?",
          "answer": "Wrapper classes (Integer, Double, etc.) wrap primitives into objects; autoboxing = primitive→object automatically; unboxing = object→primitive."
        },
        {
          "id": 24,
          "question": "What is the difference between checked and unchecked exceptions?",
          "answer": "Checked = must be handled/declared (IOException); Unchecked = RuntimeException subclasses, not enforced at compile time."
        },
        {
          "id": 25,
          "question": "What is the difference between an array and an ArrayList?",
          "answer": "Array is fixed size, can hold primitives; ArrayList is resizable, holds only objects, part of Collections framework."
        }
      ]
    },
    {
      "section": 2,
      "title": "Exception Handling",
      "questions": [
        {
          "id": 26,
          "question": "What is the exception hierarchy in Java (Throwable → Error/Exception)?",
          "answer": "Throwable → Error (JVM-level, unrecoverable) and Exception (checked/unchecked)."
        },
        {
          "id": 27,
          "question": "Difference between `throw` and `throws`.",
          "answer": "`throw` actually throws an exception instance; `throws` declares exceptions a method might throw."
        },
        {
          "id": 28,
          "question": "What is try-with-resources?",
          "answer": "Auto-closes resources (implementing `AutoCloseable`) at end of try block, avoiding manual `finally` cleanup."
        },
        {
          "id": 29,
          "question": "Can we have a try block without catch, only finally?",
          "answer": "Yes, `try-finally` is valid."
        },
        {
          "id": 30,
          "question": "What happens if an exception occurs inside a `finally` block?",
          "answer": "It overrides/suppresses any exception from the try block unless handled properly."
        },
        {
          "id": 31,
          "question": "What is a custom exception? How do you create one?",
          "answer": "Extend `Exception` or `RuntimeException` and add custom constructors/messages."
        },
        {
          "id": 32,
          "question": "Difference between `Error` and `Exception`.",
          "answer": "Error = serious JVM issues (OutOfMemoryError) not meant to be caught; Exception = recoverable application-level issues."
        },
        {
          "id": 33,
          "question": "What is exception chaining?",
          "answer": "Wrapping one exception inside another using constructors that accept a `cause`, preserving the original stack trace."
        },
        {
          "id": 34,
          "question": "Can `finally` block be skipped?",
          "answer": "Yes, if JVM exits via `System.exit()` or the thread is killed."
        },
        {
          "id": 35,
          "question": "What is multi-catch in Java 7+?",
          "answer": "`catch (IOException | SQLException e)` — handle multiple exception types in a single block."
        }
      ]
    },
    {
      "section": 3,
      "title": "Collections Framework",
      "questions": [
        {
          "id": 36,
          "question": "What is the Collections Framework hierarchy? (Collection vs Map)",
          "answer": "Collection interface → List, Set, Queue; Map is separate (key-value), not part of Collection interface."
        },
        {
          "id": 37,
          "question": "Difference between `List`, `Set`, and `Map`.",
          "answer": "List: ordered, allows duplicates. Set: no duplicates. Map: key-value pairs, unique keys."
        },
        {
          "id": 38,
          "question": "Difference between `ArrayList` and `LinkedList`.",
          "answer": "ArrayList: dynamic array, fast random access O(1), slow insert/delete in middle O(n). LinkedList: doubly linked list, fast insert/delete O(1), slow access O(n)."
        },
        {
          "id": 39,
          "question": "Difference between `HashSet`, `LinkedHashSet`, `TreeSet`.",
          "answer": "HashSet: no order, O(1) ops. LinkedHashSet: insertion order maintained. TreeSet: sorted order, O(log n) ops (Red-Black tree)."
        },
        {
          "id": 40,
          "question": "Difference between `HashMap`, `LinkedHashMap`, `TreeMap`.",
          "answer": "HashMap: no order. LinkedHashMap: insertion order. TreeMap: sorted by key (NavigableMap, Red-Black tree)."
        },
        {
          "id": 41,
          "question": "How does `HashMap` work internally?",
          "answer": "Uses array of buckets; key's hashCode() determines bucket index; collisions handled via linked list (or tree if >8 entries, Java 8+)."
        },
        {
          "id": 42,
          "question": "What is the load factor and initial capacity in `HashMap`?",
          "answer": "Default capacity 16, load factor 0.75 → resizes (doubles) when size exceeds capacity × load factor."
        },
        {
          "id": 43,
          "question": "What happens when two keys have the same hashCode but are not equal?",
          "answer": "They land in the same bucket (collision) but are stored separately in a linked list/tree; `equals()` distinguishes them."
        },
        {
          "id": 44,
          "question": "Why must you override both `equals()` and `hashCode()` together?",
          "answer": "To maintain the contract: equal objects must have equal hash codes, otherwise HashMap/HashSet behave incorrectly."
        },
        {
          "id": 45,
          "question": "How does `HashMap` handle collisions (Java 8 improvement)?",
          "answer": "Uses linked list by default; converts to a balanced tree (Red-Black tree) when a bucket has ≥8 entries for better worst-case performance (O(log n) instead of O(n))."
        },
        {
          "id": 46,
          "question": "Is `HashMap` thread-safe? What are the alternatives?",
          "answer": "No. Alternatives: `ConcurrentHashMap`, `Collections.synchronizedMap()`, or `Hashtable` (legacy)."
        },
        {
          "id": 47,
          "question": "How does `ConcurrentHashMap` achieve thread safety without locking the whole map?",
          "answer": "Uses segment/bucket-level locking (Java 7) or CAS + synchronized blocks on bins (Java 8+), allowing concurrent reads and segmented writes."
        },
        {
          "id": 48,
          "question": "Difference between `Iterator` and `ListIterator`.",
          "answer": "Iterator: forward-only, works on all Collections. ListIterator: bidirectional, works only on List, supports add/set."
        },
        {
          "id": 49,
          "question": "What is `ConcurrentModificationException` and how to avoid it?",
          "answer": "Thrown when a collection is structurally modified while iterating; avoid using `Iterator.remove()`, `CopyOnWriteArrayList`, or `ConcurrentHashMap`."
        },
        {
          "id": 50,
          "question": "Difference between `Comparable` and `Comparator`.",
          "answer": "Comparable: defines natural ordering, `compareTo()`, implemented by the class itself. Comparator: external, custom ordering via `compare()`, allows multiple sort strategies."
        },
        {
          "id": 51,
          "question": "How do you sort a list of custom objects?",
          "answer": "Implement `Comparable` (natural order) or pass a `Comparator` to `Collections.sort()` / `list.sort()`."
        },
        {
          "id": 52,
          "question": "What is the difference between `Queue` and `Deque`?",
          "answer": "Queue: FIFO, single-ended. Deque: double-ended, can act as both stack (LIFO) and queue (FIFO)."
        },
        {
          "id": 53,
          "question": "What is `PriorityQueue`? How is ordering determined?",
          "answer": "A heap-based queue where elements are ordered by natural ordering or a given Comparator; head is always the smallest (or highest priority)."
        },
        {
          "id": 54,
          "question": "Difference between `Stack` class and `Deque` used as a stack.",
          "answer": "`Stack` is legacy, synchronized (slower); `ArrayDeque` is preferred, faster, not synchronized."
        },
        {
          "id": 55,
          "question": "What is fail-fast vs fail-safe iterators?",
          "answer": "Fail-fast (ArrayList, HashMap) throw ConcurrentModificationException on structural change. Fail-safe (CopyOnWriteArrayList, ConcurrentHashMap) iterate over a clone/snapshot, no exception."
        },
        {
          "id": 56,
          "question": "What is `CopyOnWriteArrayList`? When to use it?",
          "answer": "Thread-safe List variant that copies the underlying array on every write; ideal for read-heavy, write-rare scenarios."
        },
        {
          "id": 57,
          "question": "Difference between `Vector` and `ArrayList`.",
          "answer": "Vector is synchronized (legacy, slower); ArrayList is not synchronized (faster, preferred)."
        },
        {
          "id": 58,
          "question": "What is `Collections.unmodifiableList()` vs `List.of()`?",
          "answer": "unmodifiableList wraps an existing (still mutable underneath) list as a read-only view; `List.of()` creates a truly immutable list (Java 9+)."
        },
        {
          "id": 59,
          "question": "What is the difference between `Arrays.asList()` and `List.of()`?",
          "answer": "`Arrays.asList()` returns a fixed-size (not immutable) list backed by the array — can `set()` but not `add/remove`. `List.of()` is fully immutable."
        },
        {
          "id": 60,
          "question": "How do you make a Collection thread-safe?",
          "answer": "`Collections.synchronizedList/Map/Set()`, or use concurrent collections (ConcurrentHashMap, CopyOnWriteArrayList)."
        },
        {
          "id": 61,
          "question": "What is `NavigableMap` / `NavigableSet`?",
          "answer": "Extends SortedMap/SortedSet with navigation methods like `floor()`, `ceiling()`, `higher()`, `lower()`."
        },
        {
          "id": 62,
          "question": "How do you remove duplicates from a List?",
          "answer": "Convert to a `Set` (e.g., `new LinkedHashSet<>(list)`) or use Streams `.distinct()`."
        },
        {
          "id": 63,
          "question": "What is the default capacity of `ArrayList` and how does it grow?",
          "answer": "Default capacity 10; grows by 1.5x (new = old + old/2) when full."
        },
        {
          "id": 64,
          "question": "Difference between `Iterable` and `Iterator`.",
          "answer": "Iterable: has `iterator()` method, represents something that \"can be iterated\" (used in for-each). Iterator: actually performs iteration with `hasNext()`/`next()`."
        },
        {
          "id": 65,
          "question": "What is `EnumMap` / `EnumSet`?",
          "answer": "Specialized Map/Set implementations for enum keys, highly efficient (backed by arrays internally)."
        },
        {
          "id": 66,
          "question": "How does `TreeMap` maintain sorted order internally?",
          "answer": "Implemented as a Red-Black self-balancing binary search tree."
        },
        {
          "id": 67,
          "question": "What is the time complexity of common operations in `ArrayList` vs `LinkedList` vs `HashMap`?",
          "answer": "ArrayList: get O(1), add/remove middle O(n). LinkedList: get O(n), add/remove at ends O(1). HashMap: get/put O(1) average."
        },
        {
          "id": 68,
          "question": "What is `Collections.synchronizedList()` and its limitation?",
          "answer": "Wraps list with synchronized methods, but iteration still needs manual synchronization (external locking) to avoid ConcurrentModificationException."
        },
        {
          "id": 69,
          "question": "Explain the diamond problem and how Java interfaces solve it (default methods).",
          "answer": "If two interfaces have same default method, implementing class must override to resolve ambiguity explicitly."
        },
        {
          "id": 70,
          "question": "What's new in Java Collections since Java 9 (`List.of()`, `Set.of()`, `Map.of()`)?",
          "answer": "Immutable factory methods for quick, compact collection creation."
        }
      ]
    },
    {
      "section": 4,
      "title": "Generics",
      "questions": [
        {
          "id": 71,
          "question": "What are Generics and why are they used?",
          "answer": "Enable type-safety at compile time and eliminate need for explicit casting; e.g., `List<String>` instead of raw `List`."
        },
        {
          "id": 72,
          "question": "What is type erasure in Java Generics?",
          "answer": "Generic type info is removed at compile time and replaced with bounds/Object — generics exist only at compile-time, not runtime."
        },
        {
          "id": 73,
          "question": "What are bounded type parameters (`<T extends Number>`)?",
          "answer": "Restrict generic type to a specific class/subclass or interface implementers."
        },
        {
          "id": 74,
          "question": "Difference between `<? extends T>` and `<? super T>` (PECS principle).",
          "answer": "\"Producer Extends, Consumer Super\" — use `extends` when reading (producing) values, `super` when writing (consuming) values."
        },
        {
          "id": 75,
          "question": "Can we create a generic array in Java? Why or why not?",
          "answer": "No, due to type erasure — arrays need runtime type info which generics don't retain, causing potential heap pollution."
        },
        {
          "id": 76,
          "question": "What is a wildcard `?` in generics?",
          "answer": "Represents an unknown type, used when exact type isn't important, e.g., `List<?>`."
        },
        {
          "id": 77,
          "question": "Can generic methods have different type parameters than the class?",
          "answer": "Yes, a generic method can define its own type parameter independent of the class's generic type."
        },
        {
          "id": 78,
          "question": "Why can't we use primitive types with Generics (e.g., `List<int>`)?",
          "answer": "Generics work only with objects due to type erasure; must use wrapper classes (`List<Integer>`)."
        },
        {
          "id": 79,
          "question": "What is raw type usage and why is it discouraged?",
          "answer": "Using a generic class without specifying type (e.g., `List list`) — loses type safety, generates compiler warnings."
        },
        {
          "id": 80,
          "question": "What is a generic interface? Give an example.",
          "answer": "An interface with type parameters, e.g., `Comparable<T>`, `Comparator<T>`."
        }
      ]
    },
    {
      "section": 5,
      "title": "Multithreading & Concurrency",
      "questions": [
        {
          "id": 81,
          "question": "Difference between process and thread.",
          "answer": "Process: independent execution unit with own memory. Thread: lightweight sub-unit within a process, shares memory."
        },
        {
          "id": 82,
          "question": "How do you create a thread in Java (two ways)?",
          "answer": "Extend `Thread` class and override `run()`, or implement `Runnable` and pass to `Thread`."
        },
        {
          "id": 83,
          "question": "Difference between `Runnable` and `Callable`.",
          "answer": "Runnable: no return value, can't throw checked exceptions. Callable: returns a value (`Future<T>`), can throw checked exceptions."
        },
        {
          "id": 84,
          "question": "What is the difference between `start()` and `run()` method?",
          "answer": "`start()` creates a new thread and calls run() on it; calling `run()` directly executes on the current thread (no concurrency)."
        },
        {
          "id": 85,
          "question": "What is synchronization? Why is it needed?",
          "answer": "Mechanism to control access to shared resources by multiple threads, preventing race conditions."
        },
        {
          "id": 86,
          "question": "Difference between synchronized method and synchronized block.",
          "answer": "Method locks entire method (this or class object); block allows locking only a critical section on any specified object, giving finer control."
        },
        {
          "id": 87,
          "question": "What is a deadlock? How can it be avoided?",
          "answer": "Two or more threads waiting on each other's locks forever; avoid via lock ordering, timeouts, or using `tryLock()`."
        },
        {
          "id": 88,
          "question": "What is the difference between `wait()`, `notify()`, and `notifyAll()`?",
          "answer": "`wait()` releases lock and pauses thread; `notify()` wakes one waiting thread; `notifyAll()` wakes all waiting threads — all must be called within synchronized context."
        },
        {
          "id": 89,
          "question": "What is the volatile keyword?",
          "answer": "Ensures visibility of changes to a variable across threads by preventing caching in thread-local memory/registers."
        },
        {
          "id": 90,
          "question": "Difference between `volatile` and `synchronized`.",
          "answer": "volatile ensures visibility only (no atomicity for compound actions); synchronized ensures both visibility and atomicity/mutual exclusion."
        },
        {
          "id": 91,
          "question": "What is the Java Memory Model (JMM)?",
          "answer": "Defines how threads interact through memory and what behavior is allowed regarding visibility, ordering, and atomicity."
        },
        {
          "id": 92,
          "question": "What is `ExecutorService`? Why use it over creating threads manually?",
          "answer": "A framework to manage a pool of threads, reuse them, and manage task submission/lifecycle efficiently instead of manual thread creation."
        },
        {
          "id": 93,
          "question": "Difference between `Executors.newFixedThreadPool()` and `newCachedThreadPool()`.",
          "answer": "Fixed: fixed number of reusable threads. Cached: creates new threads as needed, reuses idle ones, unbounded — good for many short-lived tasks."
        },
        {
          "id": 94,
          "question": "What is a `Future` and how is it used?",
          "answer": "Represents the result of an asynchronous computation; `.get()` blocks until result is available."
        },
        {
          "id": 95,
          "question": "What is `CompletableFuture`? How is it different from `Future`?",
          "answer": "Supports non-blocking, chainable async operations (`.thenApply`, `.thenCombine`) unlike plain `Future` which only allows blocking `.get()`."
        },
        {
          "id": 96,
          "question": "What is a thread pool and why is it useful?",
          "answer": "A managed group of reusable worker threads that reduces overhead of thread creation/destruction for many tasks."
        },
        {
          "id": 97,
          "question": "What are atomic classes (`AtomicInteger`, etc.)? How do they work?",
          "answer": "Provide lock-free, thread-safe operations on single variables using CAS (Compare-And-Swap) at hardware level."
        },
        {
          "id": 98,
          "question": "What is the difference between `CountDownLatch` and `CyclicBarrier`?",
          "answer": "CountDownLatch: one-time use, threads wait until count reaches zero. CyclicBarrier: reusable, threads wait for each other at a common barrier point."
        },
        {
          "id": 99,
          "question": "What are the different thread states in Java?",
          "answer": "NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED."
        },
        {
          "id": 100,
          "question": "What is thread starvation and thread priority?",
          "answer": "Starvation: a thread perpetually denied access to resources; priority can hint scheduler preference but isn't guaranteed across JVMs."
        }
      ]
    },
    {
      "section": 6,
      "title": "Java 8+ Features — Lambdas, Functional Interfaces, Streams",
      "questions": [
        {
          "id": 101,
          "question": "What is a lambda expression? Basic syntax?",
          "answer": "A concise way to represent an anonymous function: `(params) -> expression/body`; used to implement functional interfaces."
        },
        {
          "id": 102,
          "question": "What is a functional interface? Give examples.",
          "answer": "An interface with exactly one abstract method, e.g., `Runnable`, `Comparator`, `Function`, `Predicate`, `Supplier`, `Consumer`."
        },
        {
          "id": 103,
          "question": "`@FunctionalInterface` annotation used for?",
          "answer": "Compile-time check ensuring the interface has exactly one abstract method (optional but recommended)."
        },
        {
          "id": 104,
          "question": "Difference between `Predicate`, `Function`, `Consumer`, `Supplier`.",
          "answer": "Predicate: T→boolean. Function: T→R. Consumer: T→void. Supplier: ()→T."
        },
        {
          "id": 105,
          "question": "What is a method reference? Types of method references.",
          "answer": "Shorthand for lambdas calling an existing method: static (`Class::method`), instance (`obj::method`), constructor (`Class::new`)."
        },
        {
          "id": 106,
          "question": "What is the Stream API? Why was it introduced?",
          "answer": "A pipeline abstraction to process collections declaratively (functional style) — filter, map, reduce — enabling easier parallelism."
        },
        {
          "id": 107,
          "question": "Difference between intermediate and terminal operations in Streams.",
          "answer": "Intermediate (map, filter, sorted) are lazy and return a Stream; terminal (collect, forEach, reduce) trigger execution and produce a result."
        },
        {
          "id": 108,
          "question": "What is lazy evaluation in Streams?",
          "answer": "Intermediate operations aren't executed until a terminal operation is invoked, allowing optimization/short-circuiting."
        },
        {
          "id": 109,
          "question": "Difference between `map()` and `flatMap()`.",
          "answer": "map: transforms each element 1-to-1. flatMap: flattens nested structures (e.g., Stream<List<T>> → Stream<T>), 1-to-many."
        },
        {
          "id": 110,
          "question": "What is the difference between `Stream` and `Collection`?",
          "answer": "Collection stores data; Stream doesn't store data, it processes/computes on-demand and can only be consumed once."
        },
        {
          "id": 111,
          "question": "How do you create a Stream? Name a few sources.",
          "answer": "`collection.stream()`, `Stream.of()`, `Arrays.stream()`, `IntStream.range()`, `Stream.generate()`/`iterate()`."
        },
        {
          "id": 112,
          "question": "What is the difference between `Stream.of()` and `Stream.generate()`.",
          "answer": "`of()` creates a finite stream from given values; `generate()` creates a (potentially infinite) stream via a Supplier."
        },
        {
          "id": 113,
          "question": "What does `collect(Collectors.toList())` do?",
          "answer": "Terminal operation that gathers stream elements into a `List`."
        },
        {
          "id": 114,
          "question": "What is `Collectors.groupingBy()`? Give an example use case.",
          "answer": "Groups stream elements into a Map based on a classifier function, e.g., grouping employees by department."
        },
        {
          "id": 115,
          "question": "What is `Collectors.partitioningBy()`?",
          "answer": "Splits elements into a Map<Boolean, List<T>> based on a predicate (true/false groups)."
        },
        {
          "id": 116,
          "question": "Difference between `findFirst()` and `findAny()`.",
          "answer": "findFirst: returns the first element in encounter order (deterministic). findAny: returns any element, useful for parallel streams (non-deterministic, faster)."
        },
        {
          "id": 117,
          "question": "What is a parallel stream? When should you use it (and when not)?",
          "answer": "Splits stream processing across multiple threads (ForkJoinPool); use for large datasets with CPU-intensive, stateless operations — avoid for small data or I/O-bound/order-dependent tasks."
        },
        {
          "id": 118,
          "question": "What is `reduce()` in Streams? Give an example.",
          "answer": "Combines stream elements into a single result using an accumulator, e.g., `stream.reduce(0, Integer::sum)`."
        },
        {
          "id": 119,
          "question": "Difference between `Optional.of()`, `Optional.ofNullable()`, and `Optional.empty()`.",
          "answer": "`of()` throws NPE if null; `ofNullable()` allows null (wraps as empty Optional); `empty()` creates an empty Optional explicitly."
        },
        {
          "id": 120,
          "question": "Why was `Optional` introduced? What problem does it solve?",
          "answer": "To avoid `NullPointerException` by explicitly representing \"value may be absent,\" forcing callers to handle the empty case."
        },
        {
          "id": 121,
          "question": "What is short-circuiting in Streams? Give examples of short-circuit operations.",
          "answer": "Stops processing once a condition is met, without processing all elements — e.g., `anyMatch()`, `findFirst()`, `limit()`."
        },
        {
          "id": 122,
          "question": "Difference between `sorted()` with natural ordering vs custom Comparator in Streams.",
          "answer": "`sorted()` uses natural order (Comparable); `sorted(Comparator)` allows custom ordering logic."
        },
        {
          "id": 123,
          "question": "What is the difference between `Collectors.toMap()` pitfalls (duplicate keys)?",
          "answer": "Throws `IllegalStateException` on duplicate keys unless a merge function is provided as the third argument."
        },
        {
          "id": 124,
          "question": "How do default and static methods in interfaces work (Java 8)?",
          "answer": "Default methods provide a body so implementing classes don't have to override them; static methods belong to the interface itself, called via `InterfaceName.method()`."
        },
        {
          "id": 125,
          "question": "What is the diamond problem with default methods, and how is it resolved?",
          "answer": "When a class implements two interfaces with the same default method, it must override the method explicitly to resolve ambiguity, optionally calling `Interface.super.method()`."
        },
        {
          "id": 126,
          "question": "What is a `Supplier<T>` used for in real scenarios?",
          "answer": "Lazy generation of values, e.g., `Optional.orElseGet(supplier)`, or providing default/expensive-to-create objects only when needed."
        },
        {
          "id": 127,
          "question": "What is the difference between `peek()` and `forEach()`?",
          "answer": "`peek()` is an intermediate operation (for debugging, doesn't trigger execution alone); `forEach()` is terminal, actually consumes the stream."
        },
        {
          "id": 128,
          "question": "How would you convert a `List<String>` to a comma-separated `String` using Streams?",
          "answer": "`list.stream().collect(Collectors.joining(\", \"))`."
        },
        {
          "id": 129,
          "question": "What is the difference between `IntStream`, `DoubleStream`, `LongStream` and regular `Stream<T>`?",
          "answer": "Primitive-specialized streams avoid autoboxing overhead, and provide extra methods like `sum()`, `average()`, `range()`."
        },
        {
          "id": 130,
          "question": "What are the new Date-Time API classes introduced in Java 8 (`LocalDate`, `LocalDateTime`, `Duration`, etc.)?",
          "answer": "Immutable, thread-safe replacements for old `Date`/`Calendar`; e.g., `LocalDate` (date only), `LocalDateTime` (date+time), `Duration`/`Period` (time spans), `ZonedDateTime` (timezone-aware)."
        }
      ]
    },
    {
      "section": 7,
      "title": "JVM, Memory Management & Advanced Topics",
      "questions": [
        {
          "id": 131,
          "question": "Explain the JVM memory areas (Heap, Stack, Metaspace, PC Register).",
          "answer": "Heap: objects (shared). Stack: method frames/local vars (per-thread). Metaspace: class metadata (replaced PermGen in Java 8+). PC register: tracks current instruction per thread."
        },
        {
          "id": 132,
          "question": "What is Garbage Collection? Name common GC algorithms.",
          "answer": "Automatic memory management reclaiming unreachable objects; algorithms: Serial, Parallel, CMS, G1 GC, ZGC, Shenandoah."
        },
        {
          "id": 133,
          "question": "Difference between minor GC and major/full GC.",
          "answer": "Minor GC: cleans Young Generation (frequent, fast). Major/Full GC: cleans Old Generation (or entire heap), less frequent, more expensive."
        },
        {
          "id": 134,
          "question": "What is the difference between Young Generation and Old Generation in heap?",
          "answer": "Young Gen: newly created, short-lived objects (Eden + Survivor spaces). Old Gen: long-lived objects promoted after surviving multiple GC cycles."
        },
        {
          "id": 135,
          "question": "What causes a `StackOverflowError`?",
          "answer": "Excessive recursion or too many nested method calls exceeding stack size."
        },
        {
          "id": 136,
          "question": "What causes an `OutOfMemoryError`?",
          "answer": "Heap exhausted (too many live objects) or Metaspace full (too many loaded classes), and JVM cannot free enough memory."
        },
        {
          "id": 137,
          "question": "What are strong, weak, soft, and phantom references?",
          "answer": "Strong: normal ref, prevents GC. Soft: collected only when memory is low (good for caches). Weak: collected on next GC cycle if no strong ref exists (WeakHashMap). Phantom: used for post-mortem cleanup, always returns null on `get()`."
        },
        {
          "id": 138,
          "question": "What is class loading? Explain the three class loaders.",
          "answer": "Bootstrap (loads core JDK classes), Extension/Platform (loads ext libraries), Application/System (loads classpath classes) — follows delegation hierarchy model."
        },
        {
          "id": 139,
          "question": "What is the difference between compile-time and runtime polymorphism regarding JVM bytecode?",
          "answer": "Compile-time: resolved via static binding at compile time (overloading). Runtime: resolved via vtable/dynamic dispatch at runtime (overriding)."
        },
        {
          "id": 140,
          "question": "What is reflection in Java? Give a use case.",
          "answer": "API to inspect/modify classes, methods, fields at runtime — used in frameworks like Spring/Hibernate for dependency injection and ORM mapping."
        },
        {
          "id": 141,
          "question": "What is serialization? What is `serialVersionUID`?",
          "answer": "Converting an object into a byte stream for storage/transfer; `serialVersionUID` is a version identifier to ensure compatibility during deserialization."
        },
        {
          "id": 142,
          "question": "What is the difference between shallow copy and deep copy?",
          "answer": "Shallow copy: copies references to nested objects (shared state). Deep copy: recursively copies nested objects too (fully independent)."
        },
        {
          "id": 143,
          "question": "What is the Singleton design pattern? How do you implement a thread-safe Singleton?",
          "answer": "Ensures only one instance of a class exists; thread-safe via double-checked locking, static holder class, or enum singleton."
        },
        {
          "id": 144,
          "question": "What is the Builder pattern and why is it useful?",
          "answer": "Constructs complex objects step-by-step, avoiding telescoping constructors; commonly used with immutable objects."
        },
        {
          "id": 145,
          "question": "What is dependency injection?",
          "answer": "Design pattern where dependencies are provided (injected) externally rather than created internally, improving testability/decoupling."
        },
        {
          "id": 146,
          "question": "What is the difference between composition and inheritance (\"favor composition over inheritance\")?",
          "answer": "Composition: \"has-a\" relationship, more flexible, avoids tight coupling. Inheritance: \"is-a\" relationship, can lead to fragile base class issues."
        },
        {
          "id": 147,
          "question": "What is the difference between an abstract class and a marker interface (e.g., `Serializable`)?",
          "answer": "Marker interface has no methods, just tags a class with metadata for special handling (e.g., serialization eligibility); abstract class provides partial implementation."
        },
        {
          "id": 148,
          "question": "What is the `transient` keyword?",
          "answer": "Marks a field to be excluded from the serialization process."
        },
        {
          "id": 149,
          "question": "What is the difference between `equals()`/`hashCode()` contract and how records (Java 16+) simplify this?",
          "answer": "Contract: equal objects → equal hashcodes. Records auto-generate `equals()`, `hashCode()`, and `toString()` based on their components, reducing boilerplate."
        },
        {
          "id": 150,
          "question": "What are Sealed Classes (Java 17) and Pattern Matching (`instanceof`, switch)?",
          "answer": "Sealed classes restrict which classes can extend/implement them (`permits` clause); pattern matching simplifies type-checking + casting in `instanceof` and `switch` expressions."
        }
      ]
    }
  ]
};
