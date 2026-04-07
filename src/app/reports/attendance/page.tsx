'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';

export default function AttendanceReportPage() {
  return (
    <DashboardLayout>
      <Card className="border-none p-8 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900">Attendance Report</h1>
        <p className="mt-2 text-sm text-slate-500">
          This report route exists for dashboard navigation/type-safety. You can extend it to show attendance analytics.
        </p>
      </Card>
    </DashboardLayout>
  );
}

