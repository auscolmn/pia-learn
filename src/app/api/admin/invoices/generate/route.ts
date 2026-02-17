import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getUser } from '@/lib/supabase/server'

interface GenerateInvoiceBody {
  orgId: string
  periodStart?: string // YYYY-MM-DD, defaults to start of previous month
  periodEnd?: string   // YYYY-MM-DD, defaults to end of previous month
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !user.isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as GenerateInvoiceBody
    const { orgId } = body

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing orgId' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Calculate period (default to previous month)
    const now = new Date()
    const periodStart = body.periodStart 
      ? new Date(body.periodStart)
      : new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    const periodEnd = body.periodEnd
      ? new Date(body.periodEnd)
      : new Date(now.getFullYear(), now.getMonth(), 0) // Last day of previous month

    // Get usage for the period
    const { data: usageData } = await supabase.rpc('get_current_usage', { p_org_id: orgId })
    const usage = usageData?.[0] ?? {
      active_students: 0,
      video_storage_bytes: 0,
      video_bandwidth_bytes: 0,
      certificates_issued: 0,
      estimated_amount: 0,
    }

    // Get pricing config
    const { data: pricing } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('name', 'default')
      .eq('is_active', true)
      .single()

    const p = pricing ?? {
      price_per_active_student: 200,
      price_per_gb_storage: 10,
      price_per_gb_bandwidth: 5,
      price_per_certificate: 50,
      free_students_limit: 10,
      free_storage_gb: 1,
      free_bandwidth_gb: 5,
    }

    // Calculate line items
    const bytesToGB = (bytes: number) => bytes / (1024 * 1024 * 1024)
    
    const lineItems = []
    
    // Students
    const studentsOverFree = Math.max(0, usage.active_students - p.free_students_limit)
    if (studentsOverFree > 0) {
      lineItems.push({
        description: `Active Students (${studentsOverFree} over free tier of ${p.free_students_limit})`,
        quantity: studentsOverFree,
        unit_price: p.price_per_active_student,
        amount: studentsOverFree * p.price_per_active_student,
      })
    }

    // Storage
    const storageGb = bytesToGB(usage.video_storage_bytes)
    const storageOverFree = Math.max(0, storageGb - p.free_storage_gb)
    if (storageOverFree > 0.01) {
      lineItems.push({
        description: `Video Storage (${storageOverFree.toFixed(2)} GB over free tier)`,
        quantity: storageOverFree,
        unit_price: p.price_per_gb_storage,
        amount: Math.round(storageOverFree * p.price_per_gb_storage),
      })
    }

    // Bandwidth
    const bandwidthGb = bytesToGB(usage.video_bandwidth_bytes)
    const bandwidthOverFree = Math.max(0, bandwidthGb - p.free_bandwidth_gb)
    if (bandwidthOverFree > 0.01) {
      lineItems.push({
        description: `Video Bandwidth (${bandwidthOverFree.toFixed(2)} GB over free tier)`,
        quantity: bandwidthOverFree,
        unit_price: p.price_per_gb_bandwidth,
        amount: Math.round(bandwidthOverFree * p.price_per_gb_bandwidth),
      })
    }

    // Certificates
    if (usage.certificates_issued > 0) {
      lineItems.push({
        description: `Certificates Issued`,
        quantity: usage.certificates_issued,
        unit_price: p.price_per_certificate,
        amount: usage.certificates_issued * p.price_per_certificate,
      })
    }

    const total = lineItems.reduce((sum, item) => sum + item.amount, 0)

    // Check for existing invoice for this period
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('org_id', orgId)
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .single()

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice already exists for this period' },
        { status: 400 }
      )
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        org_id: orgId,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        subtotal: total,
        total: total,
        amount_due: total,
        line_items: lineItems,
        status: 'draft',
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Failed to create invoice:', invoiceError)
      return NextResponse.json(
        { error: 'Failed to generate invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      invoice,
      lineItems,
    })

  } catch (error) {
    console.error('Generate invoice error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
