"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { deleteVisit, saveVisit } from "@/app/actions";
import type { Bar } from "@/data/bars";
import { barId } from "@/data/bars";
import { emptyVisitFormState } from "@/lib/form-state";
import { resizeImage } from "@/lib/resize-image";
import type { Visit } from "@/lib/visits";
import BeerRating from "./BeerRating";
import UnlockForm from "./UnlockForm";

type VisitModalProps = {
  bar: Bar;
  visit: Visit | undefined;
  unlocked: boolean;
  onClose: () => void;
};

const FIELD_CLASS =
  "rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none";

export default function VisitModal({
  bar,
  visit,
  unlocked,
  onClose,
}: VisitModalProps) {
  const id = barId(bar);

  const [saveState, saveAction, saving] = useActionState(
    saveVisit,
    emptyVisitFormState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteVisit,
    emptyVisitFormState,
  );

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close once the server confirms the write.
  useEffect(() => {
    if (saveState.ok || deleteState.ok) onClose();
  }, [saveState.ok, deleteState.ok, onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Release the object URL created for the local preview.
  useEffect(() => {
    if (!photoPreview) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;

    setPreparingPhoto(true);
    try {
      const resized = await resizeImage(file);
      setPhoto(resized);
      setPhotoPreview(URL.createObjectURL(resized));
      setPhotoRemoved(false);
    } finally {
      setPreparingPhoto(false);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const busy = saving || deleting || preparingPhoto;
  const existingPhotoUrl = photoRemoved ? null : (visit?.photoUrl ?? null);
  const error = saveState.error ?? deleteState.error;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-900/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-stone-200 bg-surface shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={bar.name}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 p-4">
          <h2 className="text-base font-bold text-amber-700">{bar.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mt-1 rounded px-2 py-1 text-lg leading-none text-stone-400 hover:bg-stone-100 hover:text-stone-800"
          >
            ✕
          </button>
        </div>

        <form
          action={(formData) => {
            // Send the downscaled file rather than the original from the input.
            if (photo) formData.set("photo", photo);
            saveAction(formData);
          }}
          className="flex flex-col gap-4 p-4"
        >
          <input type="hidden" name="barId" value={id} />
          <input
            type="hidden"
            name="photoPath"
            value={visit?.photoPath ?? ""}
          />
          <input
            type="hidden"
            name="removePhoto"
            value={photoRemoved ? "true" : "false"}
          />

          {!unlocked && (
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <UnlockForm hint="🔒 Entra con la contraseña para editar esta visita." />
            </div>
          )}

          {/* display:contents keeps the form's flex layout while disabling every
              field in one go when the app is locked. */}
          <fieldset disabled={!unlocked} className="contents">
            <label className="flex items-center gap-2 text-sm text-stone-800">
              <input
                type="checkbox"
                name="visited"
                defaultChecked={visit?.visited ?? true}
                className="size-4 accent-green-700"
              />
              Visitado
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-stone-500">
                Fecha
                <input
                  type="date"
                  name="visitedOn"
                  defaultValue={visit?.visitedOn ?? ""}
                  className={FIELD_CLASS}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-stone-500">
                Precio de la cerveza (€)
                <input
                  type="text"
                  inputMode="decimal"
                  name="beerPrice"
                  placeholder="4,20"
                  defaultValue={
                    visit?.beerPrice?.toString().replace(".", ",") ?? ""
                  }
                  className={FIELD_CLASS}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
              <BeerRating
                name="voteInes"
                label="Inés"
                defaultValue={visit?.voteInes ?? null}
              />
              <BeerRating
                name="voteFabienne"
                label="Fabienne"
                defaultValue={visit?.voteFabienne ?? null}
              />
            </div>

            <label className="flex flex-col gap-1 text-xs text-stone-500">
              Notas
              <textarea
                name="note"
                rows={3}
                maxLength={500}
                placeholder="¿Qué tal el sitio?"
                defaultValue={visit?.note ?? ""}
                className={`resize-none ${FIELD_CLASS}`}
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-stone-500">Foto</span>

              {photoPreview ? (
                // Local preview of a blob: URL, which next/image cannot optimise.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt={`Foto de ${bar.name}`}
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : existingPhotoUrl ? (
                <Image
                  src={existingPhotoUrl}
                  alt={`Foto de ${bar.name}`}
                  width={400}
                  height={160}
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : null}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handlePhotoChange(event.target.files?.[0])
                  }
                  className="w-full text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:text-stone-700"
                />
                {(photoPreview || existingPhotoUrl) && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-rose-700"
                  >
                    Quitar
                  </button>
                )}
              </div>
              {preparingPhoto && (
                <span className="text-xs text-stone-500">
                  Preparando la foto…
                </span>
              )}
            </div>
          </fieldset>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          {unlocked && (
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          )}
        </form>

        {visit && unlocked && (
          <form
            action={deleteAction}
            className="border-t border-stone-200 p-4"
            onSubmit={(event) => {
              if (!confirm(`¿Borrar la visita a ${bar.name}?`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="barId" value={id} />
            <input
              type="hidden"
              name="photoPath"
              value={visit.photoPath ?? ""}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
            >
              {deleting ? "Borrando…" : "Borrar visita"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
