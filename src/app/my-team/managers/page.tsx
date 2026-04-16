'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/components/auth-context';
import { Building2, Loader2, MapPin, Save, UserCog } from 'lucide-react';

type Opt = { _id: string; name: string; address?: string };

type ManagerRow = {
  _id: string;
  username: string;
  email: string;
  managedDepartments: Opt[];
  managedLocations: Opt[];
};

export default function ManagersAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [departments, setDepartments] = useState<Opt[]>([]);
  const [locations, setLocations] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, { dept: string[]; loc: string[] }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || (user?.role !== 'admin' && user?.role !== 'admin_compliance')) return;
    void (async () => {
      setLoading(true);
      try {
        const cred = { credentials: 'include' as RequestCredentials };
        const [mRes, dRes, lRes] = await Promise.all([
          fetch('/api/managers', cred),
          fetch('/api/departments', cred),
          fetch('/api/locations', cred),
        ]);
        const [mJson, dJson, lJson] = await Promise.all([mRes.json(), dRes.json(), lRes.json()]);
        if (mJson.success) {
          setManagers(mJson.data);
          const init: Record<string, { dept: string[]; loc: string[] }> = {};
          mJson.data.forEach((m: ManagerRow) => {
            init[m._id] = {
              dept: (m.managedDepartments || []).map((d) => d._id),
              loc: (m.managedLocations || []).map((l) => l._id),
            };
          });
          setSelections(init);
        }
        if (dJson.departments) setDepartments(dJson.departments);
        if (lJson.locations) setLocations(lJson.locations);
      } finally {
        setLoading(false);
      }
    })();
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

  const save = async (managerId: string) => {
    const sel = selections[managerId];
    if (!sel) return;
    setSaving(managerId);
    try {
      const res = await fetch(`/api/managers/${managerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          managedDepartmentIds: sel.dept,
          managedLocationIds: sel.loc,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Save failed');
        return;
      }
      alert('Saved');
    } finally {
      setSaving(null);
    }
  };

  return (
    <DashboardLayout>
      <p className="mb-6 text-sm text-slate-500">
        Managers only see members and reports for the departments and locations you assign here.
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#5E35B1]" />
        </div>
      ) : managers.length === 0 ? (
        <Card className="border-none p-8 text-center text-slate-500 shadow-sm">No manager accounts yet.</Card>
      ) : (
        <div className="space-y-6">
          {managers.map((m) => (
            <Card key={m._id} className="border-none p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#5E35B1]">
                    <UserCog className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0D1B3E]">{m.username}</h3>
                    <p className="text-sm text-slate-500">{m.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => save(m._id)}
                  disabled={saving === m._id}
                  className="bg-[#5E35B1] text-white hover:bg-[#4527A0]"
                >
                  {saving === m._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" /> Save
                    </span>
                  )}
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Building2 className="h-4 w-4" /> Departments (multi)
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    {departments.map((d) => (
                      <label key={d._id} className="flex cursor-pointer text-black! items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-slate-800 text-black!"
                          checked={(selections[m._id]?.dept || []).includes(d._id)}
                          onChange={() =>
                            setSelections((prev) => ({
                              ...prev,
                              [m._id]: {
                                dept: toggleId(prev[m._id]?.dept || [], d._id),
                                loc: prev[m._id]?.loc || [],
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
                          className="rounded border-slate-800 text-black!"
                          checked={(selections[m._id]?.loc || []).includes(loc._id)}
                          onChange={() =>
                            setSelections((prev) => ({
                              ...prev,
                              [m._id]: {
                                dept: prev[m._id]?.dept || [],
                                loc: toggleId(prev[m._id]?.loc || [], loc._id),
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
