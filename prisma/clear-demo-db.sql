BEGIN;

TRUNCATE TABLE
  "Timesheet",
  "KPISnapshot",
  "KPIDefinition",
  "Risk",
  "CostEntry",
  "Baseline",
  "WorkItem",
  "ProjectMember",
  "Project",
  "User"
RESTART IDENTITY CASCADE;

COMMIT;