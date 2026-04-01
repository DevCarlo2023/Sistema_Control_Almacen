'use client';

import { ModulePlaceholder } from '@/components/erp/module-placeholder';
import { Users } from 'lucide-react';

export default function UsersPage() {
  return (
    <ModulePlaceholder
      title="Gestión de Usuarios"
      icon={Users}
      description="Administración de personal, permisos por rol y auditoría de accesos al sistema."
    />
  );
}
