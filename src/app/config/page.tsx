'use client';

import { Settings, Shield, Bell, User } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ConfigPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configuration</h1>
        <p className="text-sm text-slate-500">Configure your system-wide settings and monitoring rules.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <ConfigCard 
          icon={<User className="h-5 w-5 text-blue-600" />} 
          title="Account Settings" 
          description="Update your personal information and profile settings."
        />
        <ConfigCard 
          icon={<Shield className="h-5 w-5 text-green-600" />} 
          title="Security and Privacy" 
          description="Manage passwords, two-factor authentication, and privacy."
        />
        <ConfigCard 
          icon={<Bell className="h-5 w-5 text-orange-600" />} 
          title="Notifications" 
          description="Set up alerts and email notifications for your team activity."
        />
        <ConfigCard 
          icon={<Settings className="h-5 w-5 text-purple-600" />} 
          title="System Preferences" 
          description="Global settings for tracking, idle time detection, and more."
        />
      </div>
    </DashboardLayout>
  );
}

function ConfigCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="p-8 hover:border-blue-200 transition-colors">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mb-6 text-sm text-slate-500 leading-relaxed">{description}</p>
      <Button variant="secondary" className="w-full">Manage</Button>
    </Card>
  );
}
