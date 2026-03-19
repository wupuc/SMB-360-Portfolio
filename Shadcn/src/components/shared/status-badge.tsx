import React from "react"
import { Badge } from "@/components/ui/badge"

type StatusType =
  | "request"
  | "task"
  | "ticket"
  | "booking"
  | "opportunity"
  | "candidate"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

interface StatusConfig {
  label: string
  variant: BadgeVariant
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // requests
  draft: { label: "Draft", variant: "outline" },
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  // tasks
  todo: { label: "To Do", variant: "outline" },
  in_progress: { label: "In Progress", variant: "secondary" },
  done: { label: "Done", variant: "default" },
  // tickets
  open: { label: "Open", variant: "destructive" },
  resolved: { label: "Resolved", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
  // bookings
  confirmed: { label: "Confirmed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "outline" },
  no_show: { label: "No Show", variant: "destructive" },
  // opportunities
  new: { label: "New", variant: "secondary" },
  qualified: { label: "Qualified", variant: "secondary" },
  proposal: { label: "Proposal", variant: "secondary" },
  won: { label: "Won", variant: "default" },
  lost: { label: "Lost", variant: "destructive" },
  // candidates
  applied: { label: "Applied", variant: "secondary" },
  interviewing: { label: "Interviewing", variant: "secondary" },
  offered: { label: "Offered", variant: "default" },
  hired: { label: "Hired", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
}

interface StatusBadgeProps {
  status: string
  type?: StatusType
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status.toLowerCase()] ?? {
    label: status,
    variant: "outline" as BadgeVariant,
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
}
