import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L, { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";

// Fix for default marker icons in Leaflet + Next.js
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapProps {
    center?: [number, number];
    onLocationSelect?: (lat: number, lng: number) => void;
    markerPosition?: [number, number] | null;
}

// Sub-component to handle map clicks and moving the view
function LocationPicker({ onSelect, markerPos }: { onSelect: (lat: number, lng: number) => void, markerPos: [number, number] | null }) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    const map = useMap();
    useEffect(() => {
        if (markerPos) {
            map.flyTo(markerPos, map.getZoom());
        }
    }, [markerPos, map]);

    return markerPos ? <Marker position={markerPos} icon={defaultIcon} /> : null;
}

const NepalMap = ({ center = [27.7172, 85.324], onLocationSelect, markerPosition }: MapProps) => {
    return (
        <MapContainer
            center={center}
            zoom={13}
            className="h-full w-full rounded-[32px] overflow-hidden border-2 border-gray-100"
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {onLocationSelect && (
                <LocationPicker onSelect={onLocationSelect} markerPos={markerPosition || null} />
            )}
            {!onLocationSelect && markerPosition && (
                <Marker position={markerPosition} icon={defaultIcon} />
            )}
        </MapContainer>
    );
};

export default NepalMap;
