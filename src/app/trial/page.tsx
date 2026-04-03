'use client';

import { Zap, Clock, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TrialPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Trial Management</h1>
        <p className="text-sm text-slate-500">Monitor your free trial status and explore features.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="bg-[#5E35B1] text-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Trial Expires in 7 Days</h3>
              <p className="text-white/60 text-sm">Your free trial will end on April 8, 2026.</p>
            </div>
          </div>
          <p className="mb-8 text-white/80">Upgrade to Professional today and get 20% off for your first year of monitoring.</p>
          <Button className="bg-white text-[#5E35B1] hover:bg-white/90 font-bold px-8">Upgrade Now</Button>
        </Card>

        <Card className="p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Trial Feature Access
          </h3>
          <ul className="space-y-4">
            <FeatureItem label="Advanced Time Tracking" active />
            <FeatureItem label="Screenshot Captures" active />
            <FeatureItem label="App Usage Analytics" active />
            <FeatureItem label="Web Activity Logs" active />
            <FeatureItem label="Custom Productivity Rules" inactive />
            <FeatureItem label="Enterprise API Access" inactive />
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function FeatureItem({ label, active, inactive }: { label: string, active?: boolean, inactive?: boolean }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className={active ? "text-slate-700 font-medium" : "text-slate-400"}>{label}</span>
      {active && <ShieldCheck className="h-4 w-4 text-green-500" />}
    </li>
  );
}
