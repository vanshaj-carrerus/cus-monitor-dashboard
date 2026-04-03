'use client';

import { CreditCard, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pricing and Billing</h1>
        <p className="text-sm text-slate-500">Manage your subscription and billing details.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <PricingCard
          tier="Starter"
          price="$0"
          description="Basic monitoring for small teams."
          features={['Up to 5 members', 'Basic reports', '7 days data history']}
        />
        <PricingCard
          tier="Professional"
          price="$49"
          description="Advanced tracking for growing companies."
          features={['Up to 20 members', 'Detailed activity logs', '30 days data history', 'Priority support']}
          highlighted
        />
        <PricingCard
          tier="Enterprise"
          price="Custom"
          description="Tailored solutions for large organizations."
          features={['Unlimited members', 'Custom reporting', 'Infinite data history', 'Dedicated account manager']}
        />
      </div>
    </DashboardLayout>
  );
}

function PricingCard({ tier, price, description, features, highlighted }: { tier: string, price: string, description: string, features: string[], highlighted?: boolean }) {
  return (
    <Card className={highlighted ? "border-[#5E35B1] ring-1 ring-[#5E35B1] shadow-purple-100" : ""}>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">{tier}</h3>
        <div className="mt-4 flex items-baseline">
          <span className="text-4xl font-extrabold text-slate-900">{price}</span>
          {price !== 'Custom' && <span className="ml-1 text-slate-500">/month</span>}
        </div>
        <p className="mt-4 text-sm text-slate-500">{description}</p>
      </div>
      <ul className="mb-8 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
            <Check className="h-4 w-4 shrink-0 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>
      <Button className={highlighted ? "w-full bg-[#5E35B1]" : "w-full"} variant={highlighted ? "primary" : "secondary"}>
        Get Started
      </Button>
    </Card>
  );
}
