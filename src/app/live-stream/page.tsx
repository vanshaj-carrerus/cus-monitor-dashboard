'use client';

import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { cn } from '../../../lib/utils';

interface UserCardProps {
  name?: string;
  email: string;
  isActive?: boolean;
}

function UserCard({ name, email, isActive }: UserCardProps) {
  return (
    <div className={cn(
      "relative rounded-xl border p-5 transition-all duration-300 min-h-[140px] flex flex-col justify-center",
      isActive
        ? "border-green-400 bg-white shadow-[0_0_15px_rgba(74,222,128,0.15)] ring-1 ring-green-400/20"
        : "border-slate-100 bg-white shadow-sm"
    )}>
      {name && (
        <h4 className="mb-1 text-sm font-bold text-slate-800">{name}</h4>
      )}
      <p className={cn(
        "break-all text-[11px] leading-relaxed",
        isActive ? "text-slate-400" : "text-slate-400 font-medium"
      )}>
        {email}
      </p>
    </div>
  );
}

const users = [
  { email: 'yashsolankar@careerrussol ution.com', isActive: false },
  { email: 'saimise402@gmail.com', isActive: true },
  { email: 'arbaazsalyad@careerrussol ution.com', isActive: false },
  { email: 'therizwan85@gmail.com', isActive: false },
  { email: 'mahammedkaif@careerruss olution.com', isActive: false },
  { email: 'aswanijayesh500@gmail.co m', isActive: false },
  { name: 'Abhishek Sadhu', email: 'abhisheksadhu@careerruss olution.com', isActive: true },
  { name: 'Adikate', email: 'adikate402@gmail.com', isActive: true },
  { name: 'Adoreen', email: 'adoreendiengdoh4@gmail.c om', isActive: false },
  { name: 'Alfaiz khatri', email: 'alfaizkhatri402@gmail.com', isActive: false },
  { name: 'Almas saiyed', email: 'almassaiyed402@gmail.co m', isActive: true },
  { name: 'Anjali', email: 'anjaliakoskar701@gmail.co m', isActive: true },
  { name: 'Arsh Saiyed', email: 'arshsaiyed@careerrussoluti on.com', isActive: true },
  { name: 'Debraj Chowdhury402@gmail. com ...', email: 'debrajchowdhury402@gmai l.com', isActive: true },
  { name: 'Devika', email: 'devika@careerrussolution.c om', isActive: false },
  { name: 'Dhruv patel', email: 'dhruvkolipatel@gmail.co m', isActive: true },
  { name: 'Fatima', email: 'fatimacareerrussolution07@ gmail.com', isActive: true },
  { name: 'Harsh chatur', email: 'haarshchatur402@gmail.co m', isActive: true },
  { name: 'Hindavi', email: 'hindavik402@gmail.com', isActive: true },
  { name: 'Jayraj bhai', email: 'jayraj@careerrussolution.co m', isActive: true },
];

export default function LiveStreamPage() {
  return (
    <DashboardLayout>
      <Card className="p-8 shadow-sm border-slate-100">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <h1 className="text-xl font-bold text-slate-800">Live Stream</h1>
            <p className="text-[12px] font-bold text-[#5E35B1]">
              * There may be a delay of 10–12 seconds in the live stream due to network latency.
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-[13px] text-slate-600 focus:border-[#5E35B1] focus:outline-none dark:border-slate-800   sm:w-72"
            />
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          </div>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {users.map((user, index) => (
            <UserCard key={index} {...user} />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-center gap-6">
          <button className="flex h-10 w-12 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#5E35B1] transition-colors hover:bg-slate-200">
            <span className="text-[14px] font-bold">{'<<'}</span>
          </button>

          <div className="flex items-center gap-4">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5E35B1] text-white text-[14px] font-bold shadow-lg shadow-purple-200">
              1
            </button>
            <button className="flex h-10 w-10 items-center justify-center text-slate-400 text-[14px] font-bold hover:text-slate-600">
              2
            </button>
            <button className="flex h-10 w-10 items-center justify-center text-slate-400 text-[14px] font-bold hover:text-slate-600">
              3
            </button>
          </div>

          <button className="flex h-10 w-12 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#5E35B1] transition-colors hover:bg-slate-200">
            <span className="text-[14px] font-bold">{'>>'}</span>
          </button>
        </div>
      </Card>
    </DashboardLayout>
  );
}
