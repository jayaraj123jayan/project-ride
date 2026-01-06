const { verifyTokenIO } = require("../services/auth");

let ioInstance = null;

function initSocketIO(server) {
    const { Server } = require("socket.io");

    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    ioInstance = io;

    // io.use((socket, next) => {
    //     const token = socket.handshake.auth.token;

    //     if (!token) {
    //         return next(new Error("Authentication error: No token"));
    //     }

    //     try {
    //         const user = verifyTokenIO(token);
    //         socket.user = user; // attach to socket
    //         next();
    //     } catch (err) {
    //         return next(new Error("Authentication error: Invalid token"));
    //     }
    // });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join-ride", (rideId) => {
            socket.join(rideId);
            console.log(`User ${socket.id} joined ride ${rideId}`);
        });

        socket.on("send-location", (data) => {
            // {rideId, userId, lat, lng, username}
            io.to(data.rideId).emit("location-update", data);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
}

// optional: allow other modules to use io.emit()
function getIO() {
    return ioInstance;
}

module.exports = {
    initSocketIO,
    getIO,
};
