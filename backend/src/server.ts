import express from "express";
import { eventsRouter } from "./events/router";
import { accountsRouter } from "./accounts/router";
import { automationRouter } from "./automation/router";
import { adminRouter } from "./admin/router";
import cors from "cors";
import path from "path";

console.log("Starting InstaFlow API server...");

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
}));

// Serve avatars and other static assets
app.use("/static", express.static(path.join(__dirname, "..", "public")));

app.use(express.json());
app.use("/api/accounts", accountsRouter);
app.use("/api/automation", automationRouter);
app.use("/api/admin", adminRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "instaflow-api" });
});

app.use("/api/events", eventsRouter);

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[INFO] InstaFlow API running on http://127.0.0.1:${PORT}`);
});
