import { prisma } from '@/lib/prisma';
import { KpiStatus, KpiType, Prisma, Role } from '@prisma/client';

export class PortfolioDashboardError extends Error {}
export class InvalidViewerError extends Error {}

export type PortfolioLatestKpiItem = {
  type: KpiType;
  value: number | null;
  status: KpiStatus;
  computedAt: string;
};

export type PortfolioProjectItem = {
  projectId: number;
  name: string;
  status: string;
  latestKpis: {
    CPI: PortfolioLatestKpiItem | null;
    SPI: PortfolioLatestKpiItem | null;
    BURN_RATE: PortfolioLatestKpiItem | null;
  };
  overallHealth: KpiStatus;
};

export type PortfolioDashboardResponse = {
  items: PortfolioProjectItem[];
};

type ViewerContext = {
  userId: number;
  role: Role;
};

function decimalToNumberOrNull(value: Prisma.Decimal | number | null): number | null {
  if (value === null) return null;

  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function emptyLatestKpis(): PortfolioProjectItem['latestKpis'] {
  return {
    CPI: null,
    SPI: null,
    BURN_RATE: null,
  };
}

/**
 * Deterministic aggregated health:
 * RED > YELLOW > GREEN > NA
 */
export function aggregateOverallHealth(statuses: Array<KpiStatus | null | undefined>): KpiStatus {
  if (statuses.includes('RED')) return 'RED';
  if (statuses.includes('YELLOW')) return 'YELLOW';
  if (statuses.includes('GREEN')) return 'GREEN';
  return 'NA';
}

export async function getPortfolioDashboardData(
  viewer: ViewerContext,
): Promise<PortfolioDashboardResponse> {
  const { userId, role } = viewer;

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new InvalidViewerError('viewer.userId must be a positive integer.');
  }

  const isAdmin = role === 'ADMIN';

  const projects = await prisma.project.findMany({
    where: {
      archivedAt: null,
      ...(isAdmin
        ? {}
        : {
            members: {
              some: {
                userId,
              },
            },
          }),
    },
    select: {
      id: true,
      name: true,
      status: true,
      kpiDefinitions: {
        select: {
          id: true,
          type: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  if (projects.length === 0) {
    return { items: [] };
  }

  const items = await Promise.all(
    projects.map(async (project) => {
      const latestKpis = emptyLatestKpis();

      const latestRows = await Promise.all(
        project.kpiDefinitions.map(async (def) => {
          const snapshot = await prisma.kPISnapshot.findFirst({
            where: {
              projectId: project.id,
              kpiDefinitionId: def.id,
            },
            orderBy: {
              computedAt: 'desc',
            },
            select: {
              value: true,
              status: true,
              computedAt: true,
            },
          });

          return {
            type: def.type,
            snapshot,
          };
        }),
      );

      for (const row of latestRows) {
        if (!row.snapshot) {
          latestKpis[row.type] = null;
          continue;
        }

        latestKpis[row.type] = {
          type: row.type,
          value: decimalToNumberOrNull(row.snapshot.value),
          status: row.snapshot.status,
          computedAt: row.snapshot.computedAt.toISOString(),
        };
      }

      const overallHealth = aggregateOverallHealth([
        latestKpis.CPI?.status,
        latestKpis.SPI?.status,
        latestKpis.BURN_RATE?.status,
      ]);

      return {
        projectId: project.id,
        name: project.name,
        status: project.status,
        latestKpis,
        overallHealth,
      };
    }),
  );

  return { items };
}