import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

const LIST_KEY = "second-draft:submissions";

// Where Web3Forms should email a copy of every submission.
// Get a free access key at https://web3forms.com (enter your email, key
// arrives instantly) and set it as WEB3FORMS_ACCESS_KEY in your Vercel
// project's Environment Variables — do NOT hardcode it here.
const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY;

// Set this in Vercel's Environment Variables too. Whoever knows this
// password can view all submissions at /admin.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

type Submission = {
  id: string;
  name: string;
  email: string;
  title: string;
  link: string;
  story: string;
  createdAt: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, title, link, story } = body ?? {};

    if (!name?.trim() || !email?.trim() || !title?.trim() || !story?.trim()) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    const submission: Submission = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: String(email).trim(),
      title: String(title).trim(),
      link: link ? String(link).trim() : "",
      story: String(story).trim(),
      createdAt: new Date().toISOString(),
    };

    // Save to Vercel KV so it shows up on /admin.
    await kv.lpush(LIST_KEY, JSON.stringify(submission));

    // Also email a copy via Web3Forms, if configured.
    if (WEB3FORMS_ACCESS_KEY) {
      try {
        await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: `Invention submission: ${submission.title}`,
            from_name: "Second Draft — invention submissions",
            name: submission.name,
            email: submission.email,
            invention: submission.title,
            link: submission.link || "—",
            story: submission.story,
          }),
        });
      } catch {
        // Storage already succeeded — don't fail the request just because
        // the email copy didn't send.
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, message: "ADMIN_PASSWORD is not configured on the server." },
      { status: 500 }
    );
  }

  const password = req.headers.get("x-admin-password");
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, message: "Incorrect password." }, { status: 401 });
  }

  const raw = await kv.lrange(LIST_KEY, 0, -1);
  const submissions: Submission[] = raw
    .map((item) => {
      try {
        return JSON.parse(item as string) as Submission;
      } catch {
        return null;
      }
    })
    .filter((s): s is Submission => s !== null);

  return NextResponse.json({ success: true, submissions });
}
