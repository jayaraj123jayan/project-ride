import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function RideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

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
      .then((res) => res.json())
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
    ? ride.members.filter((m) => m.toString().includes(memberSearch))
    : [];

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "20px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Ride Card */}
      <div
        style={{
          backgroundColor: "#111", // black background
          color: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <h1 style={{ margin: "0 0 15px 0", color: "#f9d342" }}>{ride.title}</h1>
        <p style={{ fontSize: "16px", lineHeight: "1.5", marginBottom: "20px" }}>
          {ride.description}
        </p>

        <div style={{ marginBottom: "15px" }}>
          <div style={{  marginBottom: "15px"}}>
            <strong>From:</strong>{" "}
            <span style={{ color: "#f0f0f0" }}>{JSON.parse(ride.start_from)?.address}</span>
          </div>
          <div>
            <strong>To:</strong>{" "}
            <span style={{ color: "#f0f0f0" }}>{JSON.parse(ride.destination)?.address}</span>
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
              border: "1px solid #f9d342",
              backgroundColor: "#222",
              color: "#fff",
            }}
          />
        </div>

        <ul style={{ listStyle: "none", padding: 0, marginTop: "10px" }}>
          {filteredMembers.length === 0 ? (
            <li style={{ color: "#aaa" }}>No members found</li>
          ) : (
            filteredMembers.map((member) => (
              <li
                key={member}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#333",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  color: "#f9d342",
                  fontWeight: "bold",
                }}
              >
                {member}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default RideDetails;
