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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "image", "name", "password", "updatedAt") SELECT "createdAt", "email", "id", "image", "name", "password", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
