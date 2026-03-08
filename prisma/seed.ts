import {
  PrismaClient,
  Prisma,
  Role,
  ProjectStatus,
  KpiType,
  KpiStatus,
  WorkItemStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const ADMIN_EMAIL = 'admin@demo.local';
  const PM_EMAIL = 'pm@demo.local';
  const MEMBER_EMAIL = 'member@demo.local';
  const MEMBER_2_EMAIL = 'member2@demo.local';
  const VIEWER_EMAIL = 'viewer@demo.local';
  const PROJECT_NAME = 'Project Alpha';
  const PROJECT_2_NAME = 'Project Beta';

  const projectStart = new Date('2026-01-01T00:00:00.000Z');
  const projectEnd = new Date('2026-03-31T00:00:00.000Z');

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const pmPasswordHash = await bcrypt.hash('pm123', 10);
  const memberPasswordHash = await bcrypt.hash('member123', 10);
  const member2PasswordHash = await bcrypt.hash('member123', 10);
  const viewerPasswordHash = await bcrypt.hash('viewer132', 10);

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

  const member = await prisma.user.upsert({
    where: { email: MEMBER_EMAIL },
    update: {
      name: 'Member Demo',
      password: memberPasswordHash,
      role: Role.MEMBER,
    },
    create: {
      email: MEMBER_EMAIL,
      name: 'Member Demo',
      password: memberPasswordHash,
      role: Role.MEMBER,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: MEMBER_2_EMAIL },
    update: {
      name: 'Member Demo 2',
      password: member2PasswordHash,
      role: Role.MEMBER,
    },
    create: {
      email: MEMBER_2_EMAIL,
      name: 'Member Demo 2',
      password: member2PasswordHash,
      role: Role.MEMBER,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: VIEWER_EMAIL },
    update: {
      name: 'Viewer Demo',
      password: viewerPasswordHash,
      role: Role.VIEWER,
    },
    create: {
      email: VIEWER_EMAIL,
      name: 'Viewer Demo',
      password: viewerPasswordHash,
      role: Role.VIEWER,
    },
  });

  // 2) Projects
  const project = await prisma.project.upsert({
    where: { name: PROJECT_NAME },
    update: {
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: new Prisma.Decimal('100000.00'),
      status: ProjectStatus.ACTIVE,
    },
    create: {
      name: PROJECT_NAME,
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: new Prisma.Decimal('100000.00'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { name: PROJECT_2_NAME },
    update: {
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: new Prisma.Decimal('100000.00'),
      status: ProjectStatus.ACTIVE,
    },
    create: {
      name: PROJECT_2_NAME,
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: new Prisma.Decimal('100000.00'),
      status: ProjectStatus.ACTIVE,
    },
  });

  // 3) Project members
  // Admin does not strictly need membership if your authz gives ADMIN global bypass.
  // If you still want admin visible in project members UI, set a valid project-level role.
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

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: member.id },
    },
    update: { roleInProject: Role.MEMBER },
    create: {
      projectId: project.id,
      userId: member.id,
      roleInProject: Role.MEMBER,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: viewer.id },
    },
    update: { roleInProject: Role.VIEWER },
    create: {
      projectId: project.id,
      userId: viewer.id,
      roleInProject: Role.VIEWER,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: project2.id, userId: member2.id },
    },
    update: { roleInProject: Role.MEMBER },
    create: {
      projectId: project2.id,
      userId: member2.id,
      roleInProject: Role.MEMBER,
    },
  });

  // Optional: add admin to project members UI as PM or VIEWER if your schema does not allow ADMIN
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: admin.id },
    },
    update: { roleInProject: Role.PM },
    create: {
      projectId: project.id,
      userId: admin.id,
      roleInProject: Role.PM,
    },
  });

  // --- Cleanup demo children for idempotency ---
  const existingWorkItems = await prisma.workItem.findMany({
    where: { projectId: project.id },
    select: { id: true },
  });

  const existingWorkItemIds = existingWorkItems.map((w) => w.id);

  await prisma.$transaction(async (tx) => {
    if (existingWorkItemIds.length > 0) {
      await tx.timesheet.deleteMany({
        where: { workItemId: { in: existingWorkItemIds } },
      });
    }

    await tx.costEntry.deleteMany({ where: { projectId: project.id } });
    await tx.baseline.deleteMany({ where: { projectId: project.id } });
    await tx.kPISnapshot.deleteMany({ where: { projectId: project.id } });
    await tx.workItem.deleteMany({ where: { projectId: project.id } });
  });

  // 4) Baseline
  await prisma.baseline.create({
    data: {
      projectId: project.id,
      plannedValueTotal: new Prisma.Decimal('100000.00'),
      startDate: projectStart,
      endDate: projectEnd,
    },
  });

  // 5) WorkItems (new shape)
  const workItem1 = await prisma.workItem.create({
    data: {
      projectId: project.id,
      title: 'Design & Planning',
      description: 'Requirements definition, scope clarification and initial planning.',
      plannedStartDate: new Date('2026-01-01T00:00:00.000Z'),
      plannedEndDate: new Date('2026-01-31T00:00:00.000Z'),
      status: WorkItemStatus.IN_PROGRESS,
      progressPercent: 60,
      assignedUserId: pm.id,
    },
  });

  const workItem2 = await prisma.workItem.create({
    data: {
      projectId: project.id,
      title: 'Implementation',
      description: 'Core implementation of the MVP project features.',
      plannedStartDate: new Date('2026-02-01T00:00:00.000Z'),
      plannedEndDate: new Date('2026-03-15T00:00:00.000Z'),
      status: WorkItemStatus.IN_PROGRESS,
      progressPercent: 20,
      assignedUserId: member.id,
    },
  });

  const workItem3 = await prisma.workItem.create({
    data: {
      projectId: project.id,
      title: 'Final Validation',
      description: 'Validation, final review and readiness for KPI reporting.',
      plannedStartDate: new Date('2026-03-16T00:00:00.000Z'),
      plannedEndDate: new Date('2026-03-28T00:00:00.000Z'),
      status: WorkItemStatus.TODO,
      progressPercent: 0,
      assignedUserId: null,
    },
  });

  // Optional demo items for Project Beta so list API has data there too
  await prisma.workItem.deleteMany({
    where: { projectId: project2.id },
  });

  await prisma.workItem.createMany({
    data: [
      {
        projectId: project2.id,
        title: 'Beta Setup',
        description: 'Initial setup for Project Beta.',
        plannedStartDate: new Date('2026-01-05T00:00:00.000Z'),
        plannedEndDate: new Date('2026-01-20T00:00:00.000Z'),
        status: WorkItemStatus.DONE,
        progressPercent: 100,
        assignedUserId: member2.id,
      },
      {
        projectId: project2.id,
        title: 'Beta Analysis',
        description: 'Analysis phase for Project Beta.',
        plannedStartDate: new Date('2026-01-21T00:00:00.000Z'),
        plannedEndDate: new Date('2026-02-10T00:00:00.000Z'),
        status: WorkItemStatus.IN_PROGRESS,
        progressPercent: 40,
        assignedUserId: member2.id,
      },
    ],
  });

  // 6) Timesheets
  await prisma.timesheet.createMany({
    data: [
      {
        userId: pm.id,
        workItemId: workItem1.id,
        date: new Date('2026-01-10T00:00:00.000Z'),
        hours: new Prisma.Decimal('6.00'),
      },
      {
        userId: member.id,
        workItemId: workItem2.id,
        date: new Date('2026-02-12T00:00:00.000Z'),
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

  // 7) CostEntry
  await prisma.costEntry.create({
    data: {
      projectId: project.id,
      date: new Date('2026-01-12T00:00:00.000Z'),
      amount: new Prisma.Decimal('1500.00'),
    },
  });

  // 8) KPI definitions
  const cpiDef = await prisma.kPIDefinition.upsert({
    where: { projectId_type: { projectId: project.id, type: KpiType.CPI } },
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

  await prisma.kPIDefinition.upsert({
    where: { projectId_type: { projectId: project.id, type: KpiType.SPI } },
    update: {
      thresholdGreen: new Prisma.Decimal('1.00'),
      thresholdYellow: new Prisma.Decimal('0.90'),
    },
    create: {
      projectId: project.id,
      type: KpiType.SPI,
      thresholdGreen: new Prisma.Decimal('1.00'),
      thresholdYellow: new Prisma.Decimal('0.90'),
    },
  });

  await prisma.kPIDefinition.upsert({
    where: { projectId_type: { projectId: project.id, type: KpiType.BURN_RATE } },
    update: {
      thresholdGreen: new Prisma.Decimal('0.00'),
      thresholdYellow: new Prisma.Decimal('0.00'),
    },
    create: {
      projectId: project.id,
      type: KpiType.BURN_RATE,
      thresholdGreen: new Prisma.Decimal('0.00'),
      thresholdYellow: new Prisma.Decimal('0.00'),
    },
  });

  // 9) KPI snapshot
  await prisma.kPISnapshot.create({
    data: {
      projectId: project.id,
      kpiDefinitionId: cpiDef.id,
      value: new Prisma.Decimal('0.95'),
      status: KpiStatus.YELLOW,
      computedAt: new Date('2026-01-13T00:00:00.000Z'),
    },
  });

  console.log(
    'Seed completed: demo users, projects, memberships, work items, baseline and KPI data.',
  );
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
