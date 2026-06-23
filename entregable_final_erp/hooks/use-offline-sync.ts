import { useEffect } from 'react';
import { db } from '@/lib/offline-db';
import { supabase } from '@/lib/supabase';

export function useOfflineSync() {
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Connection restored. Starting sync...');
            syncQueue();
            seedLocalData(); // Refresh local mirror
        };

        window.addEventListener('online', handleOnline);

        // Initial sync and seed
        if (navigator.onLine) {
            syncQueue();
            seedLocalData();
        } else {
            console.log('📴 Operating in Offline Mode');
        }

        return () => window.removeEventListener('online', handleOnline);
    }, []);

    const seedLocalData = async () => {
        if (!navigator.onLine) return;

        console.log('📥 Seeding local database from Supabase...');

        const [{ data: materials }, { data: equipment }, { data: inventory }] = await Promise.all([
            supabase.from('materials').select('*'),
            supabase.from('equipment').select('*'),
            supabase.from('inventory').select('*')
        ]);

        if (materials) await db.materials.bulkPut(materials);
        if (equipment) await db.equipment.bulkPut(equipment);
        if (inventory) await db.inventory.bulkPut(inventory);

        console.log('✅ Local database seeded.');
    };

    const syncQueue = async () => {
        const operations = await db.syncQueue.toArray();
        if (operations.length === 0) return;

        console.log(`📦 Syncing ${operations.length} pending operations...`);

        for (const op of operations) {
            try {
                let error;
                if (op.action === 'INSERT') {
                    ({ error } = await supabase.from(op.table).insert(op.data));
                } else if (op.action === 'UPDATE') {
                    ({ error } = await supabase.from(op.table).update(op.data).eq('id', op.data.id));
                }

                if (!error) {
                    await db.syncQueue.delete(op.id!);
                    console.log(`✅ Synced ${op.table} operation successfully.`);
                } else {
                    console.error(`❌ Error syncing ${op.table}:`, error.message);
                }
            } catch (err) {
                console.error('❌ Sync failed:', err);
            }
        }
    };

    const performOperation = async (table: string, action: 'INSERT' | 'UPDATE', data: any) => {
        if (navigator.onLine) {
            try {
                let error;
                if (action === 'INSERT') {
                    ({ error } = await supabase.from(table).insert(data));
                } else {
                    ({ error } = await supabase.from(table).update(data).eq('id', data.id));
                }

                if (!error) return { success: true };
            } catch (err) {
                console.warn('⚠️ Online operation failed, falling back to offline mode.');
            }
        }

        // Offline or Online failure: Save to Dexie and Sync Queue
        await db.syncQueue.add({
            table,
            action,
            data,
            timestamp: Date.now()
        });

        // Also update local mirror for immediate UI feedback
        if (table === 'materials') await db.materials.put(data);
        else if (table === 'equipment') await db.equipment.put(data);
        else if (table === 'inventory') await db.inventory.put(data);

        return { success: true, offline: true };
    };

    return { performOperation, syncQueue };
}
