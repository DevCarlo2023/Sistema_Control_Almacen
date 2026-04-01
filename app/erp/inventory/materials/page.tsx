'use client';

import { ModulePlaceholder } from '@/components/erp/module-placeholder';
import { Package } from 'lucide-react';

export default function MaterialsPage() {
  return (
    <ModulePlaceholder
      title="Catálogo de Materiales"
      icon={Package}
      description="Control maestro de materiales, stock crítico y codificación industrial para todos los almacenes."
    />
  );
}
