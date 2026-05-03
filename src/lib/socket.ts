import { io } from "socket.io-client";

// In development, we connect to the same host
const socket = io({
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"], // Try websocket first for stability
});

socket.on("connect", () => {
  console.log("[SOCKET] Connected to server:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[SOCKET] Disconnected:", reason);
});

socket.on("connect_error", (error: any) => {
  // Silent suppress common ephemeral polling/connection errors to avoid console noise
  const isEphemeral = error.message?.includes("xhr poll error") || 
                     error.message?.includes("websocket error") ||
                     error.description === 503;

  if (isEphemeral) {
    console.debug("[SOCKET] Ephemeral connection error (will retry):", error.message);
  } else {
    console.warn("[SOCKET] Connection warning:", error.message);
  }
});

export default socket;
