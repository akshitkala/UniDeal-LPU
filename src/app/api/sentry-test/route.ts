import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    throw new Error("Sentry Server-Side Manual Exception: " + new Date().toISOString());
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "api-test" },
      extra: { method: "GET", path: "/api/sentry-test" }
    });
    return NextResponse.json({ message: "Sentry server-side exception captured. Check your Sentry dashboard." });
  }
}
