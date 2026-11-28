import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRIVADAS = ["/panel", "/mis-citas", "/cuenta"];

/**
 * Content Security Policy con nonce por request (RNF-08). Next agrega el nonce a sus
 * scripts al leerlo del encabezado. Los estilos en línea (style="...") se permiten solo
 * como atributo, porque la agenda posiciona bloques con top/height calculados.
 */
function politicaSeguridad(nonce: string) {
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = politicaSeguridad(nonce);
  // El layout usa la ruta para decidir si muestra la cabecera pública o el panel.
  request.headers.set("x-ruta", request.nextUrl.pathname);
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(lista) {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          response.headers.set("Content-Security-Policy", csp);
          lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refresca la sesión. No poner código entre createServerClient y getClaims.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims);

  const ruta = request.nextUrl.pathname;
  if (!conSesion && PRIVADAS.some((p) => ruta === p || ruta.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = `?siguiente=${encodeURIComponent(ruta + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  response.headers.set("Content-Security-Policy", csp);
  // Las páginas privadas no se guardan en cachés compartidas ni en el historial del navegador.
  if (conSesion) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
