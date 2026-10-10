const { io } = require("socket.io-client");
const socket = io("http://localhost:3000", { path: "/api/socket" });

socket.on("connect", () => {
  console.log("Connected to socket");
  setTimeout(() => {
    console.log("No unread_counts_data received in 5s");
    process.exit(1);
  }, 5000);
});

socket.on("unread_counts_data", (data) => {
  console.log("Received data:", data.length, "chats");
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.log("Connect error:", err.message);
  process.exit(1);
});
