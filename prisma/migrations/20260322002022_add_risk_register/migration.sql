-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "Risk" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "probability" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "ownerUserId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Risk_projectId_status_idx" ON "Risk"("projectId", "status");

-- CreateIndex
CREATE INDEX "Risk_ownerUserId_idx" ON "Risk"("ownerUserId");

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
