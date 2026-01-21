import { PrismaClient, Prisma, Role, ProjectStatus, KpiType, KpiStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // --- Demo constants (MVP) ---
  const ADMIN_EMAIL = 'admin@demo.local';
  const PM_EMAIL = 'pm@demo.local';
  const PROJECT_NAME = 'Project Alpha';

  // Deterministic timeframe for demo
  const projectStart = new Date('2026-01-01T00:00:00.000Z');
  const projectEnd = new Date('2026-03-31T00:00:00.000Z');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const pmPasswordHash = await bcrypt.hash('pm123', 10);


  // 1) Users
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: 'Admin Demo',
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
    create: {
      email: ADMIN_EMAIL,
      name: 'Admin Demo',
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: PM_EMAIL },
    update: {
      name: 'Project Manager Demo',
      password: pmPasswordHash,
      role: Role.PM,
    },
    create: {
      email: PM_EMAIL,
      name: 'Project Manager Demo',
      password: pmPasswordHash,
      role: Role.PM,
    },
  });

  // 2) Project
  const project = await prisma.project.upsert({
    where: { name: PROJECT_NAME },
    update: {
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: new Prisma.Decimal('100000.00'), // BAC
      status: ProjectStatus.ACTIVE,
    },
    create: {
      name: PROJECT_NAME,
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: new Prisma.Decimal('100000.00'), // BAC
      status: ProjectStatus.ACTIVE,
    },
  });

  // 3) Project members (User ↔ Project via ProjectMember)
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: admin.id },
    },
    update: { roleInProject: Role.ADMIN },
    create: {
      projectId: project.id,
      userId: admin.id,
      roleInProject: Role.ADMIN,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: pm.id },
    },
    update: { roleInProject: Role.PM },
    create: {
      projectId: project.id,
      userId: pm.id,
      roleInProject: Role.PM,
    },
  });

  // --- Cleanup demo children for idempotency ---
  // WorkItem has no unique constraint; easiest is delete/recreate children under this project.
  const existingWorkItems = await prisma.workItem.findMany({
    where: { projectId: project.id },
    select: { id: true },
  });
  const existingWorkItemIds = existingWorkItems.map((w) => w.id);

  await prisma.$transaction(async (tx) => {
    // Timesheets depend on WorkItem
    if (existingWorkItemIds.length > 0) {
      await tx.timesheet.deleteMany({
        where: { workItemId: { in: existingWorkItemIds } },
      });
    }

    // Cost entries depend on Project
    await tx.costEntry.deleteMany({ where: { projectId: project.id } });

    // Baseline depends on Project (not unique in schema)
    await tx.baseline.deleteMany({ where: { projectId: project.id } });

    // KPI snapshots depend on KPIDefinition (and Project)
    await tx.kPISnapshot.deleteMany({ where: { projectId: project.id } });

    // Work items last
    await tx.workItem.deleteMany({ where: { projectId: project.id } });
  });

  // 4) Baseline (1) — PV total (minimal)
  // MVP choice: plannedValueTotal mirrors BAC for simplicity in demo.
  await prisma.baseline.create({
    data: {
      projectId: project.id,
      plannedValueTotal: new Prisma.Decimal('100000.00'),
      startDate: projectStart,
      endDate: projectEnd,
    },
  });

  // 5) WorkItems (2)
  const workItem1 = await prisma.workItem.create({
    data: {
      projectId: project.id,
      name: 'Design & Planning',
      plannedEndDate: new Date('2026-01-31T00:00:00.000Z'),
      progressPercent: 60,
    },
  });

  const workItem2 = await prisma.workItem.create({
    data: {
      projectId: project.id,
      name: 'Implementation',
      plannedEndDate: new Date('2026-03-15T00:00:00.000Z'),
      progressPercent: 20,
    },
  });

  // 6) Timesheets (a few)
  await prisma.timesheet.createMany({
    data: [
      {
        userId: pm.id,
        workItemId: workItem1.id,
        date: new Date('2026-01-10T00:00:00.000Z'),
        hours: new Prisma.Decimal('6.00'),
      },
      {
        userId: pm.id,
        workItemId: workItem2.id,
        date: new Date('2026-01-12T00:00:00.000Z'),
        hours: new Prisma.Decimal('4.00'),
      },
      {
        userId: pm.id,
        workItemId: workItem1.id,
        date: new Date('2026-01-15T00:00:00.000Z'),
        hours: new Prisma.Decimal('3.50'),
      },
    ],
  });

  // 7) CostEntry (1)
  await prisma.costEntry.create({
    data: {
      projectId: project.id,
      date: new Date('2026-01-12T00:00:00.000Z'),
      amount: new Prisma.Decimal('1500.00'),
    },
  });

  // 8) KPIDefinition (CPI)
  const cpiDef = await prisma.kPIDefinition.upsert({
    where: {
      projectId_type: { projectId: project.id, type: KpiType.CPI },
    },
    update: {
      thresholdGreen: new Prisma.Decimal('1.00'),
      thresholdYellow: new Prisma.Decimal('0.90'),
    },
    create: {
      projectId: project.id,
      type: KpiType.CPI,
      thresholdGreen: new Prisma.Decimal('1.00'),
      thresholdYellow: new Prisma.Decimal('0.90'),
    },
  });

  // 9) KPISnapshot (1) — minimal history record for CPI
  // The KPI value here is illustrative; actual computation will be a later story.
  await prisma.kPISnapshot.create({
    data: {
      projectId: project.id,
      kpiDefinitionId: cpiDef.id,
      value: new Prisma.Decimal('0.95'),
      status: KpiStatus.YELLOW,
      computedAt: new Date('2026-01-13T00:00:00.000Z'),
    },
  });

  console.log('Seed completed: EPIC 2 demo domain data (incl. Baseline + KPISnapshot).');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
