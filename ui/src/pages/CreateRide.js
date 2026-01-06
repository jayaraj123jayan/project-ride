import React, { useState, useRef, useEffect } from "react";
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
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usersearchResults, setUserSearchResults] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

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

  useEffect(() => {
    const fetchUserSearchResults = async () => {
      if (!userSearchQuery) {
        setUserSearchResults([]);
        return;
      }

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

      try {
        const res = await fetch(`http://34.135.133.117:5000/users/search?username=${encodeURIComponent(userSearchQuery)}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + user.token,
          },
        });
        if(res.status===403 || res.status===401){
          navigate("/login");
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to search users");
        }

        const data = await res.json();
        setUserSearchResults(data);
      } catch (err) {
        console.error("User search error", err);
      }
    };

    fetchUserSearchResults();
  }, [userSearchQuery, navigate]);

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
      memberUsernames: members,
      status: "created",
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
        <label style={{ marginBottom: "5px", fontWeight: "bold" }}>Time:</label>
        <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} required style={inputStyle} />
        <label style={{ marginBottom: "5px", fontWeight: "bold" }}>Members:</label>
        <input type="text" placeholder="Search member" value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} style={inputStyle} />
        {usersearchResults.length !== 0 && userSearchQuery&&userSearchQuery.length>0&&<div style={{ maxHeight: "100px", overflowY: "auto", marginBottom: "10px", border: "1px solid #ddd", padding: "10px" }}>
          {usersearchResults.map((user, index) => (
            <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <span>{user.username} ({user.name})</span>
              <button type="button" onClick={() => {
                if (!members.includes(user.username)) {
                  setMembers([...members, user.username]);
                }
              }} style={{ padding: "5px 10px", borderRadius: "5px", backgroundColor: "#111", color: "#fff", border: "none", cursor: "pointer" }}>
                Add
              </button>
            </div>
          ))}
        </div>
        }
        {usersearchResults.length === 0 && userSearchQuery.length > 0 && <p style={{ marginBottom: "10px" }}>No users found.</p>}
        <div>
          {members.map((item, index) => (
            <span key={index} style={{ display: "inline-block", backgroundColor: "#eee", padding: "5px 10px", borderRadius: "15px", margin: "5px" }}>
              {item} <span style={{ cursor: "pointer", color: "red" }} onClick={() => {
                setMembers(members.filter(m => m !== item));
              }}>&times;</span>
            </span>
          ))}
        </div>

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
