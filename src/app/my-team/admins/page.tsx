'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/components/auth-context';
import { Building2, Loader2, MapPin, Save, ShieldCheck } from 'lucide-react';

type Opt = { _id: string; name: string; address?: string };

type AdminRow = {
  _id: string;
  username: string;
  email: string;
  role: string;
  managedDepartments: Opt[];
  managedLocations: Opt[];
};

export default function AdminsManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [departments, setDepartments] = useState<Opt[]>([]);
  const [locations, setLocations] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, { role: string; dept: string[]; loc: string[] }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cred = { credentials: 'include' as RequestCredentials };
      const [aRes, dRes, lRes] = await Promise.all([
        fetch('/api/admins', cred),
        fetch('/api/departments', cred),
        fetch('/api/locations', cred),
      ]);
      const [aJson, dJson, lJson] = await Promise.all([aRes.json(), dRes.json(), lRes.json()]);
      if (aJson.success) {
        setAdmins(aJson.data);
        const init: Record<string, { role: string; dept: string[]; loc: string[] }> = {};
        aJson.data.forEach((a: AdminRow) => {
          init[a._id] = {
            role: a.role,
            dept: (a.managedDepartments || []).map((d) => d._id),
            loc: (a.managedLocations || []).map((l) => l._id),
          };
        });
        setSelections(init);
      }
      if (dJson.departments) setDepartments(dJson.departments);
      if (lJson.locations) setLocations(lJson.locations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || (user?.role !== 'admin' && user?.role !== 'admin_compliance')) return;
    fetchData();
  }, [authLoading, user?.role]);

  if (authLoading || !user || (user.role !== 'admin' && user.role !== 'admin_compliance')) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#5E35B1]" />
        </div>
      </DashboardLayout>
    );
  }

  const toggleId = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const save = async (adminId: string) => {
    const sel = selections[adminId];
    if (!sel) return;
    setSaving(adminId);
    try {
      const res = await fetch(`/api/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          role: sel.role,
          managedDepartmentIds: sel.dept,
          managedLocationIds: sel.loc,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Save failed');
        return;
      }
      alert('Saved successfully');
      // If role was changed and it was NOT admin anymore, we might want to refresh the list
      if (sel.role !== 'admin') {
        await fetchData();
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B3E]">Admins Management</h1>
          <p className="text-sm text-slate-500">
            Manage Admin roles and their department/location assignments.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#5E35B1]" />
        </div>
      ) : admins.length === 0 ? (
        <Card className="border-none p-8 text-center text-slate-500 shadow-sm">No admin accounts found.</Card>
      ) : (
        <div className="space-y-6">
          {admins.map((a) => (
            <Card key={a._id} className="border-none p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#5E35B1]">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0D1B3E]">{a.username}</h3>
                    <p className="text-sm text-slate-500">{a.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
                    <select
                      value={selections[a._id]?.role || 'admin'}
                      onChange={(e) => setSelections(prev => ({
                        ...prev,
                        [a._id]: { ...prev[a._id], role: e.target.value }
                      }))}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5E35B1]"
                    >
                      <option value="admin">Admin</option>
                      <option value="admin_compliance">Compliance Admin</option>
                      <option value="manager">Manager</option>
                      <option value="team_leader">Team Leader</option>
                      <option value="common">Common User</option>
                      <option value="common_compliance">Compliance User</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => save(a._id)}
                    disabled={saving === a._id}
                    className="bg-[#5E35B1] mt-4 text-white hover:bg-[#4527A0] h-9"
                  >
                    {saving === a._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" /> Save
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Building2 className="h-4 w-4" /> Departments (multi)
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    {departments.map((d) => (
                      <label key={d._id} className="flex text-black! cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-slate-800"
                          checked={(selections[a._id]?.dept || []).includes(d._id)}
                          onChange={() =>
                            setSelections((prev) => ({
                              ...prev,
                              [a._id]: {
                                ...prev[a._id],
                                dept: toggleId(prev[a._id]?.dept || [], d._id),
                              },
                            }))
                          }
                        />
                        {d.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <MapPin className="h-4 w-4" /> Locations (multi)
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    {locations.map((loc) => (
                      <label key={loc._id} className="flex cursor-pointer text-black! items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-slate-800"
                          checked={(selections[a._id]?.loc || []).includes(loc._id)}
                          onChange={() =>
                            setSelections((prev) => ({
                              ...prev,
                              [a._id]: {
                                ...prev[a._id],
                                loc: toggleId(prev[a._id]?.loc || [], loc._id),
                              },
                            }))
                          }
                        />
                        {loc.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
