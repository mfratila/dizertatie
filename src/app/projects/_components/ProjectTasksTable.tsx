import { formatWorkItemDate } from "../_utils/utils";

type WorkItemRow = {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  plannedStartDate: string | Date | null;
  plannedEndDate: string | Date;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  progressPercent: number;
  assignedUserId: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  assignedUser: {
    id: number;
    name: string;
    email: string;
  } | null;
};

function formatStatus(status: WorkItemRow['status']) {
  switch (status) {
    case 'TODO':
      return 'TODO';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'DONE':
      return 'Done';
    default:
      return status;
  }
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-28 overflow-hidden rounded bg-gray-200">
        <div
          className="h-full rounded bg-black"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm text-gray-700">{value}%</span>
    </div>
  );
}

export function ProjectTasksTable({ items }: { items: WorkItemRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-gray-600">
        No work items found for this project.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium">Planned end</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{item.title}</div>
                {item.description ? (
                  <div className="mt-1 text-xs text-gray-500">
                    {item.description}
                  </div>
                ) : null}
              </td>

              <td className="px-4 py-3 text-gray-700">
                {formatStatus(item.status)}
              </td>

              <td className="px-4 py-3">
                <ProgressBar value={item.progressPercent} />
              </td>

              <td className="px-4 py-3 text-gray-700">
                {formatWorkItemDate(item.plannedEndDate)}
              </td>

              <td className="px-4 py-3 text-gray-700">
                {item.assignedUser?.name ?? 'Unassigned'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}