import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface Row {
  id: string;
  name: string;
  date: string;
  files: number;
  status: 'Completed' | 'Failed' | 'Processing';
  duration: string;
}

export default function DepartmentAnalysesList() {
  const navigate = useNavigate();
  const { id } = useParams();
  const departmentId = (id as string) || '';
  const [q, setQ] = useState('');
  const rows: Row[] = [
    { id: '1', name: 'Weekly Review', date: '2025-07-21', files: 128, status: 'Completed', duration: '14m 20s' },
    { id: '2', name: 'Script Audit', date: '2025-07-17', files: 76, status: 'Failed', duration: '—' },
    { id: '3', name: 'CSAT Pulse', date: '2025-07-14', files: 93, status: 'Processing', duration: '—' },
    { id: '4', name: 'Onboarding QA', date: '2025-07-10', files: 45, status: 'Completed', duration: '9m 03s' },
    { id: '5', name: 'Retention Deep Dive', date: '2025-07-03', files: 152, status: 'Completed', duration: '22m 11s' },
    { id: '6', name: 'Escalations', date: '2025-06-29', files: 61, status: 'Completed', duration: '11m 47s' },
    { id: '7', name: 'Monthly Rollup', date: '2025-06-22', files: 201, status: 'Completed', duration: '32m 02s' },
    { id: '8', name: 'Training Impact', date: '2025-06-15', files: 37, status: 'Failed', duration: '—' },
    { id: '9', name: 'Promotion Campaign', date: '2025-06-09', files: 84, status: 'Completed', duration: '16m 55s' },
    { id: '10', name: 'NPS Follow-ups', date: '2025-06-02', files: 58, status: 'Completed', duration: '12m 10s' },
  ];

  const filtered = useMemo(() =>
    rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase())), [q]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(`/call-analyzer/departments/${departmentId}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to department
        </Button>
        <h1 className="heading-display text-foreground mt-2">Previous Analyses</h1>
        <p className="text-muted-foreground mt-1">Read-only history for this department</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search analyses..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
          aria-label="Search analyses"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-foreground">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Files Processed</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/40">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.files}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{r.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
