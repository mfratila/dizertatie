import { getProjectBaselineForKpi, toPVInput } from "../services/projectKpiInputs";
import { calculatePVLinear } from "./pv";

// exemplu: doar PV step
export async function computePVForProject(projectId: number, asOfDate: Date) {
    const baseline = await getProjectBaselineForKpi({ projectId, asOfDate });
    const pvResult = calculatePVLinear(toPVInput(baseline));
    return pvResult;
}