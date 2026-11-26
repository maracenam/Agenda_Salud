import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Pro = {
  id: string;
  titulo: string | null;
  registro_sis: string | null;
  bio: string | null;
  direccion: string | null;
  comuna: string | null;
  perfil: { nombre: string } | null;
  servicios: { id: string; nombre: string; descripcion: string | null; duracion_min: number; precio: number | null; activo: boolean }[];
  horarios: { dia_semana: number; hora_inicio: string; hora_fin: string }[];
};

export async function cargarProfesional(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("profesionales")
    .select("id, titulo, registro_sis, bio, direccion, comuna, perfil:perfiles!profesionales_id_fkey(nombre), servicios(id, nombre, descripcion, duracion_min, precio, activo), horarios(dia_semana, hora_inicio, hora_fin)")
    .eq("id", id)
    .maybeSingle();
  return data as unknown as Pro | null;
}

