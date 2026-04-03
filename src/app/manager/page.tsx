'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { mockEmployees } from '../../../lib/mock-data';

export default function ManagerPage() {
  const [fromManager, setFromManager] = useState('');
  const [toManager, setToManager] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Changing manager from:', fromManager, 'to:', toManager);
  };

  return (
    <DashboardLayout>
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden mb-6">
        <div className="px-8 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#0D1B3E]">Change Manager</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 flex flex-col md:flex-row items-center gap-12">
          <div className="flex items-center gap-6 flex-1 max-w-md">
            <label className="text-base font-bold text-[#0D1B3E] whitespace-nowrap min-w-[120px]">From Manager</label>
            <div className="relative flex-1">
              <select
                value={fromManager}
                onChange={(e) => setFromManager(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-slate-400 focus:border-[#5E35B1] focus:outline-none focus:ring-1 focus:ring-[#5E35B1]"
              >
                <option value="">Select Manager</option>
                {mockEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            </div>
          </div>

          <div className="flex items-center gap-6 flex-1 max-w-md">
            <label className="text-base font-bold text-[#0D1B3E] whitespace-nowrap min-w-[100px]">To Manager</label>
            <div className="relative flex-1">
              <select
                value={toManager}
                onChange={(e) => setToManager(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-slate-400 focus:border-[#5E35B1] focus:outline-none focus:ring-1 focus:ring-[#5E35B1]"
              >
                <option value="">Select Manager</option>
                {mockEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white font-medium px-10 py-2.5 rounded-xl transition-colors min-w-[120px]"
          >
            Submit
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4 h-12 shadow-sm">
      </div>
    </DashboardLayout>
  );
}
