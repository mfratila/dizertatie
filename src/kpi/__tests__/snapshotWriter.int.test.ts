import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { KpiType, ProjectStatus, KpiStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { persistKpiSnapshots } from '../services/snapshotWriter';

const d = (iso: string) => new Date(iso);

describe('Integration: persistKpiSnapshots()', () => {
  beforeEach(async () => {
    // Clean in FK-safe order
    await prisma.kPISnapshot.deleteMany();
    await prisma.kPIDefinition.deleteMany();
    await prisma.costEntry.deleteMany();
    await prisma.timesheet.deleteMany();
    await prisma.workItem.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates 3 KPI snapshots for a recalculation (CPI/SPI/BURN_RATE)', async () => {
    const project = await prisma.project.create({
      data: {
        name: 'Test Project KPI',
        startDate: d('2026-01-01T00:00:00Z'),
        endDate: d('2026-01-11T00:00:00Z'),
        plannedBudget: new Prisma.Decimal('1000.00'),
        status: ProjectStatus.ACTIVE,
      },
    });

    await prisma.kPIDefinition.createMany({
      data: [
        {
          projectId: project.id,
          type: KpiType.CPI,
          thresholdGreen: new Prisma.Decimal('1.00'),
          thresholdYellow: new Prisma.Decimal('0.90'),
        },
        {
          projectId: project.id,
          type: KpiType.SPI,
          thresholdGreen: new Prisma.Decimal('1.00'),
          thresholdYellow: new Prisma.Decimal('0.90'),
        },
        {
          projectId: project.id,
          type: KpiType.BURN_RATE,
          thresholdGreen: new Prisma.Decimal('0.00'),
          thresholdYellow: new Prisma.Decimal('0.00'),
        },
      ],
    });

    await prisma.workItem.createMany({
      data: [
        {
          projectId: project.id,
          name: 'WI-1',
          plannedEndDate: d('2026-01-05T00:00:00Z'),
          progressPercent: 50,
        },
        {
          projectId: project.id,
          name: 'WI-2',
          plannedEndDate: d('2026-01-10T00:00:00Z'),
          progressPercent: 100,
        },
      ],
    });

    await prisma.costEntry.createMany({
      data: [
        {
          projectId: project.id,
          date: d('2026-01-02T00:00:00Z'),
          amount: new Prisma.Decimal('100.00'),
        },
        {
          projectId: project.id,
          date: d('2026-01-06T00:00:00Z'),
          amount: new Prisma.Decimal('200.00'),
        },
      ],
    });

    const asOfDate = d('2026-01-06T00:00:00Z');

    const created = await persistKpiSnapshots(project.id, asOfDate);
    expect(created).toHaveLength(3);

    const snapshots = await prisma.kPISnapshot.findMany({
      where: { projectId: project.id, computedAt: asOfDate },
      include: { kpiDefinition: true },
      orderBy: { kpiDefinitionId: 'asc' },
    });

    console.table(
      snapshots.map((s) => ({
        type: s.kpiDefinition.type,
        value: s.value?.toString() ?? null,
        status: s.status,
        computedAt: s.computedAt.toISOString(),
        ev: s.ev?.toString() ?? null,
        pv: s.pv?.toString() ?? null,
        ac: s.ac?.toString() ?? null,
      })),
    );

    expect(snapshots).toHaveLength(3);

    const types = snapshots.map((s) => s.kpiDefinition.type);
    expect(new Set(types)).toEqual(new Set([KpiType.CPI, KpiType.SPI, KpiType.BURN_RATE]));

    for (const s of snapshots) {
      expect(s.projectId).toBe(project.id);
      expect(s.computedAt.toISOString()).toBe(asOfDate.toISOString());
      expect(Object.values(KpiStatus)).toContain(s.status);
    }
  });
});
