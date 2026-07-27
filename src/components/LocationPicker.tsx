"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MAP_CENTER } from "@/data/bars";

export type LatLng = { lat: number; lng: number };

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 18px;
    height: 18px;
    background: #7c3aed;
    border: 3px solid #ffffff;
    border-radius: 4px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickToPlace({ onPick }: { onPick: (value: LatLng) => void }) {
  useMapEvents({
    click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });

  return null;
}

/** Keeps the map centred on the pin when it moves from outside (the GPS button). */
function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();

  useEffect(() => {
    if (!value) return;
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 16));
  }, [value, map]);

  return null;
}

export default function LocationPicker({
  value,
  onPick,
}: {
  value: LatLng | null;
  onPick: (value: LatLng) => void;
}) {
  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : MAP_CENTER}
      zoom={value ? 16 : 12}
      className="h-48 w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPlace onPick={onPick} />
      <Recenter value={value} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = event.target.getLatLng();
              onPick({ lat, lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
