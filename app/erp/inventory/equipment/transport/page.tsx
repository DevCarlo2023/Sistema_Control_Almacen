'use client';

import { ModulePlaceholder } from '@/components/erp/module-placeholder';
import { Truck } from 'lucide-react';

export default function TransportPage() {
  return (
    <ModulePlaceholder
      title="Gestión de Transporte"
      icon={Truck}
      description="Control de rutas, combustible, conductores y logística de transporte de equipos y materiales."
    />
  );
}
