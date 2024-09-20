const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const socketHandler = require("./sockets/socket-handler");
require("dotenv").config();
const path = require('path');

const app = express();
const httpServer = http.createServer(app);
const io = socketio(httpServer, {
  cors: {
    origin: [
      // 'http://172.20.10.6:8081/',
      // 'http://localhost:8081/',
      "https://admin.socket.io/",
      "http://localhost:5173",
      "http://localhost:5001",
      "http://localhost:8081",
      "https://socket-test-client.netlify.app/",
    ],
    // origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket"], // Force WebSocket transport
  },
});

// socket.io admin ui
instrument(io, {
  auth: false,
});

// socket handler
socketHandler(io);

// router
const router = require("./routes/index.route");

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: [
      // 'http://172.20.10.6:8081/',
      // 'http://localhost:8081/',
      "http://localhost:5173",
      "http://localhost:5001",
      "http://localhost:8081",
      "http://localhost:4200",
      "http://localhost:3000",
      "https://socket-test-client.netlify.app/",
      "https://admin.socket.io/",
    ],
    // origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.use("/api", router);

app.use('/file', express.static(path.join(__dirname, '../public/upload')));

// server
const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, (req, res) => {
  console.log(`Server running on port: ${PORT}`);
});
