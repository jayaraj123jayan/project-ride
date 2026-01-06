import { useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://34.135.133.117:5000", {
  transports: ["websocket"],
});

export default function useLocationSender(rideId, user) {

  useEffect(() => {
    if (!rideId || !user) return;

    socket.emit("join-ride", rideId);

    const interval = setInterval(() => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition((pos) => {
        socket.emit("send-location", {
          rideId,
          userId: user.id,
          username: user.username,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }, 3000); // every 3 seconds

    return () => {
      clearInterval(interval);
      socket.emit("leave-ride", rideId);
    };
  }, [rideId, user]);
}
