'use client';

import { ModulePlaceholder } from '@/components/erp/module-placeholder';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Ajustes del Sistema"
      icon={Settings}
      description="Configuración de parámetros globales, integración de API y personalización del ERP."
    />
  );
}
