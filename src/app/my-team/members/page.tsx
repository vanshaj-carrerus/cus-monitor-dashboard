'use client';

import { useState, useEffect } from 'react';
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
  Activity,
  X
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';
import { useAuth } from '@/components/auth-context';

export default function EmployeesPage() {
  const { user } = useAuth();
  const canManageStructure = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'members' | 'departments' | 'location'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enable' | 'disable'>('all');

  const [members, setMembers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddLocOpen, setIsAddLocOpen] = useState(false);

  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'sales', departmentId: '', locationId: '' });
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [locForm, setLocForm] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const cred = { credentials: 'include' as RequestCredentials };
      const [uRes, dRes, lRes] = await Promise.all([
        fetch('/api/users', cred),
        fetch('/api/departments', cred),
        fetch('/api/locations', cred),
      ]);
      const uData = await uRes.json();
      const dData = await dRes.json();
      const lData = await lRes.json();
      if (uData.success) setMembers(uData.data);
      if (dData.departments) setDepartments(dData.departments);
      if (lData.locations) setLocations(lData.locations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inviteForm),
      });
      if (res.ok) { setIsAddMemberOpen(false); setInviteForm({ name: '', email: '', role: 'sales', departmentId: '', locationId: '' }); alert('Invited successfully'); }
    } catch (err) { alert('Failed to invite user'); }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(deptForm),
      });
      if (res.ok) { setIsAddDeptOpen(false); setDeptForm({ name: '', description: '' }); fetchData(); }
    } catch (err) { alert('Failed to add department'); }
  };

  const handleAddLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(locForm),
      });
      if (res.ok) { setIsAddLocOpen(false); setLocForm({ name: '', address: '' }); fetchData(); }
    } catch (err) { alert('Failed to add location'); }
  };

  const tabs = [
    { id: 'members', label: 'Members', icon: Users },
    ...(canManageStructure
      ? [
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'location', label: 'Location', icon: MapPin },
        ]
      : []),
  ] as const;

  const effectiveTab = canManageStructure ? activeTab : 'members';

  return (
    <DashboardLayout>
      {/* Tabs */}
      <div className="mb-6 flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'members' | 'departments' | 'location')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-base",
              effectiveTab === tab.id
                ? "bg-[#F5F3FF] text-[#0D1B3E] border border-[#5E35B1]/20"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <tab.icon className={cn("h-5 w-5", effectiveTab === tab.id ? "text-[#0D1B3E]" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden min-h-[600px]">
        {effectiveTab === 'members' && (
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
                  <Button onClick={() => setIsAddMemberOpen(true)} className="bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
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
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">No members found.</td>
                      </tr>
                    ) : (
                      members.map((member: any) => (
                        <tr key={member._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-4"><div className="w-4 h-4 rounded border border-slate-200" /></td>
                          <td className="px-4 py-4">
                            <div>
                              <span className="text-sm font-medium text-slate-700 block">{member.username}</span>
                              {member.departmentId && <span className="text-[10px] text-slate-400 capitalize">{member.departmentId?.name || 'Department'}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">{member.email}</td>
                          <td className="px-4 py-4 text-sm text-slate-500 capitalize">{member.role}</td>
                          <td className="px-4 py-4 text-sm text-slate-500">-</td>
                          <td className="px-4 py-4 text-sm text-slate-500">-</td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
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
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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

        {effectiveTab === 'departments' && (
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
                <Button onClick={() => setIsAddDeptOpen(true)} className="bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
                  <Plus className="h-5 w-5" />
                  Add Department
                </Button>
              </div>

              <div className="space-y-4">
                {departments.length === 0 ? (
                  <p className="text-center text-slate-400 py-6">No departments found.</p>
                ) : (
                  departments.map((dept: any) => (
                    <div key={dept._id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-shadow">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-[#0D1B3E]">{dept.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5">
                            {dept.description || 'No description available'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" className="text-[#0D1B3E] bg-slate-50 hover:bg-slate-100 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-slate-100">
                          Edit
                        </Button>
                        <Button variant="ghost" className="text-red-500 bg-red-50/50 hover:bg-red-50 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-red-50">
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {effectiveTab === 'location' && (
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
                <Button onClick={() => setIsAddLocOpen(true)} className="bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
                  <Plus className="h-5 w-5" />
                  Add Location
                </Button>
              </div>
              <div className="space-y-4">
                {locations.length === 0 ? (
                  <p className="text-center text-slate-400 py-6">No locations found.</p>
                ) : (
                  locations.map((loc: any) => (
                    <div key={loc._id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-shadow">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-[#0D1B3E]">{loc.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5">
                            {loc.address || 'No address available'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" className="text-[#0D1B3E] bg-slate-50 hover:bg-slate-100 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-slate-100">
                          Edit
                        </Button>
                        <Button variant="ghost" className="text-red-500 bg-red-50/50 hover:bg-red-50 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-red-50">
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Member</h3>
              <button onClick={() => setIsAddMemberOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input required type="text" value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input required type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none">
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select value={inviteForm.departmentId} onChange={e => setInviteForm(f => ({ ...f, departmentId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none">
                  <option value="">None</option>
                  {departments.map((d: any) => (<option key={d._id} value={d._id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                <select value={inviteForm.locationId} onChange={e => setInviteForm(f => ({ ...f, locationId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none">
                  <option value="">None</option>
                  {locations.map((l: any) => (<option key={l._id} value={l._id}>{l.name}</option>))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#5E35B1] text-white">Send Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Department</h3>
              <button onClick={() => setIsAddDeptOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddDept} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                <input required type="text" value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none" rows={3}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsAddDeptOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#5E35B1] text-white">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {isAddLocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Location</h3>
              <button onClick={() => setIsAddLocOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddLoc} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location Name</label>
                <input required type="text" value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <textarea value={locForm.address} onChange={e => setLocForm(f => ({ ...f, address: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none" rows={3}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsAddLocOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#5E35B1] text-white">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
