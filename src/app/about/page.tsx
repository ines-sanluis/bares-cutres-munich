import type { Metadata } from "next";
import Link from "next/link";
import { bars, GOOGLE_MAPS_ID } from "@/data/bars";
import { MARKER_FILLS, MARKER_RING } from "@/lib/marker-colors";

export const metadata: Metadata = {
  title: "Cómo funciona · Bares cutres de Múnich",
  description:
    "Qué son los 100 bares, qué significa EXTRA y qué se guarda de cada visita.",
};

/** A pin exactly as the map draws it, so the legend cannot lie. */
function Pin({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className={`mt-1 inline-block size-3.5 shrink-0 rounded-full ${MARKER_RING}`}
      style={{ background: color }}
    />
  );
}

function LegendRow({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <Pin color={color} />
      <span>
        <span className="font-semibold text-stone-800">{title}</span> —{" "}
        {children}
      </span>
    </li>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-amber-700">{title}</h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="text-sm font-semibold text-amber-700 hover:underline"
      >
        ← Volver al mapa
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-amber-700 sm:text-3xl">
        Cómo funciona
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        Un mapa de bares cutres de Múnich que también es nuestro diario de
        visitas.
      </p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-stone-700">
        <Section title={`Los ${bars.length} bares`}>
          <p>
            La lista original son los {bars.length} bares del{" "}
            <a
              href={`https://www.google.com/maps/d/viewer?mid=${GOOGLE_MAPS_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:underline"
            >
              mapa de Google
            </a>{" "}
            del póster. Ese es el reto y no se toca: ni se añaden, ni se quitan,
            ni se cambian de sitio. El contador de{" "}
            <span className="font-semibold text-stone-800">
              «visitados de {bars.length}»
            </span>{" "}
            cuenta solo estos.
          </p>
        </Section>

        <Section title="¿Y los bares EXTRA?">
          <p>
            Múnich tiene muchísimos más bares cutres de los que caben en un
            póster. Cuando encontramos uno por ahí que no está en la lista, se
            puede añadir desde la app con{" "}
            <span className="font-semibold text-stone-800">
              + Añadir un bar extra
            </span>
            : le pones el nombre y marcas el sitio en el mapa (o le das a «📍
            Estoy aquí» y usa tu ubicación).
          </p>
          <p>
            Estos bares llevan la etiqueta{" "}
            <span className="rounded bg-violet-100 px-1 py-0.5 text-[10px] font-semibold text-violet-700 align-middle">
              EXTRA
            </span>{" "}
            y se guardan aparte, <strong>fuera del contador</strong>. Así
            visitar un bar extra no hace trampa con el progreso del reto, pero
            queda igual de bien guardado: precio, votos, notas y foto. Los
            bares extra son los únicos que se pueden borrar de la lista.
          </p>
        </Section>

        <Section title="Los colores del mapa">
          <p>
            Todos los pines son círculos. El color dice si ya has estado, y el
            tono claro dice que es un bar extra:
          </p>
          <ul className="mt-1 flex flex-col gap-2">
            <LegendRow color={MARKER_FILLS.original.pending} title="Naranja">
              uno de los {bars.length}, todavía pendiente.
            </LegendRow>
            <LegendRow color={MARKER_FILLS.original.visited} title="Verde">
              uno de los {bars.length}, ya visitado. 🍺
            </LegendRow>
            <LegendRow
              color={MARKER_FILLS.extra.pending}
              title="Naranja claro"
            >
              bar extra pendiente.
            </LegendRow>
            <LegendRow color={MARKER_FILLS.extra.visited} title="Verde claro">
              bar extra visitado.
            </LegendRow>
          </ul>
        </Section>

        <Section title="Qué se guarda de cada visita">
          <p>
            Toca un pin del mapa o un bar de la lista y se abre su ficha. De
            cada visita se guarda:
          </p>
          <ul className="ml-5 flex list-disc flex-col gap-1">
            <li>si está visitado y la fecha (se puede dejar en blanco si no os acordáis);</li>
            <li>el precio de la cerveza, que alimenta la media y el récord de «más barata»;</li>
            <li>un voto de 1 a 5 🍺 de Inés y otro de Fabienne — la nota del bar es la media;</li>
            <li>notas separadas de Inés y de Fabienne, para poder no estar de acuerdo;</li>
            <li>una foto, que se ve en el pin del mapa y en la ficha.</li>
          </ul>
        </Section>

        <Section title="Buscar y filtrar">
          <p>
            El buscador y los filtros (Todos / Visitados / Pendientes) afectan a
            la vez a la lista y a los pines del mapa, y el mapa se recoloca solo
            para encajar lo que queda. En el móvil la barra vive abajo: toca{" "}
            <span className="font-semibold text-stone-800">Lista ▴</span> para
            desplegar la lista completa y las estadísticas.
          </p>
        </Section>

        <Section title="Editar">
          <p>
            Cualquiera puede mirar el mapa, pero para escribir hay que entrar
            con la contraseña compartida (🔒 abajo en la barra). Sin ella la app
            es de solo lectura: los campos salen bloqueados y no se puede
            añadir, editar ni borrar nada.
          </p>
        </Section>
      </div>

      <Link
        href="/"
        className="mt-10 inline-block rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
      >
        Al mapa
      </Link>
    </main>
  );
}
