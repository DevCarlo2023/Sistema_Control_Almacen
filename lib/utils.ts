import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatText(text: string): string {
  if (!text) return text;
  return text.trim().toUpperCase();
}

/**
 * Retorna el umbral de stock crítico basado en el nombre del material
 * Reglas de Carlo (2026):
 * 1. Jean, Zapatos, Botines, Chalecos -> 5
 * 2. Casacas, Camisacos, Chompas, Pantalones -> 25
 * 3. Todo lo que es MATERIAL -> 20
 * 4. EL RESTO (EPPs generales como Guantes, Cascos, etc.) -> 50
 */
export function getStockThreshold(name: string): number {
  // Normalizar: quitar acentos y pasar a mayúsculas
  const n = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  // Grupo 1: Crítico < 5 (Zapatos, Botines, Jeans, Chalecos)
  if (n.includes('JEAN') || n.includes('ZAPATO') || n.includes('BOTIN') || n.includes('CHALECO')) {
    return 5;
  }

  // Grupo 2: Crítico < 25 (Casacas, Camisacos, Chompas, Pantalones)
  if (n.includes('CASACA') || n.includes('CAMISACO') || n.includes('CHOMPA') || n.includes('PANTALON')) {
    return 25;
  }

  // Grupo 4: Materiales Crítico < 20
  const materialKeywords = [
    'TUBO', 'CABLE', 'ALAMBRE', 'CEMENTO', 'PEGAMENTO', 'PINTURA', 'THINNER',
    'LIJA', 'BROCA', 'PERNO', 'TUERCA', 'ARANDELA', 'ELECTRODO', 'DISCO',
    'CANALETA', 'CONDUIT', 'CAJA DE PASE', 'BENTONITA', 'PLANCHA', 'TABLERO',
    'ZUNCHO', 'CAJA DE CONCRETO'
  ];
  if (materialKeywords.some(k => n.includes(k))) {
    return 20;
  }

  // Grupo 3: El resto (EPPs generales como guantes, lentes, cascos) -> Crítico < 50
  return 50;
}
