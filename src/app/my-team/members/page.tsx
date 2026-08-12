'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Users,
  Building2,
  MapPin,
  Download,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ban,
  X,
  Edit2,
  Upload,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '../../../../lib/utils';
import { useAuth } from '@/components/auth-context';

export default function EmployeesPage() {
  const { user } = useAuth();
  const canManageStructure = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'departments' | 'location'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enable' | 'disable'>('all');

  const [members, setMembers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddLocOpen, setIsAddLocOpen] = useState(false);
  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
  const [isEditLocOpen, setIsEditLocOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string>('');
  const [editForm, setEditForm] = useState({ username: '', email: '', role: '', departmentId: '', locationId: '', teamLeaderId: '' });

  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'common', departmentId: '', locationId: '', teamLeaderId: '' });
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [locForm, setLocForm] = useState({ name: '', address: '' });
  const [editingDeptId, setEditingDeptId] = useState<string>('');
  const [editingLocId, setEditingLocId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);

  const [bulkResults, setBulkResults] = useState<{ successCount: number; failedCount: number; failures: any[] } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [invites, setInvites] = useState<any[]>([]);
  const [fetchingInvites, setFetchingInvites] = useState(false);

  const fetchData = async (nextPage = page, nextLimit = limit) => {
    try {
      const cred = { credentials: 'include' as RequestCredentials };
      const [uRes, dRes, lRes, tRes] = await Promise.all([
        fetch(`/api/users?page=${nextPage}&limit=${nextLimit}&search=${encodeURIComponent(searchTerm)}&status=${filterStatus}`, cred),
        fetch('/api/departments', cred),
        fetch('/api/locations', cred),
        fetch('/api/users?role=team_leader', cred),
      ]);
      const uData = await uRes.json();
      const dData = await dRes.json();
      const lData = await lRes.json();
      const tData = await tRes.json();
      if (uData.success) {
        setMembers(uData.data);
        setPage(Number(uData.page || nextPage));
        setLimit(Number(uData.limit || nextLimit));
        setTotal(Number(uData.total || 0));
      }
      if (dData.departments) setDepartments(dData.departments);
      if (lData.locations) setLocations(lData.locations);
      if (tData.success && Array.isArray(tData.data)) {
        setTeamLeaders(tData.data);
      } else if (tData.data && Array.isArray(tData.data)) {
        setTeamLeaders(tData.data);
      }
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
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    setLoading(true);
    fetchData(page, limit);
  }, [page, limit]);

  const fetchInvites = async () => {
    setFetchingInvites(true);
    try {
      const res = await fetch('/api/auth/invite', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setInvites(data.invites);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingInvites(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'invites') {
      fetchInvites();
    }
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const changeLimit = (v: number) => {
    setLimit(v);
    setPage(1);
  };

  const openEditMember = (member: any) => {
    setEditingMemberId(member._id);
    setEditForm({
      username: member.username || '',
      email: member.email || '',
      departmentId: member.departmentId?._id || '',
      locationId: member.locationId?._id || '',
      teamLeaderId: teamLeaders.find(tl => tl.email === member.teamLeaderId)?._id || '',
      role: member.role || 'common',
    });
    setIsEditMemberOpen(true);
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${editingMemberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to update member');
        return;
      }
      setIsEditMemberOpen(false);
      setEditingMemberId('');
      setEditForm({ username: '', email: '', role: '', departmentId: '', locationId: '', teamLeaderId: '' });
      await fetchData(page, limit);
    } catch {
      alert('Failed to update member');
    }
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
    if (!confirm(`Delete ${member.username}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${member._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to delete');
        return;
      }
      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / limit));
      const nextPage = Math.min(page, nextTotalPages);
      setTotal(nextTotal);
      setPage(nextPage);
      await fetchData(nextPage, limit);
    } catch {
      alert('Failed to delete');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on role
    if (inviteForm.role === 'common') {
      if (!inviteForm.departmentId || !inviteForm.teamLeaderId) {
        alert('Department and Team Leader are required for common users.');
        return;
      }
    }

    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inviteForm),
      });
      const json = await res.json();
      if (res.ok) {
        setIsAddMemberOpen(false);
        setInviteForm({ name: '', email: '', role: 'common', departmentId: '', locationId: '', teamLeaderId: '' });
        alert('Invited successfully');
      } else {
        alert(json.error || 'Failed to invite user');
      }
    } catch (err) {
      alert('Failed to invite user');
    }
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

  const openEditDept = (dept: any) => {
    setEditingDeptId(dept._id);
    setDeptForm({ name: dept.name || '', description: dept.description || '' });
    setIsEditDeptOpen(true);
  };

  const openEditLoc = (loc: any) => {
    setEditingLocId(loc._id);
    setLocForm({ name: loc.name || '', address: loc.address || '' });
    setIsEditLocOpen(true);
  };

  const handleEditDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/departments/${editingDeptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(deptForm),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to update department');
        return;
      }
      setIsEditDeptOpen(false);
      setEditingDeptId('');
      setDeptForm({ name: '', description: '' });
      fetchData();
    } catch {
      alert('Failed to update department');
    }
  };

  const handleEditLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/locations/${editingLocId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(locForm),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to update location');
        return;
      }
      setIsEditLocOpen(false);
      setEditingLocId('');
      setLocForm({ name: '', address: '' });
      fetchData();
    } catch {
      alert('Failed to update location');
    }
  };

  const deleteDepartment = async (dept: any) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    try {
      const res = await fetch(`/api/departments/${dept._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to delete department');
        return;
      }
      fetchData();
    } catch {
      alert('Failed to delete department');
    }
  };

  const deleteLocation = async (loc: any) => {
    if (!confirm(`Delete location "${loc.name}"?`)) return;
    try {
      const res = await fetch(`/api/locations/${loc._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to delete location');
        return;
      }
      fetchData();
    } catch {
      alert('Failed to delete location');
    }
  };

  const deleteInvite = async (invite: any) => {
    if (!confirm(`Delete invite for ${invite.email}?`)) return;
    try {
      const res = await fetch(`/api/auth/invite/${invite._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        fetchInvites();
      } else {
        alert(data.error || 'Failed to delete invite');
      }
    } catch (err) {
      alert('Failed to delete invite');
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('No data found in excel sheet');
          setUploading(false);
          return;
        }

        // Map excel columns to our expected format
        // Expected columns: Name, Email, Role, Department, Team Leader Email
        const users = data.map((row: any) => ({
          name: row['Name'] || row['name'],
          email: row['Email'] || row['email'],
          role: row['Role'] || row['role'] || 'common',
          departmentName: row['Department'] || row['department'],
          teamLeaderEmail: row['Team Leader Email'] || row['team_leader_email'] || row['Team Leader']
        }));

        const res = await fetch('/api/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ users }),
        });

        const json = await res.json();
        if (json.success) {
          setBulkResults(json);
          fetchData();
        } else {
          alert(json.error || 'Bulk upload failed');
        }
        setUploading(false);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      alert('Failed to process excel file');
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'invites', label: 'Invites', icon: Plus },
    ...(canManageStructure
      ? [
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'location', label: 'Location', icon: MapPin },
      ]
      : []),
  ] as const;

  const effectiveTab = activeTab;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Team Management</h1>
          <p className="max-w-2xl text-base text-on-surface-variant">
            Manage your organization&apos;s hierarchy, access control, and team structures.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-surface-container p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'members' | 'invites' | 'departments' | 'location')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-all font-semibold text-sm",
              effectiveTab === tab.id
                ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                : "text-on-surface-variant hover:bg-surface-container-low"
            )}
          >
            <tab.icon className={cn("h-5 w-5", effectiveTab === tab.id ? "text-on-surface" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm min-h-125">
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button className="flex items-center gap-3 px-5 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm text-slate-400 font-medium min-w-45 justify-between">
                      All Departments
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <Button onClick={() => setIsAddMemberOpen(true)} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
                    <Plus className="h-5 w-5" />
                    Add Member
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      id="bulk-upload-input"
                      onChange={handleBulkUpload}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('bulk-upload-input')?.click()}
                      className="flex items-center gap-2 text-primary border-primary/20 rounded-xl bg-secondary px-6 py-3 h-auto font-bold cursor-pointer"
                    >
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                      Bulk Upload
                    </Button>
                  </div>
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
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Lead</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading…</td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No members found.</td>
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
                          <td className="px-4 py-4 text-sm text-slate-500 capitalize">{member.role || '-'}</td>
                          <td className="px-4 py-4 text-sm text-slate-500">{member.teamLeaderId?.username || member.teamLeaderId?.email || member.teamLeaderId || '-'}</td>
                          <td className="px-4 py-4 text-sm text-slate-500">{member.departmentId?.name || '-'}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditMember(member)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
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
                                title="Delete"
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
                          p === page ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100"
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <Button onClick={() => setIsAddDeptOpen(true)} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
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
                        <h3 className="font-bold text-lg text-on-surface">{dept.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5">
                            {dept.description || 'No description available'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          onClick={() => openEditDept(dept)}
                          variant="ghost"
                          className="text-on-surface bg-slate-50 hover:bg-slate-100 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-slate-100"
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          onClick={() => deleteDepartment(dept)}
                          variant="ghost"
                          className="text-red-500 bg-red-50/50 hover:bg-red-50 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-red-50"
                        >
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <Button onClick={() => setIsAddLocOpen(true)} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
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
                        <h3 className="font-bold text-lg text-on-surface">{loc.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5">
                            {loc.address || 'No address available'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          onClick={() => openEditLoc(loc)}
                          variant="ghost"
                          className="text-on-surface bg-slate-50 hover:bg-slate-100 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-slate-100"
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          onClick={() => deleteLocation(loc)}
                          variant="ghost"
                          className="text-red-500 bg-red-50/50 hover:bg-red-50 px-6 py-2 h-auto text-sm font-bold rounded-xl border border-red-50"
                        >
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

        {effectiveTab === 'invites' && (
          <div className="p-8">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-on-surface">Pending Invitations</h3>
                <Button onClick={() => setIsAddMemberOpen(true)} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 rounded-xl px-6 py-3 h-auto font-bold">
                  <Plus className="h-5 w-5" />
                  Invite Member
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expires At</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {fetchingInvites ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading…</td>
                      </tr>
                    ) : invites.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No pending invitations.</td>
                      </tr>
                    ) : (
                      invites.map((invite: any) => (
                        <tr key={invite._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-4 text-sm text-slate-500">{invite.email}</td>
                          <td className="px-4 py-4 text-sm text-slate-500 capitalize">{invite.role}</td>
                          <td className="px-4 py-4 text-sm text-slate-500">{invite.departmentId?.name || '-'}</td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {new Date(invite.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => deleteInvite(invite)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                title="Delete Invite"
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
                <input required type="text" value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input required type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none">
                  <option value="common">Common User</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="manager">Manager</option>
                  {user?.role === 'admin' && <option value="admin">Admin</option>}
                  {user?.role === 'admin_compliance' && <option value="common_compliance">Compliance User</option>}
                  {user?.role === 'admin_compliance' && <option value="admin_compliance">Compliance Admin</option>}
                </select>
              </div>
              {inviteForm.role === 'common' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Team Leader *</label>
                  <select required value={inviteForm.teamLeaderId} onChange={e => setInviteForm(f => ({ ...f, teamLeaderId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none">
                    <option value="">Select a Team Leader</option>
                    {teamLeaders.map((tl: any) => (<option key={tl._id} value={tl._id}>{tl.username || tl.email}</option>))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department {(inviteForm.role === 'common' || inviteForm.role === 'common_compliance') && '*'}</label>
                <select required={inviteForm.role === 'common' || inviteForm.role === 'common_compliance'} value={inviteForm.departmentId} onChange={e => setInviteForm(f => ({ ...f, departmentId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary text-slate-100 focus:outline-none">
                  <option value="">Select Department</option>
                  {departments.map((d: any) => (<option key={d._id} value={d._id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                <select value={inviteForm.locationId} onChange={e => setInviteForm(f => ({ ...f, locationId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-100 focus:border-primary focus:outline-none">
                  <option value="">None</option>
                  {locations.map((l: any) => (<option key={l._id} value={l._id}>{l.name}</option>))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button className='text-white!' type="button" variant="ghost" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Send Invite</Button>
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
                <input required type="text" value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" rows={3}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button className='text-white!' type="button" variant="ghost" onClick={() => setIsAddDeptOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Save</Button>
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
                <input required type="text" value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <textarea value={locForm.address} onChange={e => setLocForm(f => ({ ...f, address: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" rows={3}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button className='text-white!' type="button" variant="ghost" onClick={() => setIsAddLocOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {isEditDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Department</h3>
              <button onClick={() => { setIsEditDeptOpen(false); setEditingDeptId(''); }} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditDept} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                <input required type="text" value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" rows={3}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button className='text-white! hover:text-white!' type="button" variant="ghost" onClick={() => { setIsEditDeptOpen(false); setEditingDeptId(''); }}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {isEditLocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Location</h3>
              <button onClick={() => { setIsEditLocOpen(false); setEditingLocId(''); }} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditLoc} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location Name</label>
                <input required type="text" value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <textarea value={locForm.address} onChange={e => setLocForm(f => ({ ...f, address: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" rows={3}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button className='text-white!' type="button" variant="ghost" onClick={() => { setIsEditLocOpen(false); setEditingLocId(''); }}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Member</h3>
              <button onClick={() => setIsEditMemberOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input type="text" value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              {canManageStructure && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none">
                    <option value="common">Common User</option>
                    <option value="team_leader">Team Leader</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select value={editForm.departmentId} onChange={e => setEditForm(f => ({ ...f, departmentId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none">
                  <option value="">None</option>
                  {departments.map((d: any) => (<option key={d._id} value={d._id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                <select value={editForm.locationId} onChange={e => setEditForm(f => ({ ...f, locationId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none">
                  <option value="">None</option>
                  {locations.map((l: any) => (<option key={l._id} value={l._id}>{l.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Team Leader</label>
                <select value={editForm.teamLeaderId} onChange={e => setEditForm(f => ({ ...f, teamLeaderId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none">
                  <option value="">None</option>
                  {teamLeaders.map((tl: any) => (<option key={tl._id} value={tl._id}>{tl.username || tl.email}</option>))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button className='text-white!' type="button" variant="ghost" onClick={() => setIsEditMemberOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Upload Results Modal */}
      {bulkResults && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upload Results</h3>
                <p className="text-sm text-slate-500">
                  Successfully invited {bulkResults.successCount} users. {bulkResults.failedCount} failures found.
                </p>
              </div>
              <button onClick={() => setBulkResults(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {bulkResults.failures.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-red-500 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Failed Entries
                  </h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-slate-700">Name</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-700">Email</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-700">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {bulkResults.failures.map((f, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-slate-600">{f.userData.name || '-'}</td>
                            <td className="px-4 py-3 text-slate-600">{f.userData.email || '-'}</td>
                            <td className="px-4 py-3 text-red-500 text-xs">{f.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-bold text-slate-700">All members were added successfully!</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button onClick={() => setBulkResults(null)} className="bg-primary text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
