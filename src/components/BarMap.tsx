"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { barId, type Bar } from "@/data/bars";
import { googleMapsDirectionsUrl, googleMapsUrl } from "@/data/bars";
import { MARKER_FILLS } from "@/lib/marker-colors";
import {
  averageVote,
  formatPrice,
  visitDateLabel,
  type Visit,
  type VisitMap,
} from "@/lib/visits";

/**
 * Every pin is the same white-ringed circle; only the fill changes, so the
 * original 100 stay recognisable without needing a second shape.
 */
function markerIcon(visited: boolean, isExtra: boolean) {
  const fill =
    MARKER_FILLS[isExtra ? "extra" : "original"][
      visited ? "visited" : "pending"
    ];

  return L.divIcon({
    className: "",
    html: `<div style="
      width: 14px;
      height: 14px;
      background: ${fill};
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(41,37,36,0.45);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function FitBounds({ bars }: { bars: Bar[] }) {
  const map = useMap();

  useEffect(() => {
    if (bars.length === 0) return;
    const bounds = L.latLngBounds(bars.map((b) => [b.lat, b.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [bars, map]);

  return null;
}

function FlyToBar({ bar }: { bar: Bar | null }) {
  const map = useMap();

  useEffect(() => {
    if (!bar) return;
    map.flyTo([bar.lat, bar.lng], 16, { duration: 0.8 });
  }, [bar, map]);

  return null;
}

function VisitSummary({ visit, barName }: { visit: Visit; barName: string }) {
  const score = averageVote(visit);

  return (
    <div className="mb-2 flex flex-col gap-0.5 text-xs text-stone-600">
      {visit.photoUrl && (
        // Fixed height, so the popup does not jump once the photo loads.
        <Image
          src={visit.photoUrl}
          alt={`Foto de ${barName}`}
          width={220}
          height={112}
          className="mb-1 h-28 w-full rounded-md object-cover"
        />
      )}
      {score !== null && (
        <span>
          🍺 {score.toFixed(1)} · Ines {visit.voteInes ?? "–"} / Fabienne{" "}
          {visit.voteFabienne ?? "–"}
        </span>
      )}
      {visit.beerPrice !== null && (
        <span>Cerveza: {formatPrice(visit.beerPrice)}</span>
      )}
      <span className={visit.visitedOn ? "" : "italic"}>
        {visitDateLabel(visit.visitedOn)}
      </span>
      {visit.noteInes && (
        <span className="italic">Inés: “{visit.noteInes}”</span>
      )}
      {visit.noteFabienne && (
        <span className="italic">Fabienne: “{visit.noteFabienne}”</span>
      )}
    </div>
  );
}

type BarMapProps = {
  bars: Bar[];
  visits: VisitMap;
  selectedBar: Bar | null;
  unlocked: boolean;
  onSelectBar: (bar: Bar) => void;
  onEditBar: (bar: Bar) => void;
};

export default function BarMap({
  bars,
  visits,
  selectedBar,
  unlocked,
  onSelectBar,
  onEditBar,
}: BarMapProps) {
  const markers = useMemo(
    () =>
      bars.map((bar) => {
        const id = barId(bar);
        const visit = visits[id];
        const isVisited = visit?.visited ?? false;

        return (
          <Marker
            key={id}
            position={[bar.lat, bar.lng]}
            icon={markerIcon(isVisited, bar.origin === "extra")}
            eventHandlers={{
              click: () => onSelectBar(bar),
            }}
          >
            <Popup>
              <div
                className={`font-sans ${
                  visit?.photoUrl ? "min-w-[220px]" : "min-w-[180px]"
                }`}
              >
                <p className="mb-2 text-sm font-semibold text-stone-900">
                  {bar.name}
                  {bar.origin === "extra" && (
                    <span className="ml-1.5 rounded bg-violet-100 px-1 py-0.5 text-[10px] font-semibold text-violet-700">
                      EXTRA
                    </span>
                  )}
                </p>

                {visit?.visited && (
                  <VisitSummary visit={visit} barName={bar.name} />
                )}

                <div className="flex flex-col gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => onEditBar(bar)}
                    className="self-start font-semibold text-amber-700 hover:underline"
                  >
                    {!unlocked
                      ? "Ver visita"
                      : isVisited
                        ? "Editar visita"
                        : "Marcar como visitado"}
                  </button>
                  <a
                    href={googleMapsUrl(bar)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline"
                  >
                    Abrir en Google Maps
                  </a>
                  <a
                    href={googleMapsDirectionsUrl(bar)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline"
                  >
                    Cómo llegar
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      }),
    [bars, visits, unlocked, onSelectBar, onEditBar],
  );

  return (
    <MapContainer
      center={[48.1351, 11.582]}
      zoom={12}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds bars={bars} />
      <FlyToBar bar={selectedBar} />
      {markers}
    </MapContainer>
  );
}
