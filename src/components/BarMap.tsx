"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Bar } from "@/data/bars";
import { googleMapsDirectionsUrl, googleMapsUrl } from "@/data/bars";

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 14px;
    height: 14px;
    background: #f59e0b;
    border: 2px solid #78350f;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

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

type BarMapProps = {
  bars: Bar[];
  selectedBar: Bar | null;
  onSelectBar: (bar: Bar) => void;
};

export default function BarMap({
  bars,
  selectedBar,
  onSelectBar,
}: BarMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const markers = useMemo(
    () =>
      bars.map((bar) => (
        <Marker
          key={`${bar.name}-${bar.lat}-${bar.lng}`}
          position={[bar.lat, bar.lng]}
          icon={markerIcon}
          eventHandlers={{
            click: () => onSelectBar(bar),
          }}
        >
          <Popup>
            <div className="min-w-[180px] font-sans">
              <p className="mb-2 text-sm font-semibold text-stone-900">
                {bar.name}
              </p>
              <div className="flex flex-col gap-1 text-xs">
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
      )),
    [bars, onSelectBar],
  );

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-stone-900 text-stone-400">
        Cargando mapa…
      </div>
    );
  }

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
