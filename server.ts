import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Gemini lazily to avoid crashing on startup if key is missing
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAI = new GoogleGenAI(key);
  }
  return genAI;
}

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());

// API Routes
app.post("/api/generate-quiz", async (req, res) => {
  const { topic, chapter, difficulty, numQuestions, language, isJEE_NEET } = req.body;
  
  try {
    const aiClient = getGenAI();
    let prompt = "";
    if (isJEE_NEET) {
      prompt = `Generate a ${difficulty} difficulty quiz for ${topic} (JEE/NEET level) with ${numQuestions} multiple choice questions.`;
    } else {
      prompt = `Generate a ${difficulty} difficulty quiz for ${topic}, specifically chapter ${chapter} for class 11th/12th, with ${numQuestions} multiple choice questions in ${language}.`;
    }

    prompt += ` Ensure the questions are accurate and options are distinct. Return exactly ${numQuestions} questions.`;

    const model = aiClient.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The quiz question text" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Exactly 4 options" 
              },
              correctAnswer: { type: Type.STRING, description: "The correct option from the options array" }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    });

    const response = await result.response;
    const text = response.text();
    if (!text) throw new Error("Empty response from AI");
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Gemini AI Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate quiz questions using AI.";
    res.status(500).json({ error: message });
  }
});

// Socket.IO Logic
const rooms = new Map(); // pin -> sessionData

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-session", ({ pin: rawPin, name, uid, isAdmin, status }) => {
    if (!rawPin) return;
    const pin = String(rawPin).trim();
    socket.join(pin);
    console.log(`[SOCKET] ${name} (${uid}) joined room ${pin} (isAdmin: ${isAdmin})`);

    if (!rooms.has(pin)) {
      console.log(`[SOCKET] Creating room ${pin} on the fly with status: ${status || "waiting"}`);
      rooms.set(pin, { 
        participants: [], 
        status: status || "waiting", 
        currentQuestionIndex: 0 
      });
    }

    const room = rooms.get(pin);
    
    // If admin joins and provides a status, trust it if current status is waiting
    if (isAdmin && status && room.status === "waiting") {
      room.status = status;
    }
    
    if (!isAdmin) {
      // Find existing participant to preserve score
      const existingParticipant = room.participants.find((p: any) => p.uid === uid);
      const currentScore = existingParticipant ? existingParticipant.score : 0;

      // Remove existing entries for this UID to prevent duplicates
      room.participants = room.participants.filter((p: any) => p.uid !== uid);
      
      // Add or update the participant session
      room.participants.push({ uid, name, socketId: socket.id, score: currentScore });
      console.log(`[SOCKET] Updated participant ${name} in room ${pin}. Total: ${room.participants.length}`);
    }

    // Always broadcast the update to everyone in the room
    io.to(pin).emit("room-update", {
      participants: room.participants,
      status: room.status,
      currentQuestionIndex: room.currentQuestionIndex ?? 0
    });
  });

  socket.on("start-quiz", ({ pin }) => {
    if (rooms.has(pin)) {
      const room = rooms.get(pin);
      room.status = "question";
      room.currentQuestionIndex = 0;
      io.to(pin).emit("quiz-started");
      io.to(pin).emit("room-update", { status: room.status, currentQuestionIndex: room.currentQuestionIndex });
    }
  });

  socket.on("change-status", ({ pin, status }) => {
    if (rooms.has(pin)) {
      const room = rooms.get(pin);
      room.status = status;
      io.to(pin).emit("room-update", { status: room.status });
    }
  });

  socket.on("next-question", ({ pin, index }) => {
    if (rooms.has(pin)) {
      const room = rooms.get(pin);
      room.currentQuestionIndex = index;
      room.status = "question";
      io.to(pin).emit("question-changed", { index });
      io.to(pin).emit("room-update", { status: room.status, currentQuestionIndex: room.currentQuestionIndex });
    }
  });

  socket.on("submit-answer", ({ pin, uid, isCorrect, scoreIncrement }) => {
    if (rooms.has(pin)) {
      const room = rooms.get(pin);
      const participant = room.participants.find(p => p.uid === uid);
      if (participant) {
        participant.score += scoreIncrement;
        io.to(pin).emit("room-update", { participants: room.participants });
      }
    }
  });

  socket.on("quiz-finished", ({ pin }) => {
    if (rooms.has(pin)) {
      const room = rooms.get(pin);
      room.status = "finished";
      io.to(pin).emit("quiz-ended");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Optional: handle cleanup
  });
});

// Serve frontend
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
