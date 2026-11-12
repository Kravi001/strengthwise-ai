import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";

interface SampleDataBannerProps {
  /** One short sentence on what a profile unlocks on this page. */
  message: string;
  /** Where to send the user back to after they sign in / finish their profile. */
  redirectPath?: string;
  /** Optional click handler (e.g. open the sign-in modal) instead of navigating. */
  onAction?: () => void;
  actionLabel?: string;
}

/** Shown on app pages when the visitor has no profile yet, so it's clear the numbers are examples. */
export function SampleDataBanner({
  message,
  redirectPath,
  onAction,
  actionLabel = "Create free profile",
}: SampleDataBannerProps) {
  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-neutral-950 transition-colors duration-150 ease-out shrink-0 w-full sm:w-auto";

  return (
    <div
      role="status"
      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <Eye className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">You&apos;re viewing sample data</p>
          <p className="text-xs text-neutral-400 mt-0.5">{message}</p>
        </div>
      </div>
      {onAction ? (
        <button type="button" onClick={onAction} className={buttonClass}>
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Link href={redirectPath ? `/profile?redirect=${redirectPath}` : "/profile"} className={buttonClass}>
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
