import { ActionType } from "../contracts/actionTypes";
import { ActionSequence } from "../contracts/sequences";

export const sampleCommentSequence: ActionSequence = {
  sequenceId: "seq_test_001",
  accountId: "acc_001",
  intent: "ENGAGE",

  actions: [
    {
      id: "a1",
      type: ActionType.VIEW_STORY,
      accountId: "acc_001",
      targets: ["user_a", "user_b"],
      maxDurationMs: 20000
    },
    {
      id: "a2",
      type: ActionType.SCROLL_FEED,
      accountId: "acc_001",
      durationMs: 45000,
      maxDurationMs: 60000
    },
    {
      id: "a3",
      type: ActionType.COMMENT,
      accountId: "acc_001",
      targetPostId: "post_123",
      textVariants: ["🔥", "Nice!", "Love this"],
      maxDurationMs: 20000
    }
  ],

  maxTotalDurationMs: 300000,
  cooldownAfterMs: 1800000,
  createdAt: new Date().toISOString()
};
