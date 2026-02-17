'use client'

import { FileText, Download, ExternalLink } from 'lucide-react'

interface Invoice {
  id: string
  period_start: string
  period_end: string
  total: number
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  stripe_invoice_id: string | null
  paid_at: string | null
}

interface InvoiceHistoryProps {
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

function getStatusBadge(status: Invoice['status']) {
  const styles = {
    draft: 'bg-gray-100 text-gray-700',
    open: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    void: 'bg-gray-100 text-gray-500',
    uncollectible: 'bg-red-100 text-red-700',
  }

  const labels = {
    draft: 'Draft',
    open: 'Due',
    paid: 'Paid',
    void: 'Void',
    uncollectible: 'Failed',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

export function InvoiceHistory({ invoices }: InvoiceHistoryProps) {
  if (invoices.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Invoice History</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          No invoices yet. Your first invoice will appear after your first billing cycle.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Invoice History</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-sm">Period</th>
              <th className="text-left p-4 font-medium text-sm">Amount</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-left p-4 font-medium text-sm">Paid</th>
              <th className="text-right p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-4">
                  <span className="font-medium">
                    {formatDate(invoice.period_start)}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono">
                    {formatCurrency(invoice.total)}
                  </span>
                </td>
                <td className="p-4">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="p-4 text-muted-foreground">
                  {invoice.paid_at 
                    ? new Date(invoice.paid_at).toLocaleDateString('en-AU')
                    : '—'}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {invoice.stripe_invoice_id && (
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="View in Stripe"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
