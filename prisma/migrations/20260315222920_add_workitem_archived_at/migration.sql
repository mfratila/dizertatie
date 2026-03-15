-- AlterTable
ALTER TABLE "WorkItem" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WorkItem_archivedAt_idx" ON "WorkItem"("archivedAt");
