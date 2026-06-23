/**
 * Centralized warehouse color configuration
 * Based on the location (CANTERA, MIRADOR, OFICINA, etc.)
 */

export interface WarehouseColor {
    bg: string;
    text: string;
    border: string;
    dot: string;
}

export const WAREHOUSE_COLORS: Record<string, WarehouseColor> = {
    'CANTERA': {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500'
    },
    'MIRADOR': {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500'
    },
    'OFICINA': {
        bg: 'bg-slate-100 dark:bg-slate-800/50',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400'
    },
    'SATELITE': {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800',
        dot: 'bg-indigo-500'
    },
    'VESTIDORES': {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500'
    },
    'DEFAULT': {
        bg: 'bg-primary/10 dark:bg-primary/20',
        text: 'text-primary dark:text-primary-foreground',
        border: 'border-primary/20 dark:border-primary/30',
        dot: 'bg-primary'
    }
};

export function getWarehouseColor(location: string = ''): WarehouseColor {
    const loc = location.toUpperCase();
    if (loc.includes('CANTERA')) return WAREHOUSE_COLORS.CANTERA;
    if (loc.includes('MIRADOR')) return WAREHOUSE_COLORS.MIRADOR;
    if (loc.includes('OFICINA') || loc.includes('PATIO-OF')) return WAREHOUSE_COLORS.OFICINA;
    if (loc.includes('SATELITE') || loc.includes('SAT')) return WAREHOUSE_COLORS.SATELITE;
    if (loc.includes('VESTIDORES') || loc.includes('VEST')) return WAREHOUSE_COLORS.VESTIDORES;
    return WAREHOUSE_COLORS.DEFAULT;
}
