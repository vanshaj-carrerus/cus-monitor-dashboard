'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Mail,
  User as UserIcon,
  Filter,
  Users,
  Building2,
  MapPin,
  Download,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ban,
  Activity
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../lib/utils';

const membersData = [
  { id: 1, name: 'yashsolankar', email: 'yashsolankar@careerruresolution.com', manager: 'Muttalib Saiyed', activationDate: '25/03/2026', appVersion: 'Win(S) 2.1.8', activation: true, tracking: true },
  { id: 2, name: 'saimise402', email: 'saimise402@gmail.com', manager: 'Not Assigned', activationDate: '26/03/2026', appVersion: 'Win(S) 2.1.8', activation: true, tracking: true },
  { id: 3, name: 'arbazsaiyed', email: 'arbazsaiyed@careerruresolution.com', manager: 'Not Assigned', activationDate: '26/03/2026', appVersion: 'Win(S) 2.1.8', activation: true, tracking: true },
  { id: 4, name: 'therizwan02', email: 'therizwan02@gmail.com', manager: 'Not Assigned', activationDate: '26/03/2026', appVersion: 'Win(S) 2.1.8', activation: true, tracking: true },
  { id: 5, name: 'mohammedkaif', email: 'mohammedkaif@careerruresolution.com', manager: 'Not Assigned', activationDate: '26/03/2026', appVersion: 'Win(S) 2.1.8', activation: true, tracking: true },
  { id: 6, name: 'mdsakib.bagwan.cus', email: 'mdsakib.bagwan.cus@gamil.com', manager: 'Not Assigned', activationDate: '-', appVersion: '-', activation: false, tracking: true },
  { id: 7, name: 'aswanijayesh555', email: 'aswanijayesh555@gmail.com', manager: 'Not Assigned', activationDate: '01/04/2026', appVersion: 'Win(S) 2.1.8', activation: true, tracking: true },
  { id: 8, name: 'Abhishek Sadhu', email: 'abhisheksadhu@careerruresolution.com', manager: 'Muttalib Saiyed', activationDate: '25/03/2026', appVersion: 'Win(S) 2.1.8', activation: true, tracking: true },
  { id: 9, name: 'Aditkale', email: 'aditkale402@gmail.com', manager: 'Muttalib Saiyed', activationDate: '26/03/2026', appVersion: 'Win(S) 2.1.8', activation: true, tracking: true },
  { id: 10, name: 'Adoreen', email: 'adoreenlangdoh4@gmail.com', manager: 'Yuvraj sinh', activationDate: '26/03/2026', appVersion: 'Win(S) 2.1.8', activation: true, tracking: true, dept: 'Sales' },
];

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'departments' | 'location'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enable' | 'disable'>('all');

  const tabs = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'location', label: 'Location', icon: MapPin },
  ];

  return (
    <DashboardLayout>
      {/* Tabs */}
      <div className="mb-6 flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-base",
              activeTab === tab.id
                ? "bg-[#F5F3FF] text-[#0D1B3E] border border-[#5E35B1]/20"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? "text-[#0D1B3E]" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden min-h-[600px]">
        {activeTab === 'members' && (
          <div className="p-8">
            <div className="flex flex-col gap-8">
              {/* Header Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search user by name or email"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5E35B1]/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button className="flex items-center gap-3 px-5 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-400 font-medium min-w-[180px] justify-between">
                      All Departments
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <Button className="bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
                    <Plus className="h-5 w-5" />
                    Add Member
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2 text-slate-400 border-none rounded-xl bg-slate-100/50 px-6 py-3 h-auto font-bold">
                    <Download className="h-5 w-5 rotate-180" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Status Filters & Bulk Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center bg-slate-100/50 p-1 rounded-lg">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", filterStatus === 'all' ? "bg-black text-white" : "text-slate-500")}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('enable')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", filterStatus === 'enable' ? "bg-black text-white" : "text-slate-500")}
                  >
                    Enable
                  </button>
                  <button
                    onClick={() => setFilterStatus('disable')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", filterStatus === 'disable' ? "bg-black text-white" : "text-slate-500")}
                  >
                    Disable
                  </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-400">
                  Bulk Action
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      <th className="w-10 px-4 py-3"><div className="w-4 h-4 rounded border border-slate-300" /></th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name <ChevronDown className="inline-block h-3 w-3 ml-1" /></th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manager</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activation Date</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">App Version</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activation</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracking</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {membersData.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-4"><div className="w-4 h-4 rounded border border-slate-200" /></td>
                        <td className="px-4 py-4">
                          <div>
                            <span className="text-sm font-medium text-slate-700 block">{member.name}</span>
                            {member.dept && <span className="text-[10px] text-slate-400">{member.dept}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">{member.email}</td>
                        <td className="px-4 py-4 text-sm text-slate-500">{member.manager}</td>
                        <td className="px-4 py-4 text-sm text-slate-500">{member.activationDate}</td>
                        <td className="px-4 py-4 text-sm text-slate-500">{member.appVersion}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            {member.activation ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            {member.tracking ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                              <XCircle className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                              <Activity className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <select className="px-2 py-1 border border-slate-200 rounded text-sm text-slate-500 bg-transparent focus:outline-none">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                  <span className="text-sm text-slate-500">Showing 1 to 10 of 52 entries</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><ChevronLeft className="h-4 w-4" /></button>
                  <button className="w-8 h-8 flex items-center justify-center bg-[#5E35B1] text-white rounded-lg text-sm">1</button>
                  <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg text-sm">2</button>
                  <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg text-sm">3</button>
                  <span className="px-2 text-slate-300">...</span>
                  <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg text-sm">6</button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="p-8">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search for a department..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5E35B1]/10"
                  />
                </div>
                <Button className="bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
                  <Plus className="h-5 w-5" />
                  Add Department
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-shadow">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-[#0D1B3E]">Sales <span className="font-normal text-slate-400 ml-1">(14 Members)</span></h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="h-4 w-4" />
                        Global Manager: Yuvraj sinh
                      </span>
                    </div>
                    <button className="flex items-center gap-1.5 text-sm text-[#5E35B1] font-bold mt-4">
                      <Plus className="h-4 w-4" />
                      Add New Member
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" className="text-[#0D1B3E] bg-slate-50 hover:bg-slate-100 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-slate-100">
                      Edit
                    </Button>
                    <Button variant="ghost" className="text-[#0D1B3E] bg-slate-50 hover:bg-slate-100 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-slate-100">
                      View Members
                    </Button>
                    <Button variant="ghost" className="text-red-500 bg-red-50/50 hover:bg-red-50 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-red-50">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="p-8">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search for a location..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5E35B1]/10"
                  />
                </div>
                <Button className="bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
                  <Plus className="h-5 w-5" />
                  Add Location
                </Button>
              </div>
              <div className="h-64 flex items-center justify-center text-slate-300">
                {/* Empty State */}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
