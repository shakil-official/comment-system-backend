import http from "http";
import { Server } from "socket.io";
import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT || 5000;

// Create an HTTP server
const server = http.createServer(app);

// Create Socket.IO server
export const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Socket lifecycle
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinPost", (postId: string) => {
        socket.join(postId);
        console.log(`Socket ${socket.id} joined post ${postId}`);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

// Start DB + Server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
