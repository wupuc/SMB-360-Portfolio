import { z } from "zod"

export const uuidSchema = z.string().uuid()

export const dateRangeSchema = z
  .object({
    from: z.date(),
    to: z.date(),
  })
  .refine((d) => d.from <= d.to, {
    message: "Start date must be before end date",
    path: ["to"],
  })

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type DateRange = z.infer<typeof dateRangeSchema>
export type Pagination = z.infer<typeof paginationSchema>
