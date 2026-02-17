'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Loader2 } from 'lucide-react'

interface CertificateSearchProps {
  defaultValue?: string
}

export function CertificateSearch({ defaultValue }: CertificateSearchProps) {
  const [query, setQuery] = useState(defaultValue ?? '')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = () => {
    startTransition(() => {
      if (query.trim()) {
        router.push(`${pathname}?q=${encodeURIComponent(query.trim())}`)
      } else {
        router.push(pathname)
      }
    })
  }

  const handleClear = () => {
    setQuery('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex gap-2 max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name or certificate number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button onClick={handleSearch} disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Search'
        )}
      </Button>
    </div>
  )
}
