import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Server-side Supabase client. Uses the SERVICE ROLE key (not the anon
// key) because this route reads/writes without a logged-in Supabase user
// and needs to bypass Row Level Security. Never expose the service role
// key to the browser — it only belongs in server env vars.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const TABLE = "submissions";

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
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, title, link, story } = body ?? {};

    if (!name?.trim() || !email?.trim() || !title?.trim() || !story?.trim()) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    const { error } = await supabase.from(TABLE).insert({
      name: String(name).trim(),
      email: String(email).trim(),
      title: String(title).trim(),
      link: link ? String(link).trim() : "",
      story: String(story).trim(),
    });

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
    }

    // Also email a copy via Web3Forms, if configured.
    if (WEB3FORMS_ACCESS_KEY) {
      try {
        await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: `Invention submission: ${title}`,
            from_name: "Second Draft — invention submissions",
            name,
            email,
            invention: title,
            link: link || "—",
            story,
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

  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured on the server." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, email, title, link, story, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase select error:", error.message);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }

  const submissions: Submission[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    title: row.title,
    link: row.link ?? "",
    story: row.story,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ success: true, submissions });
}
