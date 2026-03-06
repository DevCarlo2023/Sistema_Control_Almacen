import Dexie, { type Table } from 'dexie';

export interface SyncOperation {
    id?: number;
    table: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    data: any;
    timestamp: number;
}

export class OfflineDB extends Dexie {
    syncQueue!: Table<SyncOperation>;
    materials!: Table<any>;
    equipment!: Table<any>;
    inventory!: Table<any>;

    constructor() {
        super('CarloTechOfflineDB');
        this.version(1).stores({
            syncQueue: '++id, table, timestamp',
            materials: 'id, name',
            equipment: 'id, name, category, status',
            inventory: 'id, warehouse_id, material_id'
        });
    }
}

export const db = new OfflineDB();
