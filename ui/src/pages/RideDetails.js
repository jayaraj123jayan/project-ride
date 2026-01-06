import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import LiveRideMap from "../components/LiveRideMap";
import useLocationSender from "../hooks/useLocationSender";

function RideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  useLocationSender(ride?.id, JSON.parse(localStorage.getItem("user") || "{}"));

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    if (!user.token) {
      navigate("/login");
      return;
    }

    fetch(`http://34.135.133.117:5000/rides/id/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user.token,
      },
    })
      .then((res) => {if(res.status === 403 || res.status===401) {localStorage.removeItem("user"); navigate("/login");}else {return res.json()} })
      .then((data) => setRide(data))
      .catch(() => setError("Failed to load ride details"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading)
    return <p style={{ padding: "20px", textAlign: "center" }}>Loading ride details...</p>;

  if (error)
    return <p style={{ padding: "20px", color: "red", textAlign: "center" }}>{error}</p>;

  if (!ride)
    return <p style={{ padding: "20px", textAlign: "center" }}>Ride not found</p>;

  // Filter members by search
  const filteredMembers = Array.isArray(ride.members)
    ? ride.members.filter((m) => m.username.toString().includes(memberSearch))
    : [];

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "20px auto", fontFamily: "Arial, sans-serif", height: "400px" }}>
      <h1 style={{ marginBottom: "20px", color: "#111" }}>Ride details</h1>
      {/* Ride Card */}
      <div
      >
        <h1 style={{ margin: "0 0 15px 0", color: "#f9d342" }}>{ride.title}</h1>
        {ride.status==="started" && <p style={{color:"green"}}>Ride has started</p>}
        <p style={{ fontSize: "16px", lineHeight: "1.5", marginBottom: "20px" }}>
          {ride.description}
        </p>

        <div style={{ marginBottom: "15px" }}>
          <div style={{  marginBottom: "15px"}}>
            <strong>From:</strong>{" "}
            <span style={{ color: "#2a2929ff" }}>{JSON.parse(ride.start_from)?.address}</span>
          </div>
          <div>
            <strong>To:</strong>{" "}
            <span style={{ color: "#2a2929ff" }}>{JSON.parse(ride.destination)?.address}</span>
          </div>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <strong>Members:</strong>
          <input
            type="text"
            placeholder="Search member ID..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "8px",
              borderRadius: "8px",
              border: "1px solid #f9d342"
            }}
          />
        </div>

        <ul style={{ listStyle: "none", padding: 0, marginTop: "10px" }}>
          {filteredMembers.length === 0 ? (
            <li style={{ color: "#aaa" }}>No members found</li>
          ) : (
            filteredMembers.map((member) => (
              <li
                key={member.username}
                style={{
                  padding: "8px 12px",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                {member.username} - <span style={{ color: "#aaa", fontWeight: "normal" }}>{member.status}</span>
              </li>
            ))
          )}
        </ul>
      </div>
      {ride.status==="started" && <div
        style={{
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <h3 style={{ marginBottom: "12px" }}>Live Ride Map</h3>
        <LiveRideMap rideId={ride.id} />
      </div>}
    </div>
  );
}

export default RideDetails;
