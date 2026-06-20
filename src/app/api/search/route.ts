import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ patterns: [], problems: [] });
    }

    const lower = query.toLowerCase();

    const res = await fetch(new URL("/api/patterns", request.url));
    const data = await res.json();

    const allPatterns: { id: string; name: string; slug: string }[] = [];
    const allProblems: {
      id: string;
      title: string;
      difficulty: string;
      pattern: { name: string; slug: string };
    }[] = [];

    for (const [key, pattern] of Object.entries(data.patterns) as [string, any][]) {
      const slug = key;
      if (pattern.name.toLowerCase().includes(lower) || key.replace(/-/g, " ").includes(lower)) {
        allPatterns.push({ id: key, name: pattern.name, slug });
      }
      for (const p of (pattern.easy as any[])) {
        if (p.title.toLowerCase().includes(lower)) {
          allProblems.push({ id: String(p.id), title: p.title, difficulty: "EASY", pattern: { name: pattern.name, slug } });
        }
      }
      for (const p of (pattern.medium as any[])) {
        if (p.title.toLowerCase().includes(lower)) {
          allProblems.push({ id: String(p.id), title: p.title, difficulty: "MEDIUM", pattern: { name: pattern.name, slug } });
        }
      }
      for (const p of (pattern.hard as any[])) {
        if (p.title.toLowerCase().includes(lower)) {
          allProblems.push({ id: String(p.id), title: p.title, difficulty: "HARD", pattern: { name: pattern.name, slug } });
        }
      }
    }

    return NextResponse.json({
      patterns: allPatterns.slice(0, 5),
      problems: allProblems.slice(0, 10),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
