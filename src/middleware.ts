import { defineMiddleware } from "astro:middleware";
import { getEnvVariable } from "./utils/envUtils";

const PUBLIC_PATHS = ["/login", "/api/login", "/api/logout"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return next();
  }

  const authCookie = context.cookies.get("editor-auth");
  if (!authCookie?.value) {
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return context.redirect("/login");
  }

  const expectedToken = Buffer.from(
    `${getEnvVariable("EDITOR_ADMIN")}:${getEnvVariable("EDITOR_PASSWORD")}`
  ).toString("base64");

  if (authCookie.value !== expectedToken) {
    context.cookies.delete("editor-auth");
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return context.redirect("/login");
  }

  return next();
});
