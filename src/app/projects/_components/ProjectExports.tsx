type ProjectExportsProps = {
  projectId: number;
};

function buildExportUrl(projectId: number, file: 'kpi-snapshots' | 'costs' | 'timesheets') {
  return `/api/projects/${projectId}/${file}.csv`;
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  minHeight: 40,
};

export function ProjectExports({ projectId }: ProjectExportsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <a href={buildExportUrl(projectId, 'kpi-snapshots')} style={linkStyle}>
        Export KPI history (CSV)
      </a>
      <a href={buildExportUrl(projectId, 'costs')} style={linkStyle}>
        Export Costs (CSV)
      </a>
      <a href={buildExportUrl(projectId, 'timesheets')} style={linkStyle}>
        Export Timesheets (CSV)
      </a>
    </div>
  );
}