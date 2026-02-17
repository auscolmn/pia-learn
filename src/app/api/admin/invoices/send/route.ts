import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getUser } from '@/lib/supabase/server'

interface SendInvoiceBody {
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

    const body = (await request.json()) as SendInvoiceBody
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get the invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        organization:organizations(name, slug)
      `)
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update invoice status to open
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'open',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Failed to update invoice:', updateError)
      return NextResponse.json(
        { error: 'Failed to send invoice' },
        { status: 500 }
      )
    }

    // TODO: Send email notification to org admins
    // This would integrate with an email service like Resend/SendGrid
    console.log(`Invoice ${invoiceId} sent to ${invoice.organization?.name}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
