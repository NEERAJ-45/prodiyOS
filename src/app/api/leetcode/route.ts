import { NextResponse } from "next/server";

const LC_GRAPHQL = "https://leetcode.com/graphql";

const QUERY = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    title
    content
    difficulty
    topicTags { name }
  }
}
`;

async function fetchDescription(slug: string): Promise<string | null> {
  try {
    const res = await fetch(LC_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: QUERY,
        variables: { titleSlug: slug },
      }),
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json?.data?.question?.content ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const content = await fetchDescription(slug);

  if (!content) {
    return NextResponse.json(
      { error: "Failed to fetch description" },
      { status: 404 }
    );
  }

  return NextResponse.json({ content });
}
