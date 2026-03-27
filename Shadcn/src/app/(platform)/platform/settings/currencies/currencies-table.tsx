"use client"

import { useTransition, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { setBaseCurrency } from "@/app/actions/currencies"
import type { Currency } from "@/types/database.types"

interface Props {
  currencies: Currency[]
}

export function CurrenciesTable({ currencies }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSetBase(currencyId: string) {
    setError(null)
    startTransition(async () => {
      const result = await setBaseCurrency(currencyId)
      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Exchange Rate</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No currencies configured. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {currencies.map((currency) => (
              <TableRow key={currency.id}>
                <TableCell className="font-mono font-semibold">
                  {currency.code}
                </TableCell>
                <TableCell>{currency.name}</TableCell>
                <TableCell className="font-mono">{currency.symbol}</TableCell>
                <TableCell className="font-mono">
                  {(currency.exchange_rate ?? 1).toFixed(4)}
                </TableCell>
                <TableCell>
                  {currency.is_base && (
                    <Badge variant="default">Base</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={currency.is_active ? "default" : "secondary"}>
                    {currency.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {!currency.is_base && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleSetBase(currency.id)}
                    >
                      Set Base
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
