import { ActionType } from "./actionTypes";
import { AbortCondition } from "./abortConditions";

export type BaseAction = {
    id: string;
    accountId: string;
    type: ActionType;

    maxDurationMs: number;
    abortOn?: AbortCondition[];

    emitEvents?: boolean; // Whether to emit events for this action (default: true)
};

export type ViewStoryAction = BaseAction & {
    type: ActionType.VIEW_STORY;
    targets: string[];
};

export type ScrollFeedAction = BaseAction & {
    type: ActionType.SCROLL_FEED;
    durationMs: number;     
};

export type LikePostAction = BaseAction & {
    type: ActionType.LIKE_POST;
    targetPostId: string;
    textVariants: string[];
};

export type CommentAction = BaseAction & {
    type: ActionType.COMMENT;
    targetPostId: string;
    textVariants: string[];
};

export type FollowAction = BaseAction & {
    type: ActionType.FOLLOW;
    targetUsername: string;
};

export type UnfollowAction = BaseAction & {
    type: ActionType.UNFOLLOW;
    targetUsername: string;
};

export type WaitAction = BaseAction & {
    type: ActionType.WAIT;
    jitterMs?: number; // Optional randomization for wait duration
};

export type AutomationAction = 
| ViewStoryAction
| ScrollFeedAction
| LikePostAction
| CommentAction
| FollowAction
| UnfollowAction
| WaitAction;