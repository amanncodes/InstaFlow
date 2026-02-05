-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SESSION_STARTED', 'SESSION_ENDED', 'SESSION_ABORTED', 'LOGIN_SUCCESS', 'LOGIN_CHALLENGE', 'LOGIN_FAILED', 'LOGOUT', 'ACTION_ATTEMPTED', 'ACTION_SUCCESS', 'ACTION_FAILED', 'WARNING_RECEIVED', 'TEMP_RESTRICTION', 'RATE_LIMIT_WARNING', 'CHALLENGE_REQUIRED', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('info', 'warning', 'danger');

-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('automation_worker', 'manual', 'system');

-- CreateEnum
CREATE TYPE "AccountState" AS ENUM ('ACTIVE', 'PAUSED', 'FROZEN');

-- CreateTable
CREATE TABLE "account_events" (
    "event_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "session_id" TEXT,
    "eventType" "EventType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "source" "EventSource" NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "state" "AccountState" NOT NULL DEFAULT 'ACTIVE',
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_events_account_id_occurred_at_idx" ON "account_events"("account_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

-- AddForeignKey
ALTER TABLE "account_events" ADD CONSTRAINT "account_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
