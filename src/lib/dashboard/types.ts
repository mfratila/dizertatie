export type RagStatus = 'GREEN' | 'YELLOW' | 'RED' | 'NA';

export type PortfolioLatestKpiItem = {
  type: 'CPI' | 'SPI' | 'BURN_RATE';
  value: number | null;
  status: RagStatus;
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
  overallHealth: RagStatus;
};

export type PortfolioDashboardResponse = {
  items: PortfolioProjectItem[];
};