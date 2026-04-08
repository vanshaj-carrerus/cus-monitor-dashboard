'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Ban,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';
import { useAuth } from '@/components/auth-context';

export default function TeamLeaderMembers() {
  const { user } = useAuth();
  
  const [members, setMembers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enable' | 'disable'>('all');

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'common', departmentId: '', locationId: '' });
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (nextPage = page, nextLimit = limit) => {
    try {
      const cred = { credentials: 'include' as RequestCredentials };
      const [mRes, dRes, lRes] = await Promise.all([
        fetch(`/api/team-leader/members?page=${nextPage}&limit=${nextLimit}&search=${encodeURIComponent(searchTerm)}&status=${filterStatus}`, cred),
        fetch('/api/departments', cred),
        fetch('/api/locations', cred),
      ]);
      const mData = await mRes.json();
      const dData = await dRes.json();
      const lData = await lRes.json();
      
      if (mData.success) {
        setMembers(mData.data);
        setPage(Number(mData.page || nextPage));
        setLimit(Number(mData.limit || nextLimit));
        setTotal(Number(mData.total || 0));
      }
      if (dData.departments) setDepartments(dData.departments);
      if (lData.locations) setLocations(lData.locations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchData(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    setLoading(true);
    fetchData(page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const changeLimit = (v: number) => {
    setLimit(v);
    setPage(1);
  };

  const toggleActive = async (member: any) => {
    try {
      const res = await fetch(`/api/users/${member._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !member.active }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to update status');
        return;
      }
      await fetchData(page, limit);
    } catch {
      alert('Failed to update status');
    }
  };

  const deleteMember = async (member: any) => {
    if (!confirm(`Remove ${member.username} from your team?`)) return;
    try {
      const res = await fetch(`/api/team-leader/members/${member._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to remove');
        return;
      }
      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / limit));
      const nextPage = Math.min(page, nextTotalPages);
      setTotal(nextTotal);
      setPage(nextPage);
      await fetchData(nextPage, limit);
    } catch {
      alert('Failed to remove member');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteForm.departmentId) {
      alert('Department is required');
      return;
    }
    
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...inviteForm,
          role: 'common',
          teamLeaderId: user?._id,
        }),
      });
      const json = await res.json();
      if (res.ok) { 
        setIsAddMemberOpen(false); 
        setInviteForm({ name: '', email: '', role: 'common', departmentId: '', locationId: '' }); 
        alert('Invitation sent successfully'); 
      } else {
        alert(json.error || 'Failed to invite user');
      }
    } catch (err) { 
      alert('Failed to invite user'); 
    }
  };

  return (
    <DashboardLayout>
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden min-h-[600px]">
        <div className="p-8">
          <div className="flex flex-col gap-8">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search member by name or email"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5E35B1]/10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddMemberOpen(true)} className="bg-[#5E35B1] hover:bg-[#5E35B1]/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
                <Plus className="h-5 w-5" />
                Add Member
              </Button>
            </div>

            {/* Status Filters */}
            <div className="flex items-center">
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
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-100">
                    <th className="w-10 px-4 py-3"><div className="w-4 h-4 rounded border border-slate-300" /></th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading…</td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No team members found.</td>
                    </tr>
                  ) : (
                    members.map((member: any) => (
                      <tr key={member._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-4"><div className="w-4 h-4 rounded border border-slate-200" /></td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-slate-700">{member.username || member.email}</span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">{member.email}</td>
                        <td className="px-4 py-4 text-sm text-slate-500">{member.departmentId?.name || '-'}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            {member.active ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-slate-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => toggleActive(member)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                              title={member.active ? 'Disable' : 'Enable'}
                            >
                              {member.active ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMember(member)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              title="Remove from team"
                            >
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
                <select
                  value={limit}
                  onChange={(e) => changeLimit(Number(e.target.value))}
                  className="px-2 py-1 border border-slate-200 rounded text-sm text-slate-500 bg-transparent focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-slate-500">Showing {from} to {to} of {total} entries</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg text-sm",
                        p === page ? "bg-[#5E35B1] text-white" : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Team Member</h3>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                <select required value={inviteForm.departmentId} onChange={e => setInviteForm(f => ({ ...f, departmentId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#5E35B1] focus:outline-none">
                  <option value="">Select Department</option>
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
                <Button className='text-white' type="button" variant="ghost" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#5E35B1] text-white">Send Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
