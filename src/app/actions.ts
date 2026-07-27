"use server";

import { refresh } from "next/cache";
import {
  BAR_NAME_MAX_LENGTH,
  barId,
  bars,
  extraBarId,
  isExtraId,
  slugify,
} from "@/data/bars";
import { isUnlocked } from "@/lib/auth";
import type { BarFormState, VisitFormState } from "@/lib/form-state";
import { PHOTO_BUCKET, requireSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { VOTE_MAX, VOTE_MIN } from "@/lib/visits";

const NOTE_MAX_LENGTH = 500;

const LOCKED_MESSAGE = "Desbloquea la app con la contraseña para poder editar.";

const UNKNOWN_BAR_MESSAGE = "Bar desconocido.";

/** Server Actions are public POST endpoints, so only known bar ids are accepted. */
const originalBarIds = new Set(bars.map(barId));

/**
 * Originals are checked against the bundled list; extras have to be looked up,
 * since they are created at runtime. Anything else is rejected outright.
 */
async function isKnownBar(
  supabase: SupabaseClient,
  id: string,
): Promise<boolean> {
  if (originalBarIds.has(id)) return true;
  if (!isExtraId(id)) return false;

  const { data } = await supabase
    .from("extra_bars")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  return data !== null;
}

export async function saveVisit(
  _prevState: VisitFormState,
  formData: FormData,
): Promise<VisitFormState> {
  // Checked on the server on every call: the client UI hiding the buttons is
  // cosmetic, this is what actually stops a stranger writing to the table.
  if (!(await isUnlocked())) {
    return { ok: false, error: LOCKED_MESSAGE };
  }

  const id = String(formData.get("barId") ?? "");

  try {
    const supabase = requireSupabase();

    if (!(await isKnownBar(supabase, id))) {
      return { ok: false, error: UNKNOWN_BAR_MESSAGE };
    }

    const photo = formData.get("photo");
    const removePhoto = formData.get("removePhoto") === "true";
    const currentPhotoPath = asText(formData.get("photoPath"));

    let photoPath = currentPhotoPath;

    if (photo instanceof File && photo.size > 0) {
      if (!photo.type.startsWith("image/")) {
        return { ok: false, error: "El archivo debe ser una imagen." };
      }

      const extension = photo.type === "image/png" ? "png" : "jpg";
      const uploadPath = `${id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(uploadPath, photo, {
          contentType: photo.type,
          upsert: true,
        });

      if (uploadError) {
        return { ok: false, error: `No se pudo subir la foto: ${uploadError.message}` };
      }

      photoPath = uploadPath;

      if (currentPhotoPath && currentPhotoPath !== uploadPath) {
        await supabase.storage.from(PHOTO_BUCKET).remove([currentPhotoPath]);
      }
    } else if (removePhoto) {
      if (currentPhotoPath) {
        await supabase.storage.from(PHOTO_BUCKET).remove([currentPhotoPath]);
      }
      photoPath = null;
    }

    const { error } = await supabase.from("visits").upsert(
      {
        bar_id: id,
        visited: formData.get("visited") === "on",
        visited_on: asDate(formData.get("visitedOn")),
        beer_price: asPrice(formData.get("beerPrice")),
        note_ines: asNote(formData.get("noteInes")),
        note_fabienne: asNote(formData.get("noteFabienne")),
        vote_ines: asVote(formData.get("voteInes")),
        vote_fabienne: asVote(formData.get("voteFabienne")),
        photo_path: photoPath,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "bar_id" },
    );

    if (error) {
      return { ok: false, error: `No se pudo guardar: ${error.message}` };
    }

    refresh();
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: messageFrom(error) };
  }
}

export async function deleteVisit(
  _prevState: VisitFormState,
  formData: FormData,
): Promise<VisitFormState> {
  if (!(await isUnlocked())) {
    return { ok: false, error: LOCKED_MESSAGE };
  }

  const id = String(formData.get("barId") ?? "");

  try {
    const supabase = requireSupabase();

    if (!(await isKnownBar(supabase, id))) {
      return { ok: false, error: UNKNOWN_BAR_MESSAGE };
    }

    const photoPath = asText(formData.get("photoPath"));

    if (photoPath) {
      await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
    }

    const { error } = await supabase.from("visits").delete().eq("bar_id", id);

    if (error) {
      return { ok: false, error: `No se pudo borrar: ${error.message}` };
    }

    refresh();
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: messageFrom(error) };
  }
}

/**
 * Adds a bar that is not one of the original 100. Stored in its own table, so
 * the challenge list stays exactly as it was.
 */
export async function addBar(
  _prevState: BarFormState,
  formData: FormData,
): Promise<BarFormState> {
  if (!(await isUnlocked())) {
    return { ok: false, error: LOCKED_MESSAGE };
  }

  const name = asText(formData.get("name"))?.slice(0, BAR_NAME_MAX_LENGTH);

  if (!name) {
    return { ok: false, error: "Ponle un nombre al bar." };
  }

  const slug = slugify(name);

  if (!slug) {
    return { ok: false, error: "El nombre necesita alguna letra o número." };
  }

  if (originalBarIds.has(slug)) {
    return { ok: false, error: `${name} ya está en la lista original.` };
  }

  const lat = asCoordinate(formData.get("lat"), 90);
  const lng = asCoordinate(formData.get("lng"), 180);

  if (lat === null || lng === null) {
    return { ok: false, error: "Marca el sitio en el mapa." };
  }

  try {
    const supabase = requireSupabase();
    const id = extraBarId(name);

    // Fails on the primary key rather than quietly moving an existing bar's pin.
    const { error } = await supabase
      .from("extra_bars")
      .insert({ id, name, lat, lng });

    if (error) {
      const duplicate = error.code === "23505";
      return {
        ok: false,
        error: duplicate
          ? `Ya has añadido un bar llamado ${name}.`
          : `No se pudo añadir: ${error.message}`,
      };
    }

    refresh();
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: messageFrom(error) };
  }
}

/**
 * Removes an added bar along with its visit and photo. Only extras can be
 * deleted — the original 100 are part of the challenge, not editable data.
 */
export async function deleteBar(
  _prevState: BarFormState,
  formData: FormData,
): Promise<BarFormState> {
  if (!(await isUnlocked())) {
    return { ok: false, error: LOCKED_MESSAGE };
  }

  const id = String(formData.get("barId") ?? "");

  if (!isExtraId(id)) {
    return { ok: false, error: "Solo se pueden borrar los bares añadidos." };
  }

  try {
    const supabase = requireSupabase();

    // Read the photo path from the table rather than the form: the row is the
    // source of truth for what needs cleaning up in storage.
    const { data: visit } = await supabase
      .from("visits")
      .select("photo_path")
      .eq("bar_id", id)
      .maybeSingle();

    const photoPath = visit?.photo_path ?? null;

    if (photoPath) {
      await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
    }

    const { error: visitError } = await supabase
      .from("visits")
      .delete()
      .eq("bar_id", id);

    if (visitError) {
      return { ok: false, error: `No se pudo borrar: ${visitError.message}` };
    }

    const { error } = await supabase.from("extra_bars").delete().eq("id", id);

    if (error) {
      return { ok: false, error: `No se pudo borrar: ${error.message}` };
    }

    refresh();
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: messageFrom(error) };
  }
}

function asText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNote(value: FormDataEntryValue | null): string | null {
  return asText(value)?.slice(0, NOTE_MAX_LENGTH) ?? null;
}

function asDate(value: FormDataEntryValue | null): string | null {
  const text = asText(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

/** Accepts both "4.20" and the Spanish "4,20". */
function asPrice(value: FormDataEntryValue | null): number | null {
  const text = asText(value);
  if (!text) return null;

  const price = Number(text.replace(",", "."));
  if (!Number.isFinite(price) || price < 0) return null;

  return Math.round(price * 100) / 100;
}

/** Latitude or longitude, bounded by `limit` (90 or 180). */
function asCoordinate(
  value: FormDataEntryValue | null,
  limit: number,
): number | null {
  const text = asText(value);
  if (!text) return null;

  const coordinate = Number(text);
  if (!Number.isFinite(coordinate) || Math.abs(coordinate) > limit) return null;

  return coordinate;
}

function asVote(value: FormDataEntryValue | null): number | null {
  const text = asText(value);
  if (!text) return null;

  const vote = Number(text);
  if (!Number.isInteger(vote) || vote < VOTE_MIN || vote > VOTE_MAX) return null;

  return vote;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Error inesperado.";
}
