import { Router } from "express";
import { automationGuard } from "../guard/middleware";

export const automationRouter = Router();

automationRouter.post(
  "/comment",
  automationGuard,
  async (req, res) => {
    res.json({
      status: "comment_posted",
      accountId: req.body.accountId
    });
  }
);
