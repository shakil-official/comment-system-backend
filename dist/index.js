"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const PORT = process.env.PORT || 5000;
// Create an HTTP server
const server = http_1.default.createServer(app_1.default);
// Create Socket.IO server
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
// Socket lifecycle
exports.io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("joinPost", (postId) => {
        socket.join(postId);
        console.log(`Socket ${socket.id} joined post ${postId}`);
    });
    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});
// Start DB + Server
(0, db_1.default)().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
