'use client';

import { ModulePlaceholder } from '@/components/erp/module-placeholder';
import { Truck } from 'lucide-react';

export default function LogisticsPage() {
  return (
    <ModulePlaceholder
      title="Operación Logística"
      icon={Truck}
      description="Control integral de la cadena de suministro, despachos y recepción nacional."
    />
  );
}
