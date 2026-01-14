import express from "express";
import cors from "cors";

const app = express();

/* ✅ CORS: allow Vercel frontend + local dev */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://project-catalyst-three.vercel.app"
    ],
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

/* ✅ Health check */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

/* ✅ Project submission API */
app.post("/api/submit", (req, res) => {
  const { description, projectType, budget } = req.body;

  if (!description || !projectType || !budget) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  console.log("📌 New Project Submitted:", {
    description,
    projectType,
    budget
  });

  res.json({
    success: true,
    message: "Project submitted successfully"
  });
});

/* ✅ Render port */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
