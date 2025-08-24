const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  path: "/api/socket"
});

let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [socket.id],
        board: Array(9).fill(""),
        turn: "X"
      };
      socket.join(roomId);
      socket.emit("roomCreated", { symbol: "X" });
    } else {
      socket.emit("errorMsg", "Room already exists!");
    }
  });

  socket.on("joinRoom", (roomId) => {
    if (rooms[roomId] && rooms[roomId].players.length === 1) {
      rooms[roomId].players.push(socket.id);
      socket.join(roomId);
      socket.emit("roomJoined", { symbol: "O" });
      io.to(roomId).emit("update", rooms[roomId]);
    } else {
      socket.emit("errorMsg", "Room full or not exist!");
    }
  });

  socket.on("makeMove", ({ roomId, index, symbol }) => {
    const room = rooms[roomId];
    if (room && room.board[index] === "" && room.turn === symbol) {
      room.board[index] = symbol;
      room.turn = symbol === "X" ? "O" : "X";
      io.to(roomId).emit("update", room);
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId].players.includes(socket.id)) {
        delete rooms[roomId];
        io.to(roomId).emit("errorMsg", "Opponent left the game.");
      }
    }
  });
});

// Vercel handler
module.exports = (req, res) => {
  if (!server.listening) {
    server.listen(0, () => {
      console.log("Socket.IO server running");
    });
  }
  res.end();
};
