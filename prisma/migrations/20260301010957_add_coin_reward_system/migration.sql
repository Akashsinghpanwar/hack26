-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "walkingGoal" INTEGER NOT NULL DEFAULT 0,
    "cyclingGoal" INTEGER NOT NULL DEFAULT 0,
    "runningGoal" INTEGER NOT NULL DEFAULT 0,
    "publicTransitGoal" INTEGER NOT NULL DEFAULT 0,
    "maxDrivingDays" INTEGER NOT NULL DEFAULT 7,
    "fitnessGoal" TEXT,
    "weeklyCalorieTarget" INTEGER NOT NULL DEFAULT 2000,
    "preferredModes" TEXT,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "lastLoginDate" DATETIME,
    "treesPlanted" INTEGER NOT NULL DEFAULT 0,
    "totalCoinsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "cyclingGoal", "email", "fitnessGoal", "id", "image", "maxDrivingDays", "name", "password", "preferredModes", "publicTransitGoal", "runningGoal", "setupCompleted", "updatedAt", "walkingGoal", "weeklyCalorieTarget") SELECT "createdAt", "cyclingGoal", "email", "fitnessGoal", "id", "image", "maxDrivingDays", "name", "password", "preferredModes", "publicTransitGoal", "runningGoal", "setupCompleted", "updatedAt", "walkingGoal", "weeklyCalorieTarget" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
