import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import io from "socket.io-client";

// FIX default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const socket = io("http://34.135.133.117:5000", {
  transports: ["websocket"]
});

function LiveRideMap({ rideId }) {
  const [locations, setLocations] = useState({});

  useEffect(() => {
    socket.emit("join-ride", rideId);

    socket.on("location-update", (data) => {
      // data: { userId, lat, lng, username }
      setLocations((prev) => ({
        ...prev,
        [data.userId]: data,
      }));
    });

    return () => {
      socket.off("location-update");
      socket.emit("leave-ride", rideId);
    };
  }, [rideId]);

  const defaultCenter = [10.8505, 76.2711]; // Kerala default

  return (
    <div style={{ width: "100%", height: "350px" }}>
      <MapContainer
        center={defaultCenter}
        zoom={8}
        style={{ width: "100%", height: "100%", borderRadius: "12px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {Object.values(locations).map((loc) => (
          <Marker key={loc.userId} position={[loc.lat, loc.lng]}>
            <Popup>{loc.username}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default LiveRideMap;
