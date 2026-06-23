/**
 * Catalog Normalization Utilities
 * Centralizes the logic for UOM standardization and SKU extraction.
 */

export const STANDARD_UOMS = [
  { value: 'UND', label: 'UND (Unidad)' },
  { value: 'KG', label: 'KG (Kilogramo)' },
  { value: 'MT', label: 'MT (Metro)' },
  { value: 'GLN', label: 'GLN (Galón)' },
  { value: 'CJ', label: 'CJ (Caja)' },
  { value: 'PZA', label: 'PZA (Pieza)' },
  { value: 'PAR', label: 'PAR (Par)' },
  { value: 'JGO', label: 'JGO (Juego)' },
  { value: 'BLS', label: 'BLS (Bolsa)' },
  { value: 'LB', label: 'LB (Libra)' },
  { value: 'M2', label: 'M2 (Metro Cuadrado)' },
  { value: 'M3', label: 'M3 (Metro Cúbico)' },
  { value: 'RES', label: 'RES (Resma)' },
  { value: 'TBN', label: 'TBN (Tambor)' },
] as const;

const UOM_MAP: Record<string, string> = {
  'UNIDAD': 'UND',
  'UNIDADES': 'UND',
  'UNID': 'UND',
  'UN': 'UND',
  'U.': 'UND',
  'UND': 'UND',
  'KILO': 'KG',
  'KILOGRAMO': 'KG',
  'KGS': 'KG',
  'KG': 'KG',
  'METRO': 'MT',
  'METROS': 'MT',
  'MTS': 'MT',
  'MT': 'MT',
  'GALON': 'GLN',
  'GALONES': 'GLN',
  'GL': 'GLN',
  'GLN': 'GLN',
  'CAJA': 'CJ',
  'CAJAS': 'CJ',
  'CJ': 'CJ',
  'BOX': 'CJ',
  'PIEZA': 'PZA',
  'PIEZAS': 'PZA',
  'PZ': 'PZA',
  'PZA': 'PZA',
  'PAR': 'PAR',
  'PARES': 'PAR',
  'JUEGO': 'JGO',
  'JUEGOS': 'JGO',
  'SET': 'JGO',
  'BOLSA': 'BLS',
  'BOLSAS': 'BLS',
  'LIBRA': 'LB',
  'LIBRAS': 'LB',
};

/**
 * Normalizes a UOM string to a standard code.
 */
export function normalizeUOM(value: string | undefined | null): string {
  if (!value) return 'UND';
  const clean = value.toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return UOM_MAP[clean] || clean || 'UND';
}

/**
 * Extracts a code from a string.
 * Detects:
 *  1. Purely numeric codes of 4+ digits (e.g. 40007425)
 *  2. Alphanumeric codes with no spaces, max 30 chars, containing at least one digit (e.g. ARA403AN, MAT-001)
 */
export function extractCode(value: string | undefined | null): string | null {
  if (!value) return null;
  const clean = value.trim();

  // Pattern 1: Pure numeric code (4+ digits)
  const numericMatch = clean.match(/^\d{4,}$/);
  if (numericMatch) return numericMatch[0];

  // Pattern 2: Alphanumeric code — no spaces, max 30 chars, must have at least 1 digit AND 1 letter
  // e.g.: ARA403AN, MAT-001-X, EQP-2024
  const isShort = clean.length <= 30;
  const hasNoSpaces = !/\s/.test(clean);
  const hasDigit = /\d/.test(clean);
  const hasLetter = /[A-Z]/i.test(clean);
  const isCodeLike = /^[A-Z0-9\-\/\.]+$/i.test(clean);

  if (isShort && hasNoSpaces && hasDigit && hasLetter && isCodeLike) {
    return clean;
  }

  // Pattern 3: Numeric code embedded within a longer string
  const embeddedMatch = clean.match(/\d{6,12}/);
  return embeddedMatch ? embeddedMatch[0] : null;
}

/** @deprecated Use extractCode instead */
export function extractNumericCode(value: string | undefined | null): string | null {
  return extractCode(value);
}

/**
 * Smartly sanitizes a material record.
 * Extracts SKU from name if empty.
 */
export function smartMaterialSanitizer(material: {
  codigo?: string | null;
  name: string;
  description?: string | null;
  unit_of_measure?: string | null;
  [key: string]: any; // Allow extra fields to pass through
}) {
  const result = { ...material };
  
  // 1. Normalize UOM
  result.unit_of_measure = normalizeUOM(result.unit_of_measure);

  // 2. Treat placeholder/empty values as null
  const currentCodigo = (!result.codigo || result.codigo.trim().toUpperCase() === 'SIN SKU') ? null : result.codigo.trim();
  const currentName = result.name?.trim() || '';
  const currentDescription = result.description?.trim() || '';

  // 3. Intelligent Code Extraction
  if (!currentCodigo) {
    const foundCode = extractCode(currentName);
    if (foundCode) {
      result.codigo = foundCode;
      
      // Extract any remaining text from the name after removing the code
      const remainder = currentName.replace(foundCode, '').replace(/^[-\s]+|[-\s]+$/g, '').trim();
      
      // If the remainder is meaningful text, use it as description (if description is empty)
      if (remainder && !currentDescription) {
        result.description = remainder;
      }

      // Name becomes the remainder if it exists, or a neutral placeholder
      result.name = remainder || currentDescription || 'Sin descripción técnica registrada.';
    } else {
      result.codigo = null;
      // If no code found but name looks like a useful description, copy to description if empty
      if (currentName && !currentDescription && currentName !== 'Sin descripción técnica registrada.') {
        result.description = currentName;
      }
    }
  } else {
    result.codigo = currentCodigo;
  }

  // 4. Clean old placeholder names (legacy from previous runs)
  if (result.name && /^ART[IÍ]CULO \[C[OÓ]DIGO:/i.test(result.name)) {
    result.name = result.description || 'Sin descripción técnica registrada.';
  }

  return result;
}

/**
 * Smartly sanitizes an equipment record.
 * Normalizes serial numbers, brands, and status.
 */
export function smartEquipmentSanitizer(equipment: {
  serial_number?: string | null;
  name: string;
  brand?: string | null;
  model?: string | null;
  status?: string | null;
  [key: string]: any;
}) {
  const result = { ...equipment };

  // 1. Normalize Serial Number (remove spaces, upper)
  if (result.serial_number) {
    result.serial_number = result.serial_number.trim().toUpperCase();
    if (result.serial_number === 'S/N' || result.serial_number === 'N/A') {
      result.serial_number = null;
    }
  }

  // 2. Normalize Status
  const statusMap: Record<string, string> = {
    'OPERATIVO': 'operativo',
    'OK': 'operativo',
    'FUNCIONANDO': 'operativo',
    'REPARACION': 'en_reparacion',
    'MANTENIMIENTO': 'en_reparacion',
    'TALLER': 'en_reparacion',
    'MALO': 'baja',
    'MALOGRADO': 'baja',
    'INOPERATIVO': 'baja',
    'DADO DE BAJA': 'baja',
    'BAJA': 'baja'
  };

  if (result.status) {
    const cleanStatus = result.status.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    result.status = statusMap[cleanStatus] || 'operativo';
  } else {
    result.status = 'operativo';
  }

  // 3. Normalize Brand/Model (Upper case)
  if (result.brand) result.brand = result.brand.trim().toUpperCase();
  if (result.model) result.model = result.model.trim().toUpperCase();
  if (result.name) result.name = result.name.trim().toUpperCase();

  return result;
}
