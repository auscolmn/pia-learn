'use client'

import { useState } from 'react'
import { FileText, Send, CheckCircle2, Loader2 } from 'lucide-react'

interface Invoice {
  id: string
  org_id: string
  period_start: string
  period_end: string
  total: number
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  organization: {
    name: string
    slug: string
  } | null
}

interface PendingInvoicesProps {
  invoices: Invoice[]
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    month: 'short',
    year: 'numeric',
  })
}

export function PendingInvoices({ invoices }: PendingInvoicesProps) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleMarkPaid = async (invoiceId: string) => {
    setProcessing(invoiceId)
    
    try {
      const response = await fetch('/api/admin/invoices/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })

      if (response.ok) {
        // Reload page to reflect changes
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error)
    } finally {
      setProcessing(null)
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    setProcessing(invoiceId)
    
    try {
      const response = await fetch('/api/admin/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to send invoice:', error)
    } finally {
      setProcessing(null)
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Pending Invoices</h2>
        </div>
        <p className="text-muted-foreground text-center py-4">
          No pending invoices. All caught up! 🎉
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-100">
            <FileText className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Pending Invoices</h2>
            <p className="text-sm text-muted-foreground">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} need attention
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="font-medium">
                  {invoice.organization?.name ?? 'Unknown Org'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(invoice.period_start)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-mono font-medium">
                  {formatCurrency(invoice.total)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {invoice.status === 'draft' ? 'Draft' : 'Open'}
                </div>
              </div>

              <div className="flex gap-2">
                {invoice.status === 'draft' && (
                  <button
                    onClick={() => handleSendInvoice(invoice.id)}
                    disabled={processing === invoice.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {processing === invoice.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </button>
                )}
                
                <button
                  onClick={() => handleMarkPaid(invoice.id)}
                  disabled={processing === invoice.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {processing === invoice.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Mark Paid
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
