import type { APIRoute } from "astro";
import { getEnvVariable } from "../../utils/envUtils";

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json();
  const { username, password } = body;

  const expectedUser = getEnvVariable("EDITOR_ADMIN");
  const expectedPassword = getEnvVariable("EDITOR_PASSWORD");

  if (username !== expectedUser || password !== expectedPassword) {
    return new Response(JSON.stringify({ error: "Ungültige Anmeldedaten" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = Buffer.from(`${username}:${password}`).toString("base64");

  cookies.set("editor-auth", token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
