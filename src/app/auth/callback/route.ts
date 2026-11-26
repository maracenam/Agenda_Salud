import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { rutaSegura } from "@/lib/redir";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const siguiente = rutaSegura(url.searchParams.get("siguiente"), "");
  if (code) {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const rol = data.user?.user_metadata?.rol;
      const destino = siguiente || (rol === "profesional" ? "/panel/perfil" : "/profesionales");
      return NextResponse.redirect(new URL(destino, url.origin));
    }
  }
  return NextResponse.redirect(
    new URL("/ingresar?error=" + encodeURIComponent("El enlace no es válido o expiró. Ingresa con tu email y contraseña."), url.origin),
  );
}
