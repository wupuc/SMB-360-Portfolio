"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateCompanySettings } from "@/app/actions/company"
import type { Company } from "@/types/database.types"

const formSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  brand_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  email_sender_name: z.string().optional(),
  email_sender_address: z
    .string()
    .email("Must be a valid email address")
    .optional()
    .or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required"),
  locale: z.string().min(1, "Locale is required"),
})

type FormValues = z.infer<typeof formSchema>

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "Europe/Warsaw", label: "Europe/Warsaw (CET)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Chicago", label: "America/Chicago (CST)" },
  { value: "America/Denver", label: "America/Denver (MST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST)" },
]

const LOCALES = [
  { value: "pl", label: "Polish (pl)" },
  { value: "en", label: "English (en)" },
  { value: "de", label: "German (de)" },
  { value: "fr", label: "French (fr)" },
]

interface Props {
  company: Company
}

export function CompanyForm({ company }: Props) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: company.name,
      brand_color: company.brand_color,
      email_sender_name: company.email_sender_name ?? "",
      email_sender_address: company.email_sender_address ?? "",
      timezone: company.timezone,
      locale: company.locale,
    },
  })

  async function onSubmit(values: FormValues) {
    setSuccessMessage(null)
    setErrorMessage(null)

    const result = await updateCompanySettings(values)

    if (result.error) {
      setErrorMessage(result.error)
    } else {
      setSuccessMessage("Company settings saved successfully.")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {successMessage && (
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Color</FormLabel>
              <FormDescription>
                Primary brand color used throughout the platform.
              </FormDescription>
              <FormControl>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-input bg-transparent p-1"
                  />
                  <Input
                    placeholder="#3b82f6"
                    {...field}
                    className="w-36 font-mono"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email_sender_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Sender Name</FormLabel>
              <FormDescription>
                The display name used when sending emails (e.g. &quot;Acme Support&quot;).
              </FormDescription>
              <FormControl>
                <Input placeholder="Acme Support" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email_sender_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Sender Address</FormLabel>
              <FormDescription>
                The reply-to email address for platform notifications.
              </FormDescription>
              <FormControl>
                <Input
                  type="email"
                  placeholder="noreply@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormDescription>
                Default timezone for dates and times across the platform.
              </FormDescription>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="locale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Locale</FormLabel>
              <FormDescription>
                Default language and regional format for the platform.
              </FormDescription>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a locale" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LOCALES.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  )
}
