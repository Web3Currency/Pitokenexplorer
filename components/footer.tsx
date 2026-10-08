function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.963 6.817H1.684l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  )
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2a9.91 9.91 0 0 0-8.53 15.03L2 22l5.11-1.49A9.9 9.9 0 1 0 12.04 2Zm0 17.1a7.18 7.18 0 0 1-3.66-1l-.26-.16-3.03.88.9-2.95-.17-.27a7.2 7.2 0 1 1 6.22 3.5Zm3.95-5.4c-.22-.11-1.3-.64-1.5-.71-.2-.08-.35-.11-.5.11-.15.22-.57.71-.7.86-.13.15-.26.16-.48.05-.22-.11-.93-.34-1.77-1.09-.65-.58-1.09-1.3-1.22-1.52-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.05-.11-.5-1.2-.69-1.65-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.39.05-.59.28-.2.22-.77.75-.77 1.84s.79 2.13.9 2.28c.11.15 1.55 2.37 3.75 3.32.52.22.93.36 1.25.46.53.17 1.01.15 1.39.09.42-.06 1.3-.53 1.48-1.04.18-.51.18-.94.13-1.04-.06-.09-.2-.15-.42-.26Z" />
    </svg>
  )
}

function GitHubIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.46 11.46 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

function TelegramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M21.94 3.15a1.1 1.1 0 0 0-1.13-.1L2.45 10.3a1.1 1.1 0 0 0 .06 2.05l4.67 1.64 1.73 5.36a1.1 1.1 0 0 0 1.86.37l2.6-2.67 4.64 3.4a1.1 1.1 0 0 0 1.74-.67l2.93-15.6a1.1 1.1 0 0 0-.74-1.03ZM9.02 13.67l8.96-6.16-6.98 7.36-.31 2.72-1.67-3.92Zm1.52 4.48.2-2.08 1.06 1.04-1.26 1.04Zm6.99.36-6.16-4.51 8.31-8.77-2.15 13.28Z" />
    </svg>
  )
}

function EmailIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M2.5 5.5A2.5 2.5 0 0 1 5 3h14a2.5 2.5 0 0 1 2.5 2.5v13A2.5 2.5 0 0 1 19 21H5a2.5 2.5 0 0 1-2.5-2.5v-13ZM5 5a.5.5 0 0 0-.31.89l6.67 5.34a1 1 0 0 0 1.25 0l6.67-5.34A.5.5 0 0 0 19 5H5Zm14.5 3.45-5.64 4.51a3 3 0 0 1-3.75 0L4.5 8.45v10.05c0 .28.22.5.5.5h14c.28 0 .5-.22.5-.5V8.45Z" />
    </svg>
  )
}

function FooterIconButton({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      {children}
    </button>
  )
}

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-8 text-center">
        {/* Temporary text mark until the official W3C logo URL is supplied. */}
        <div
          aria-label="W3C"
          className="text-5xl font-black leading-none tracking-[-0.08em] text-foreground"
        >
          W3C
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <FooterIconButton label="Official X" className="text-foreground">
            <XIcon className="h-6 w-6" />
          </FooterIconButton>

          <FooterIconButton label="Official WhatsApp Business" className="text-[#25D366]">
            <WhatsAppIcon className="h-7 w-7" />
          </FooterIconButton>

          <FooterIconButton label="Official GitHub" className="text-foreground">
            <GitHubIcon className="h-7 w-7" />
          </FooterIconButton>

          <FooterIconButton label="Official Telegram" className="text-[#229ED9]">
            <TelegramIcon className="h-7 w-7" />
          </FooterIconButton>

          <FooterIconButton label="Official email" className="text-red-500">
            <EmailIcon className="h-6 w-6" />
          </FooterIconButton>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          <span>© 2026 W3C Digital Network · PiToken Explorer</span>
        </div>
      </div>
    </footer>
  )
}
