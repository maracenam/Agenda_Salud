import "server-only";
import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Especialidad = { id: number; nombre: string; slug: string; profesion: string; descripcion: string | null };

/** Catálogo de especialidades activas, en el orden del catálogo (CU-02). */
export const cargarEspecialidades = cache(async (): Promise<Especialidad[]> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("especialidades")
    .select("id, nombre, slug, profesion, descripcion")
    .eq("activa", true)
    .order("orden")
    .order("id");
  return (data ?? []) as Especialidad[];
});

export type Pro = {
  id: string;
  titulo: string | null;
  registro_sis: string | null;
  bio: string | null;
  direccion: string | null;
  comuna: string | null;
  nombre: string;
  telefono_consulta: string | null;
  especialidad: Especialidad | null;
  servicios: { id: string; nombre: string; descripcion: string | null; duracion_min: number; precio: number | null; activo: boolean }[];
  horarios: { dia_semana: number; hora_inicio: string; hora_fin: string }[];
};

export async function cargarProfesional(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("profesionales")
    .select("id, nombre, telefono_consulta, titulo, registro_sis, bio, direccion, comuna, especialidad:especialidades(id, nombre, slug, profesion, descripcion), servicios(id, nombre, descripcion, duracion_min, precio, activo), horarios(dia_semana, hora_inicio, hora_fin)")
    .eq("id", id)
    .maybeSingle();
  return data as unknown as Pro | null;
}

