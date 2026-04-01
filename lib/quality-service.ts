import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

// ─── Types ───────────────────────────────────────────────────────────────────

export type InspectionStatus = 'pass' | 'fail' | 'pending'

export interface QualityInspection {
  id: string
  created_at: string
  updated_at: string
  material_id: string | null
  material_name: string
  inspector_id: string | null
  inspector_name: string
  status: InspectionStatus
  batch_number: string | null
  notes: string
  signature_url: string | null
  evidence_url: string | null
  warehouse_id: string | null
  tags: string[]
}

export interface CreateInspectionPayload {
  material_id?: string
  material_name: string
  status: InspectionStatus
  batch_number?: string
  notes: string
  signature_url?: string
  evidence_url?: string
  warehouse_id?: string
}

export interface QualityStats {
  total_pass: number
  total_fail: number
  total_pending: number
  total: number
  conformity_rate: number
  critical_alerts_week: number
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetch all inspections, ordered by most recent first
 */
export async function getInspections(limit = 50): Promise<QualityInspection[]> {
  const { data, error } = await supabase
    .from('quality_inspections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Create a new inspection. Automatically assigns the current user as inspector.
 */
export async function createInspection(
  payload: CreateInspectionPayload
): Promise<QualityInspection> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('quality_inspections')
    .insert({
      ...payload,
      inspector_id: user.id,
      inspector_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Inspector',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Fetch aggregate quality statistics from the view
 */
export async function getQualityStats(): Promise<QualityStats | null> {
  const { data, error } = await supabase
    .from('quality_stats')
    .select('*')
    .single()

  if (error) {
    // If the view doesn't exist yet, return calculated fallback from inspections
    const { data: rows } = await supabase
      .from('quality_inspections')
      .select('status, created_at')

    if (!rows) return null
    const total = rows.length
    const pass = rows.filter(r => r.status === 'pass').length
    const fail = rows.filter(r => r.status === 'fail').length
    const pending = rows.filter(r => r.status === 'pending').length
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const alerts = rows.filter(r => r.status === 'fail' && r.created_at > weekAgo).length

    return {
      total_pass: pass,
      total_fail: fail,
      total_pending: pending,
      total,
      conformity_rate: total > 0 ? Math.round((pass / total) * 1000) / 10 : 0,
      critical_alerts_week: alerts,
    }
  }

  return data
}

/**
 * Subscribe to realtime inspection updates
 */
export function subscribeToInspections(
  onInsert: (inspection: QualityInspection) => void
) {
  const channel = supabase
    .channel('quality_inspections_realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'quality_inspections' },
      (payload) => onInsert(payload.new as QualityInspection)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

/**
 * Fetch materials list for the inspection form dropdown
 */
export async function getMaterialsForSelect(): Promise<{ id: string; name: string; code: string }[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, code')
    .order('name')

  if (error) return []
  return data ?? []
}
