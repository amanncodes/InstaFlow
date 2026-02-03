import express from "express";
import { eventsRouter } from "./events/router";

console.log("Starting InstaFlow API server...");

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "instaflow-api" });
});

app.use("/api/events", eventsRouter);

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[INFO] InstaFlow API running on http://127.0.0.1:${PORT}`);
});
