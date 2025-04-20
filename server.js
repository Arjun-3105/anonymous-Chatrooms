const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity, restrict in production
    methods: ["GET", "POST"]
  }
});

// Define pre-made rooms
const premadeRooms = ["General", "Support", "Random", "Introductions"];

// Serve static files correctly from /public
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
    console.log('a user connected');
    // Send the list of rooms to the newly connected client
    socket.emit('room list', premadeRooms);

    socket.on('join room', (roomName) => {
        if (premadeRooms.includes(roomName)) {
            socket.join(roomName);
            socket.room = roomName; // Store the room name on the socket

            // Assign username *after* joining a room
            const username = "Anonymous#" + Math.floor(1000 + Math.random() * 9000);
            socket.username = username;

            console.log(`${username} joined room: ${roomName}`);

            // Notify others in the room
            socket.to(roomName).emit("message", {
                user: "System",
                text: `${username} has joined the ${roomName} chat.`,
            });
            // Notify the user they joined
             socket.emit("message", {
                user: "System",
                text: `You have joined the ${roomName} chat as ${username}.`,
            });

        } else {
             socket.emit("message", {
                user: "System",
                text: `Error: Room "${roomName}" does not exist.`,
            });
        }
    });


    socket.on("chat message", (msg) => {
        // Only broadcast to the sender's room
        if (socket.room) {
             io.to(socket.room).emit("message", { user: socket.username, text: msg });
        } else {
             // Handle case where user tries to send message before joining a room
             socket.emit("message", {
                user: "System",
                text: `Please join a room first.`,
            });
        }
    });

    socket.on("disconnect", () => {
        console.log('user disconnected');
        // Only broadcast to the room the user was in
        if (socket.room && socket.username) {
             io.to(socket.room).emit("message", {
                user: "System",
                text: `${socket.username} has left the ${socket.room} chat.`,
            });
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
module.exports = app; // <--- Export the Express app
