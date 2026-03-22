import {
  PrismaClient,
  Prisma,
  Role,
  ProjectStatus,
  KpiType,
  KpiStatus,
  WorkItemStatus,
  RiskStatus,
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
  const viewerPasswordHash = await bcrypt.hash('viewer123', 10);

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
      projectId_userId: { projectId: project.id, userId: member2.id },
    },
    update: { roleInProject: Role.MEMBER },
    create: {
      projectId: project.id,
      userId: member2.id,
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

  // optional: admin visible in project members UI
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

    await tx.risk.deleteMany({ where: { projectId: project.id } });
    await tx.costEntry.deleteMany({ where: { projectId: project.id } });
    await tx.baseline.deleteMany({ where: { projectId: project.id } });
    await tx.kPISnapshot.deleteMany({ where: { projectId: project.id } });
    await tx.workItem.deleteMany({ where: { projectId: project.id } });
  });

  // Optional cleanup for Project Beta work items
  await prisma.workItem.deleteMany({
    where: { projectId: project2.id },
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

  // 5) WorkItems - Project Alpha
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

  // 5b) WorkItems - Project Beta
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

  // 6) Timesheets - Project Alpha
  await prisma.timesheet.createMany({
    data: [
      {
        userId: pm.id,
        workItemId: workItem1.id,
        date: new Date('2026-01-10T00:00:00.000Z'),
        hours: new Prisma.Decimal('6.00'),
        note: 'Planning workshop and backlog clarification.',
      },
      {
        userId: member.id,
        workItemId: workItem1.id,
        date: new Date('2026-01-10T00:00:00.000Z'),
        hours: new Prisma.Decimal('4.00'),
        note: 'Support for requirements review.',
      },
      {
        userId: pm.id,
        workItemId: workItem1.id,
        date: new Date('2026-01-11T00:00:00.000Z'),
        hours: new Prisma.Decimal('5.50'),
        note: 'Scope refinement and milestone discussion.',
      },
      {
        userId: member.id,
        workItemId: workItem1.id,
        date: new Date('2026-01-11T00:00:00.000Z'),
        hours: new Prisma.Decimal('3.50'),
        note: 'Draft updates for planning artifacts.',
      },
      {
        userId: member.id,
        workItemId: workItem2.id,
        date: new Date('2026-02-12T00:00:00.000Z'),
        hours: new Prisma.Decimal('6.00'),
        note: 'Implementation of MVP module.',
      },
      {
        userId: member2.id,
        workItemId: workItem2.id,
        date: new Date('2026-02-12T00:00:00.000Z'),
        hours: new Prisma.Decimal('5.00'),
        note: 'Support implementation and testing.',
      },
      {
        userId: member.id,
        workItemId: workItem2.id,
        date: new Date('2026-02-13T00:00:00.000Z'),
        hours: new Prisma.Decimal('7.00'),
        note: 'Continue implementation and bug fixes.',
      },
      {
        userId: member2.id,
        workItemId: workItem2.id,
        date: new Date('2026-02-13T00:00:00.000Z'),
        hours: new Prisma.Decimal('4.50'),
        note: 'Integration support and validation.',
      },
    ],
  });

  // 7) Cost entries - Project Alpha (source for AC)
  await prisma.costEntry.createMany({
    data: [
      {
        projectId: project.id,
        date: new Date('2026-01-12T00:00:00.000Z'),
        amount: new Prisma.Decimal('1500.00'),
        category: 'Labor',
        note: 'Initial planning and coordination effort.',
      },
      {
        projectId: project.id,
        date: new Date('2026-02-14T00:00:00.000Z'),
        amount: new Prisma.Decimal('3200.00'),
        category: 'Labor',
        note: 'Implementation phase effort.',
      },
      {
        projectId: project.id,
        date: new Date('2026-02-20T00:00:00.000Z'),
        amount: new Prisma.Decimal('800.00'),
        category: 'Tools',
        note: 'Tooling and software subscriptions.',
      },
      {
        projectId: project.id,
        date: new Date('2026-03-05T00:00:00.000Z'),
        amount: new Prisma.Decimal('1200.00'),
        category: 'Other',
        note: 'Validation and miscellaneous execution costs.',
      },
    ],
  });

  // 8) Risks - Project Alpha
  await prisma.risk.createMany({
    data: [
      {
        projectId: project.id,
        title: 'Requirements may change during implementation',
        probability: 4,
        impact: 4,
        status: RiskStatus.OPEN,
        ownerUserId: pm.id,
        note: 'Open risk related to evolving stakeholder expectations.',
      },
      {
        projectId: project.id,
        title: 'Delay in environment setup',
        probability: 2,
        impact: 3,
        status: RiskStatus.CLOSED,
        ownerUserId: member.id,
        note: 'Closed after environment configuration was stabilized.',
      },
    ],
  });

  // 9) KPI definitions
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

  // 10) KPI snapshot demo
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
    'Seed completed: demo users, projects, memberships, work items, timesheets, cost entries, risks, baseline and KPI data.',
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