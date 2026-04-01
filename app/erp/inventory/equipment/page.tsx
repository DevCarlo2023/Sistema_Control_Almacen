'use client';

import { ModulePlaceholder } from '@/components/erp/module-placeholder';
import { Wrench } from 'lucide-react';

export default function EquipmentPage() {
  return (
    <ModulePlaceholder
      title="Gestión de Equipos"
      icon={Wrench}
      description="Control de activos, mantenimiento preventivo y estado operativo de toda la flota industrial."
    />
  );
}
