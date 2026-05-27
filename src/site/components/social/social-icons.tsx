import Link from "next/link";

export function SocialIconLink({ href, label, network }: { href: string; label: string; network: "facebook" | "instagram" | "x" }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-canvas hover:text-primary"
      target={href === "#" ? undefined : "_blank"}
      rel={href === "#" ? undefined : "noopener noreferrer"}
    >
      <SocialIcon network={network} />
    </Link>
  );
}

export function SocialIcon({ network }: { network: "facebook" | "instagram" | "x" }) {
  if (network === "facebook") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M14.2 8.4V6.9c0-.7.5-.9.9-.9h2.3V2.2L14.2 2c-3.6 0-4.4 2.7-4.4 4.4v2H7v4.2h2.8V22h4.3v-9.4h3.2l.5-4.2h-3.6Z" />
      </svg>
    );
  }

  if (network === "instagram") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.9 2.1a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6ZM12 7.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 2a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M13.9 10.5 21.4 2h-1.8l-6.5 7.4L7.9 2h-6l7.8 11.2L1.9 22h1.8l6.8-7.7 5.4 7.7h6l-8-11.5Zm-2.4 2.7-.8-1.1L4.4 3.3h2.7l5.1 7.2.8 1.1 6.6 9.2h-2.7l-5.4-7.6Z" />
    </svg>
  );
}
