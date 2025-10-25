/*
  Warnings:

  - Added the required column `code` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CompetencyProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "curriculumStandardId" TEXT NOT NULL,
    "mastery" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "accuracy" REAL NOT NULL DEFAULT 0,
    "averageTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "lastInteractionAt" DATETIME,
    CONSTRAINT "CompetencyProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetencyProgress_curriculumStandardId_fkey" FOREIGN KEY ("curriculumStandardId") REFERENCES "CurriculumStandard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contentModuleId" TEXT NOT NULL,
    "completion" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "lastActivityAt" DATETIME,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "averageAccuracy" REAL NOT NULL DEFAULT 0,
    "averageTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "mastery" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Progress_contentModuleId_fkey" FOREIGN KEY ("contentModuleId") REFERENCES "ContentModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Progress" ("completion", "contentModuleId", "createdAt", "id", "lastActivityAt", "status", "totalAttempts", "updatedAt", "userId") SELECT "completion", "contentModuleId", "createdAt", "id", "lastActivityAt", "status", "totalAttempts", "updatedAt", "userId" FROM "Progress";
DROP TABLE "Progress";
ALTER TABLE "new_Progress" RENAME TO "Progress";
CREATE UNIQUE INDEX "Progress_userId_contentModuleId_key" ON "Progress"("userId", "contentModuleId");
CREATE TABLE "new_Reward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "criteria" TEXT,
    "icon" TEXT,
    "category" TEXT NOT NULL DEFAULT 'BADGE',
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "levelAchieved" INTEGER,
    "metadata" TEXT,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reward" ("criteria", "description", "icon", "id", "title", "unlockedAt", "userId") SELECT "criteria", "description", "icon", "id", "title", "unlockedAt", "userId" FROM "Reward";
DROP TABLE "Reward";
ALTER TABLE "new_Reward" RENAME TO "Reward";
CREATE UNIQUE INDEX "Reward_userId_code_key" ON "Reward"("userId", "code");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "displayName" TEXT,
    "ageGroupId" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "nextLevelAt" INTEGER NOT NULL DEFAULT 1000,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_ageGroupId_fkey" FOREIGN KEY ("ageGroupId") REFERENCES "AgeGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("ageGroupId", "createdAt", "displayName", "email", "id", "name", "updatedAt") SELECT "ageGroupId", "createdAt", "displayName", "email", "id", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyProgress_userId_curriculumStandardId_key" ON "CompetencyProgress"("userId", "curriculumStandardId");
