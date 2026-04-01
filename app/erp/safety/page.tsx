'use client';

import { ModulePlaceholder } from '@/components/erp/module-placeholder';
import { ShieldCheck } from 'lucide-react';

export default function SafetyPage() {
  return (
    <ModulePlaceholder
      title="Seguridad Industrial"
      icon={ShieldCheck}
      description="Control documental (Epps, Charlas, IPERC), gestión de riesgos y salud ocupacional."
    />
  );
}
