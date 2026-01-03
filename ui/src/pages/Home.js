import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    fetch("http://localhost:5000/rides/my-rides", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user.token,
      },
    })
      .then((res) => res.ok? res.json(): Promise.reject(res))
      .then((data) => setRides(data))
      .catch((e) => {(e.status===403 || e.status===401)?  navigate("/login") : setError("Failed to load rides")})
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading your rides...</p>;
  }

  if (error) {
    return <p style={{ padding: "20px", color: "red" }}>{error}</p>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      {/* Header with Create Ride Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>My Rides</h1>
        <button
          onClick={() => navigate("/create-ride")}
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: "black",
            color: "white",
            border: "none",
            fontSize: "28px",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          +
        </button>
      </div>

      {/* Rides List */}
      {rides.length === 0 ? (
        <p>You have no rides.</p>
      ) : (
        rides.map((ride) => (
          <Link
            key={ride.id}
            to={`/ride/${ride.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "15px",
                backgroundColor: "#fafafa",
                cursor: "pointer",
              }}
            >
              <h2 style={{ margin: "0 0 10px 0" }}>{ride.title}</h2>
              <p style={{ margin: "0 0 10px 0" }}>{ride.description}</p>

              <p style={{ margin: "5px 0" }}>
                <strong>From:</strong> {JSON.parse(ride.start_from)?.address}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>To:</strong> {JSON.parse(ride.destination)?.address}
              </p>

              <p style={{ margin: "10px 0 0 0" }}>
                <strong>Members:</strong>{" "}
                {Array.isArray(ride.members) ? ride.members.length : "0"}
              </p>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

export default Home;
