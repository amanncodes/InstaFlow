import { Router } from "express";
import { automationGuard } from "../guard/middleware";
import { rateLimit } from "../rateLimit/middleware";

export const automationRouter = Router();

automationRouter.post(
  "/comment",
  automationGuard,
  rateLimit("COMMENT"),
  async (req, res) => {
    res.json({
      status: "comment_posted",
      accountId: req.body.accountId
    });
  }
);
