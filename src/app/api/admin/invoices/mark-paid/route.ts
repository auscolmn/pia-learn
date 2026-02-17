import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getUser } from '@/lib/supabase/server'

interface MarkPaidBody {
  invoiceId: string
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

    const body = (await request.json()) as MarkPaidBody
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        amount_paid: supabase.rpc === undefined ? undefined : undefined, // Will be set via RPC or directly
      })
      .eq('id', invoiceId)

    if (error) {
      console.error('Failed to mark invoice paid:', error)
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Mark paid error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
