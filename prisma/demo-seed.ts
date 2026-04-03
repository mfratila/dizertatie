import {
  PrismaClient,
  Prisma,
  Role,
  ProjectStatus,
  WorkItemStatus,
  KpiType,
  KpiStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function toStatus(value: number | null, greenMin: number, yellowMin: number): KpiStatus {
  if (value === null) return KpiStatus.NA;
  if (value >= greenMin) return KpiStatus.GREEN;
  if (value >= yellowMin) return KpiStatus.YELLOW;
  return KpiStatus.RED;
}

async function main() {
  const ADMIN_EMAIL = 'admin@demo.local';
  const PM_EMAIL = 'pm@demo.local';
  const MEMBER_EMAIL = 'member@demo.local';
  const MEMBER_2_EMAIL = 'member2@demo.local';
  const VIEWER_EMAIL = 'viewer@demo.local';

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const pmPasswordHash = await bcrypt.hash('pm123', 10);
  const memberPasswordHash = await bcrypt.hash('member123', 10);
  const member2PasswordHash = await bcrypt.hash('member123', 10);
  const viewerPasswordHash = await bcrypt.hash('viewer123', 10);

  const projectStart = new Date('2026-01-01T00:00:00.000Z');
  const projectEnd = new Date('2026-03-31T00:00:00.000Z');
  const bac = new Prisma.Decimal('100000.00');

  // -----------------------------
  // 1. USERS
  // -----------------------------
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

  // -----------------------------
  // 2. PROJECTS
  // -----------------------------
  const projectAlpha = await prisma.project.upsert({
    where: { name: 'Project Alpha' },
    update: {
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: bac,
      status: ProjectStatus.ACTIVE,
    },
    create: {
      name: 'Project Alpha',
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: bac,
      status: ProjectStatus.ACTIVE,
    },
  });

  const projectBeta = await prisma.project.upsert({
    where: { name: 'Project Beta' },
    update: {
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: new Prisma.Decimal('60000.00'),
      status: ProjectStatus.ACTIVE,
    },
    create: {
      name: 'Project Beta',
      startDate: projectStart,
      endDate: projectEnd,
      plannedBudget: new Prisma.Decimal('60000.00'),
      status: ProjectStatus.ACTIVE,
    },
  });

  // -----------------------------
  // 3. MEMBERSHIPS
  // -----------------------------
  const memberships = [
    { projectId: projectAlpha.id, userId: admin.id, roleInProject: Role.PM },
    { projectId: projectAlpha.id, userId: pm.id, roleInProject: Role.PM },
    { projectId: projectAlpha.id, userId: member.id, roleInProject: Role.MEMBER },
    { projectId: projectAlpha.id, userId: member2.id, roleInProject: Role.MEMBER },
    { projectId: projectAlpha.id, userId: viewer.id, roleInProject: Role.VIEWER },

    { projectId: projectBeta.id, userId: admin.id, roleInProject: Role.PM },
    { projectId: projectBeta.id, userId: member2.id, roleInProject: Role.MEMBER },
  ];

  for (const m of memberships) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: m.projectId,
          userId: m.userId,
        },
      },
      update: { roleInProject: m.roleInProject },
      create: m,
    });
  }

  // -----------------------------
  // 4. CLEANUP CHILDREN (IDEMPOTENT)
  // -----------------------------
  const alphaWorkItems = await prisma.workItem.findMany({
    where: { projectId: projectAlpha.id },
    select: { id: true },
  });

  const alphaWorkItemIds = alphaWorkItems.map((w) => w.id);

  await prisma.$transaction(async (tx) => {
    if (alphaWorkItemIds.length > 0) {
      await tx.timesheet.deleteMany({
        where: { workItemId: { in: alphaWorkItemIds } },
      });
    }

    await tx.kPISnapshot.deleteMany({ where: { projectId: projectAlpha.id } });
    await tx.costEntry.deleteMany({ where: { projectId: projectAlpha.id } });
    await tx.baseline.deleteMany({ where: { projectId: projectAlpha.id } });
    await tx.workItem.deleteMany({ where: { projectId: projectAlpha.id } });

    await tx.kPISnapshot.deleteMany({ where: { projectId: projectBeta.id } });
    await tx.costEntry.deleteMany({ where: { projectId: projectBeta.id } });
    await tx.baseline.deleteMany({ where: { projectId: projectBeta.id } });
    await tx.workItem.deleteMany({ where: { projectId: projectBeta.id } });
  });

  // -----------------------------
  // 5. BASELINE
  // -----------------------------
  await prisma.baseline.create({
    data: {
      projectId: projectAlpha.id,
      plannedValueTotal: bac,
      startDate: projectStart,
      endDate: projectEnd,
    },
  });

  await prisma.baseline.create({
    data: {
      projectId: projectBeta.id,
      plannedValueTotal: new Prisma.Decimal('60000.00'),
      startDate: projectStart,
      endDate: projectEnd,
    },
  });

  // -----------------------------
  // 6. WORK ITEMS — PROJECT ALPHA
  // final progress = moment 2
  // -----------------------------
  const w1 = await prisma.workItem.create({
    data: {
      projectId: projectAlpha.id,
      title: 'Initiation & Scope',
      description: 'Project initiation, scope clarification and kickoff.',
      plannedStartDate: new Date('2026-01-01T00:00:00.000Z'),
      plannedEndDate: new Date('2026-01-15T00:00:00.000Z'),
      status: WorkItemStatus.DONE,
      progressPercent: 100,
      assignedUserId: pm.id,
    },
  });

  const w2 = await prisma.workItem.create({
    data: {
      projectId: projectAlpha.id,
      title: 'Requirements & Analysis',
      description: 'Requirements gathering and business analysis.',
      plannedStartDate: new Date('2026-01-10T00:00:00.000Z'),
      plannedEndDate: new Date('2026-01-31T00:00:00.000Z'),
      status: WorkItemStatus.DONE,
      progressPercent: 100,
      assignedUserId: member.id,
    },
  });

  const w3 = await prisma.workItem.create({
    data: {
      projectId: projectAlpha.id,
      title: 'Core Implementation',
      description: 'Implementation of the main project functionality.',
      plannedStartDate: new Date('2026-02-01T00:00:00.000Z'),
      plannedEndDate: new Date('2026-02-28T00:00:00.000Z'),
      status: WorkItemStatus.IN_PROGRESS,
      progressPercent: 70,
      assignedUserId: member.id,
    },
  });

  const w4 = await prisma.workItem.create({
    data: {
      projectId: projectAlpha.id,
      title: 'KPI & Reporting Integration',
      description: 'KPI integration and reporting/dashboard alignment.',
      plannedStartDate: new Date('2026-02-15T00:00:00.000Z'),
      plannedEndDate: new Date('2026-03-15T00:00:00.000Z'),
      status: WorkItemStatus.IN_PROGRESS,
      progressPercent: 50,
      assignedUserId: member2.id,
    },
  });

  const w5 = await prisma.workItem.create({
    data: {
      projectId: projectAlpha.id,
      title: 'Final Validation',
      description: 'Final validation and readiness checks.',
      plannedStartDate: new Date('2026-03-01T00:00:00.000Z'),
      plannedEndDate: new Date('2026-03-28T00:00:00.000Z'),
      status: WorkItemStatus.TODO,
      progressPercent: 10,
      assignedUserId: pm.id,
    },
  });

  // project beta minimal data
  await prisma.workItem.createMany({
    data: [
      {
        projectId: projectBeta.id,
        title: 'Beta Setup',
        description: 'Initial setup for Project Beta.',
        plannedStartDate: new Date('2026-01-05T00:00:00.000Z'),
        plannedEndDate: new Date('2026-01-20T00:00:00.000Z'),
        status: WorkItemStatus.DONE,
        progressPercent: 100,
        assignedUserId: member2.id,
      },
      {
        projectId: projectBeta.id,
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

  // -----------------------------
  // 7. TIMESHEETS — PROJECT ALPHA
  // -----------------------------
  await prisma.timesheet.createMany({
    data: [
      {
        userId: pm.id,
        workItemId: w1.id,
        date: new Date('2026-01-12T00:00:00.000Z'),
        hours: new Prisma.Decimal('6.00'),
        note: 'Scope review and kickoff alignment.',
      },
      {
        userId: member.id,
        workItemId: w2.id,
        date: new Date('2026-01-13T00:00:00.000Z'),
        hours: new Prisma.Decimal('5.00'),
        note: 'Requirements detailing.',
      },
      {
        userId: member.id,
        workItemId: w3.id,
        date: new Date('2026-02-06T00:00:00.000Z'),
        hours: new Prisma.Decimal('7.00'),
        note: 'Core implementation work.',
      },
      {
        userId: member2.id,
        workItemId: w4.id,
        date: new Date('2026-02-18T00:00:00.000Z'),
        hours: new Prisma.Decimal('4.00'),
        note: 'KPI integration work.',
      },
      {
        userId: member.id,
        workItemId: w3.id,
        date: new Date('2026-02-25T00:00:00.000Z'),
        hours: new Prisma.Decimal('6.00'),
        note: 'Refactoring after issues.',
      },
      {
        userId: member2.id,
        workItemId: w4.id,
        date: new Date('2026-02-26T00:00:00.000Z'),
        hours: new Prisma.Decimal('5.00'),
        note: 'Reporting improvements.',
      },
    ],
  });

  // -----------------------------
  // 8. COST ENTRIES — PROJECT ALPHA
  // complete set (moment 1 + moment 2)
  // -----------------------------
  await prisma.costEntry.createMany({
    data: [
      {
        projectId: projectAlpha.id,
        date: new Date('2026-01-20T00:00:00.000Z'),
        amount: new Prisma.Decimal('12000.00'),
        category: 'Labor',
        note: 'Analysis effort',
      },
      {
        projectId: projectAlpha.id,
        date: new Date('2026-02-05T00:00:00.000Z'),
        amount: new Prisma.Decimal('8000.00'),
        category: 'Tools',
        note: 'Tooling and subscriptions',
      },
      {
        projectId: projectAlpha.id,
        date: new Date('2026-02-10T00:00:00.000Z'),
        amount: new Prisma.Decimal('10000.00'),
        category: 'Labor',
        note: 'Initial implementation effort',
      },
      {
        projectId: projectAlpha.id,
        date: new Date('2026-02-20T00:00:00.000Z'),
        amount: new Prisma.Decimal('12000.00'),
        category: 'Labor',
        note: 'Extra implementation effort',
      },
      {
        projectId: projectAlpha.id,
        date: new Date('2026-02-24T00:00:00.000Z'),
        amount: new Prisma.Decimal('8000.00'),
        category: 'Other',
        note: 'Unexpected integration overhead',
      },
    ],
  });

  await prisma.costEntry.createMany({
    data: [
      {
        projectId: projectBeta.id,
        date: new Date('2026-01-25T00:00:00.000Z'),
        amount: new Prisma.Decimal('5000.00'),
        category: 'Labor',
        note: 'Beta labor cost',
      },
      {
        projectId: projectBeta.id,
        date: new Date('2026-02-15T00:00:00.000Z'),
        amount: new Prisma.Decimal('4000.00'),
        category: 'Tools',
        note: 'Beta tooling',
      },
    ],
  });

  // -----------------------------
  // 9. KPI DEFINITIONS
  // -----------------------------
  const kpiDefs = [
    {
      projectId: projectAlpha.id,
      type: KpiType.CPI,
      thresholdGreen: new Prisma.Decimal('1.00'),
      thresholdYellow: new Prisma.Decimal('0.90'),
    },
    {
      projectId: projectAlpha.id,
      type: KpiType.SPI,
      thresholdGreen: new Prisma.Decimal('1.00'),
      thresholdYellow: new Prisma.Decimal('0.90'),
    },
    {
      projectId: projectAlpha.id,
      type: KpiType.BURN_RATE,
      // pentru Burn Rate, în MVP îl tratăm descriptiv;
      // păstrăm praguri simple doar pentru consistența motorului
      thresholdGreen: new Prisma.Decimal('800.00'),
      thresholdYellow: new Prisma.Decimal('1000.00'),
    },
  ];

  for (const def of kpiDefs) {
    await prisma.kPIDefinition.upsert({
      where: {
        projectId_type: {
          projectId: def.projectId,
          type: def.type,
        },
      },
      update: {
        thresholdGreen: def.thresholdGreen,
        thresholdYellow: def.thresholdYellow,
      },
      create: def,
    });
  }

  const alphaCpiDef = await prisma.kPIDefinition.findUniqueOrThrow({
    where: { projectId_type: { projectId: projectAlpha.id, type: KpiType.CPI } },
  });

  const alphaSpiDef = await prisma.kPIDefinition.findUniqueOrThrow({
    where: { projectId_type: { projectId: projectAlpha.id, type: KpiType.SPI } },
  });

  const alphaBurnDef = await prisma.kPIDefinition.findUniqueOrThrow({
    where: { projectId_type: { projectId: projectAlpha.id, type: KpiType.BURN_RATE } },
  });

  // -----------------------------
  // 10. KPI SNAPSHOTS — PROJECT ALPHA
  // MOMENT 1 and MOMENT 2
  // -----------------------------
  // Moment 1 (asOf 2026-02-15)
  const ev1 = new Prisma.Decimal('48000.00');
  const pv1 = new Prisma.Decimal('50000.00');
  const ac1 = new Prisma.Decimal('30000.00');
  const cpi1 = 48000 / 30000; // 1.6
  const spi1 = 48000 / 50000; // 0.96
  const burn1 = 30000 / 45; // 666.67

  // Moment 2 (asOf 2026-02-28)
  const ev2 = new Prisma.Decimal('66000.00');
  const pv2 = new Prisma.Decimal('64444.44');
  const ac2 = new Prisma.Decimal('50000.00');
  const cpi2 = 66000 / 50000; // 1.32
  const spi2 = 66000 / 64444.44; // ~1.024
  const burn2 = 50000 / 58; // ~862.07

  const snapshots = [
    {
      projectId: projectAlpha.id,
      kpiDefinitionId: alphaCpiDef.id,
      computedAt: new Date('2026-02-15T09:00:00.000Z'),
      value: new Prisma.Decimal(cpi1.toFixed(6)),
      status: toStatus(cpi1, 1.0, 0.9),
      ev: ev1,
      pv: pv1,
      ac: ac1,
    },
    {
      projectId: projectAlpha.id,
      kpiDefinitionId: alphaSpiDef.id,
      computedAt: new Date('2026-02-15T09:00:00.000Z'),
      value: new Prisma.Decimal(spi1.toFixed(6)),
      status: toStatus(spi1, 1.0, 0.9),
      ev: ev1,
      pv: pv1,
      ac: ac1,
    },
    {
      projectId: projectAlpha.id,
      kpiDefinitionId: alphaBurnDef.id,
      computedAt: new Date('2026-02-15T09:00:00.000Z'),
      value: new Prisma.Decimal(burn1.toFixed(6)),
      // pentru burn rate tratat descriptiv, stabilim manual o stare utilă demo-ului
      status: KpiStatus.GREEN,
      ev: ev1,
      pv: pv1,
      ac: ac1,
    },
    {
      projectId: projectAlpha.id,
      kpiDefinitionId: alphaCpiDef.id,
      computedAt: new Date('2026-02-28T09:00:00.000Z'),
      value: new Prisma.Decimal(cpi2.toFixed(6)),
      status: toStatus(cpi2, 1.0, 0.9),
      ev: ev2,
      pv: pv2,
      ac: ac2,
    },
    {
      projectId: projectAlpha.id,
      kpiDefinitionId: alphaSpiDef.id,
      computedAt: new Date('2026-02-28T09:00:00.000Z'),
      value: new Prisma.Decimal(spi2.toFixed(6)),
      status: toStatus(spi2, 1.0, 0.9),
      ev: ev2,
      pv: pv2,
      ac: ac2,
    },
    {
      projectId: projectAlpha.id,
      kpiDefinitionId: alphaBurnDef.id,
      computedAt: new Date('2026-02-28T09:00:00.000Z'),
      value: new Prisma.Decimal(burn2.toFixed(6)),
      status: KpiStatus.YELLOW,
      ev: ev2,
      pv: pv2,
      ac: ac2,
    },
  ];

  await prisma.kPISnapshot.createMany({
    data: snapshots,
  });

  console.log('✅ Demo seed completed successfully');
  console.log('Users: admin@demo.local / pm@demo.local / member@demo.local / viewer@demo.local');
  console.log('Project Alpha prepared with baseline, 5 tasks, costs, timesheets and 2 KPI moments.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });