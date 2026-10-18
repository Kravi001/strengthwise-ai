"use client";

import * as React from "react";
import Link from "next/link";
import { Dumbbell, X, Check, ArrowRight } from "lucide-react";

interface GuestAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  redirectPath?: string;
  actionName?: string;
}

export function GuestAuthModal({
  isOpen,
  onClose,
  title = "Create an athlete profile to save your workouts",
  description = "StrengthWise AI saves your sessions, progressive overload telemetry, and nutritional data to your personal athlete profile.",
  redirectPath = "/workouts",
  actionName = "save your progress",
}: GuestAuthModalProps) {
  if (!isOpen) return null;

  const profileHref = `/profile?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 animate-in fade-in duration-150 ease-out"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 shadow-xl relative text-left animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150 ease-out"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-auth-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Guest Telemetry Preview
              </div>
              <h3 id="guest-auth-title" className="text-sm sm:text-base font-bold text-white">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="py-4 space-y-3.5">
          <p className="text-xs text-neutral-300 leading-relaxed">
            {description}
          </p>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 space-y-2">
            <div className="text-[10px] uppercase font-mono font-semibold tracking-wider text-neutral-400">
              Athlete Profile Benefits:
            </div>
            <ul className="space-y-1.5 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Synchronize routine sets, weights, and RPE to PostgreSQL</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Track 1RM trajectory &amp; automated progressive overload</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Personalized macro rollover and AI coaching consultation</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
          >
            Keep Exploring
          </button>
          <Link
            href={profileHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-neutral-950 transition-colors duration-150 ease-out shadow-sm"
          >
            <span>Create Profile / Sign In</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
