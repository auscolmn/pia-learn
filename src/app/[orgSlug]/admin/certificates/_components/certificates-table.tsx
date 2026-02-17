'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Calendar,
  Download,
  ExternalLink,
  MoreVertical,
  Ban,
  RefreshCw,
  Undo,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { revokeCertificate, restoreCertificate, regenerateCertificate } from '@/lib/certificates/actions'

interface CertificateData {
  id: string
  certificate_number: string
  recipient_name: string
  issued_at: string
  pdf_url: string | null
  metadata: Record<string, unknown>
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  course: {
    id: string
    title: string
    slug: string
  }
}

interface CertificatesTableProps {
  certificates: CertificateData[]
  orgSlug: string
}

export function CertificatesTable({ certificates, orgSlug }: CertificatesTableProps) {
  const [revokeDialogId, setRevokeDialogId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const router = useRouter()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleRevoke = async () => {
    if (!revokeDialogId) return

    setLoadingAction(revokeDialogId)
    startTransition(async () => {
      const result = await revokeCertificate(revokeDialogId)
      if (result.success) {
        toast.success('Certificate revoked')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to revoke certificate')
      }
      setRevokeDialogId(null)
      setLoadingAction(null)
    })
  }

  const handleRestore = async (certificateId: string) => {
    setLoadingAction(certificateId)
    startTransition(async () => {
      const result = await restoreCertificate(certificateId)
      if (result.success) {
        toast.success('Certificate restored')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to restore certificate')
      }
      setLoadingAction(null)
    })
  }

  const handleRegenerate = async (certificateId: string) => {
    setLoadingAction(certificateId)
    startTransition(async () => {
      const result = await regenerateCertificate(certificateId)
      if (result.success) {
        toast.success('Certificate PDF regenerated')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to regenerate certificate')
      }
      setLoadingAction(null)
    })
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {certificates.map((certificate) => {
              const isRevoked = certificate.metadata?.revoked === true
              const initials = certificate.user.full_name
                ? certificate.user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : certificate.user.email.slice(0, 2).toUpperCase()

              const isLoading = loadingAction === certificate.id

              return (
                <div
                  key={certificate.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    isRevoked ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={certificate.user.avatar_url ?? undefined}
                        alt={certificate.recipient_name}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{certificate.recipient_name}</p>
                        <Badge
                          variant="outline"
                          className={`font-mono text-xs ${
                            isRevoked ? 'border-destructive text-destructive' : ''
                          }`}
                        >
                          {certificate.certificate_number}
                        </Badge>
                        {isRevoked && (
                          <Badge variant="destructive" className="text-xs">
                            Revoked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                        <span>{certificate.course.title}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(certificate.issued_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {certificate.pdf_url && !isRevoked && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={certificate.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`/verify/${certificate.certificate_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Verify
                        </a>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={isLoading}>
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRegenerate(certificate.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isRevoked ? (
                            <DropdownMenuItem
                              onClick={() => handleRestore(certificate.id)}
                            >
                              <Undo className="h-4 w-4 mr-2" />
                              Restore Certificate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setRevokeDialogId(certificate.id)}
                              className="text-destructive"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Revoke Certificate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeDialogId} onOpenChange={() => setRevokeDialogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Certificate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the certificate as revoked. The verification page will show
              it as invalid. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
