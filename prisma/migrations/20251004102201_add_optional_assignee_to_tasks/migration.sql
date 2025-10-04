/*
  Warnings:

  - You are about to drop the column `priority` on the `tasks` table. All the data in the column will be lost.
  - The `status` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `task_assignees` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."task_assignees" DROP CONSTRAINT "task_assignees_taskId_fkey";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "priority",
ADD COLUMN     "assigneeId" UUID,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'TODO';

-- DropTable
DROP TABLE "public"."task_assignees";

-- DropEnum
DROP TYPE "public"."TaskPriority";

-- DropEnum
DROP TYPE "public"."TaskStatus";

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
