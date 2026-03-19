import React from "react"
import { generateBrandTokens } from "@/lib/brand"

interface BrandProviderProps {
  brandColor: string
  children: React.ReactNode
}

export function BrandProvider({ brandColor, children }: BrandProviderProps) {
  const tokens = generateBrandTokens(brandColor)
  return (
    <div style={tokens as React.CSSProperties} className="contents">
      {children}
    </div>
  )
}
