// Email sending helper using Resend
// Resend is not imported here as it may not be installed yet - the structure is ready for wiring up

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  fromName?: string
  fromAddress?: string
  html?: string
}

export async function sendEmail(
  options: SendEmailOptions
): Promise<{ data: unknown; error: string | null }> {
  // Will be implemented when Resend is configured
  // For now return a stub
  console.log("sendEmail called:", options.subject, "to:", options.to)
  return { data: null, error: null }
}
