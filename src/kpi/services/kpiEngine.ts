import { computeAC } from './projectAC';
import { computeEVForProject } from './projectEV';
import { getProjectBaselineForKpi, toPVInput } from './projectKpiInputs';
import { calculatePVLinear } from '../engine/pv';
import { calculateCPI, calculateSPI, calculateBurnRate } from '../engine/kpis';

export async function computeKpis(projectId: number, asOfDate: Date) {
  // 1. Get baseline ( BAC + start/end)
  const baseline = await getProjectBaselineForKpi({ projectId, asOfDate });

  // 2.Compute PV
  const pvResult = calculatePVLinear(toPVInput(baseline));

  // 3. Compute EV
  const { ev, progress } = await computeEVForProject(projectId);

  // 4. Compute AC
  const ac = await computeAC(projectId, asOfDate);

  // Compute KPIs
  const cpi = calculateCPI(ev, ac);
  const spi = calculateSPI(ev, pvResult.pv);
  const burnRate = calculateBurnRate(ac, baseline.startDate, asOfDate);

  return {
    ev,
    pv: pvResult.pv,
    ac,
    cpi,
    spi,
    burnRate,
    progress,
  };
}
