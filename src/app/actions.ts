"use server";

import { refresh } from "next/cache";
import { barId, bars } from "@/data/bars";
import { isUnlocked } from "@/lib/auth";
import type { VisitFormState } from "@/lib/form-state";
import { PHOTO_BUCKET, requireSupabase } from "@/lib/supabase";
import { VOTE_MAX, VOTE_MIN } from "@/lib/visits";

const NOTE_MAX_LENGTH = 500;

const LOCKED_MESSAGE = "Desbloquea la app con la contraseña para poder editar.";

/** Server Actions are public POST endpoints, so only known bar ids are accepted. */
const validBarIds = new Set(bars.map(barId));

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

  if (!validBarIds.has(id)) {
    return { ok: false, error: "Bar desconocido." };
  }

  try {
    const supabase = requireSupabase();

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
        note: asNote(formData.get("note")),
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

  if (!validBarIds.has(id)) {
    return { ok: false, error: "Bar desconocido." };
  }

  try {
    const supabase = requireSupabase();
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
