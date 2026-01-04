import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function CreateRide() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState({ address: "", lat: null, lng: null });
  const [destination, setDestination] = useState({ address: "", lat: null, lng: null });
  const [time, setTime] = useState("");
  const [members, setMembers] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startInputRef = useRef(null);
  const destInputRef = useRef(null);

  // Map click handler
  const MapClick = ({ setLocation }) => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        // Reverse geocode using Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then((res) => res.json())
          .then((data) => {
            setLocation({ address: data.display_name || "", lat, lng });
          });
      },
    });
    return null;
  };

  // Search via Nominatim
  const handleSearch = async (query, setLocation) => {
    if (!query) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data[0]) {
        setLocation({ address: data[0].display_name, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
    } catch (err) {
      console.error("Search error", err);
    }
  };

  const handleCreateRide = async (e) => {
    e.preventDefault();

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    if (!user.token) {
      navigate("/login");
      return;
    }

    const memberIds = members
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    if (!start.lat || !destination.lat) {
      setError("Please select start and destination");
      return;
    }

    const body = {
      title,
      description,
      start_from: `${JSON.stringify(start)}`,
      destination: `${JSON.stringify(start)}`,
      time,
      members: memberIds,
    };

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://34.135.133.117:5000/rides/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + user.token,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create ride");
      }

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "20px auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "20px", color: "#111" }}>Create Ride</h1>

      {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

      <form onSubmit={handleCreateRide} style={{ display: "flex", flexDirection: "column" }}>
        <input type="text" placeholder="Ride Title" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ ...inputStyle, height: "80px" }} />

        {/* Start Location Search */}
        <label style={{ marginBottom: "5px", fontWeight: "bold" }}>Start Location:</label>
        <div style={{ display: "flex", marginBottom: "8px" }}>
          <input ref={startInputRef} type="text" placeholder="Search start location" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={() => handleSearch(startInputRef.current.value, setStart)} style={searchButtonStyle}>Search</button>
        </div>

        {/* Start Location Map */}
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "200px", marginBottom: "12px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClick setLocation={setStart} />
          {start.lat && <Marker position={[start.lat, start.lng]}><Popup>{start.address}</Popup></Marker>}
        </MapContainer>
        <input type="text" value={start.address} readOnly style={inputStyle} />

        {/* Destination Search */}
        <label style={{ marginBottom: "5px", fontWeight: "bold" }}>Destination:</label>
        <div style={{ display: "flex", marginBottom: "8px" }}>
          <input ref={destInputRef} type="text" placeholder="Search destination" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={() => handleSearch(destInputRef.current.value, setDestination)} style={searchButtonStyle}>Search</button>
        </div>

        {/* Destination Map */}
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "200px", marginBottom: "12px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClick setLocation={setDestination} />
          {destination.lat && <Marker position={[destination.lat, destination.lng]}><Popup>{destination.address}</Popup></Marker>}
        </MapContainer>
        <input type="text" value={destination.address} readOnly style={inputStyle} />

        <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="Members (comma-separated IDs)" value={members} onChange={(e) => setMembers(e.target.value)} style={inputStyle} />

        <button type="submit" disabled={loading} style={{
          marginTop: "15px", padding: "12px", backgroundColor: "#111", color: "#fff",
          border: "none", borderRadius: "8px", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer"
        }}>
          {loading ? "Creating..." : "Create Ride"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "16px",
  outline: "none",
};

const searchButtonStyle = {
  padding: "12px",
  marginLeft: "5px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#111",
  color: "#fff",
  cursor: "pointer",
};

export default CreateRide;
