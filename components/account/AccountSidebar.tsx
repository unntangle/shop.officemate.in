"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Package, Settings, User } from "lucide-react";
import { useAuth } from "@/components/common/AuthProvider";
import { useCart } from "@/components/commerce/CartProvider";

/**
 * The account area's left column: who you are, where you can go, and log out.
 *
 * Shared by every /account page rather than copied into each. A sidebar that
 * differs between two pages in the same area is the clearest possible signal
 * that one of them was forgotten, and the active state depends on knowing the
 * full set of destinations in one place.
 *
 * Every entry goes somewhere real. Nothing is listed that does not yet exist —
 * see the note in app/account/page.tsx about Wallet and Rewards.
 */

const ACCOUNT_NAV = [
  { href: "/account/setup", label: "My profile", icon: User },
  { href: "/account", label: "Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

/** Time-of-day greeting. Purely cosmetic; no locale handling needed. */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "good morning";
  if (h < 17) return "good afternoon";
  return "good evening";
}

export function AccountSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { wishlist } = useCart();

  const initial = (profile?.firstName ?? "").charAt(0).toUpperCase() || "?";

  return (
    <aside className="space-y-4">
      <div className="flex items-center gap-4 px-1">
        {/* Initial rather than an avatar upload. There is nowhere to store an
            image, and a broken avatar is worse than none. */}
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-night text-[1.3rem] font-bold text-white">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.95rem] font-semibold text-ink">
            Hi {profile?.firstName}, {greeting()}
          </p>
          <p className="truncate text-[0.78rem] text-muted">
            +91 {profile?.phone}
          </p>
          <p className="truncate text-[0.78rem] text-muted">{profile?.email}</p>
        </div>
      </div>

      <nav className="overflow-hidden rounded-2xl bg-white p-2">
        {ACCOUNT_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[0.88rem] transition-colors ${
                active
                  ? "bg-surface font-semibold text-ink"
                  : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {label}
              {label === "Wishlist" && wishlist.length > 0 && (
                <span className="ml-auto text-[0.75rem] text-muted">
                  {wishlist.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* The one destructive action, outside the nav card so it cannot be
          mistaken for another destination.

          Hover deepens the tint rather than flipping to solid red. A logout
          button that turns bright red under the pointer reads as a warning
          that something is about to go wrong, and it becomes the loudest thing
          on the page at the moment someone is merely passing over it on the
          way to the nav above. */}
      <button
        onClick={signOut}
        className="w-full rounded-2xl bg-accent-soft py-3.5 text-[0.88rem] font-semibold text-accent transition-colors hover:bg-accent/15"
      >
        Log out
      </button>
    </aside>
  );
}
