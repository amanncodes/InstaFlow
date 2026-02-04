import { Router } from "express";
import {
  pauseAccount,
  resumeAccount,
  resetTrustScore,
  freezeAccount
} from "./actions";

export const adminRouter = Router();

// ⚠️ Auth to be added later
adminRouter.post("/accounts/:id/pause", async (req, res) => {
  await pauseAccount(
  req.params.id,
  req.body?.reason ?? "manual_pause"
);

  res.json({ status: "paused" });
});

adminRouter.post("/accounts/:id/resume", async (req, res) => {
  await resumeAccount(
  req.params.id,
  req.body?.reason ?? "manual_resume"
);

  res.json({ status: "resumed" });
});

adminRouter.post("/accounts/:id/reset-trust", async (req, res) => {
  await resetTrustScore(
    req.params.id,
    req.body.trustScore ?? 100
  );
  res.json({ status: "trust_reset" });
});

adminRouter.post("/accounts/:id/freeze", async (req, res) => {
  await freezeAccount(
  req.params.id,
  req.body?.reason ?? "severe_violation"
);
  res.json({ status: "frozen" });
});
