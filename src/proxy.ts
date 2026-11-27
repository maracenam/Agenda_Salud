import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRIVADAS = ["/panel", "/mis-citas", "/cuenta"];

export async function proxy(request: NextRequest) {
  // El layout usa la ruta para decidir si muestra la cabecera pública o el panel.
  request.headers.set("x-ruta", request.nextUrl.pathname);
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
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
