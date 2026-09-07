"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MapPin, Package, User } from "lucide-react";
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
 * Every entry goes somewhere real AND somewhere DIFFERENT. "My profile" used
 * to point at /account/setup, which is the onboarding wizard and redirects
 * away the moment the profile is complete — so for every finished account it
 * was a link that visibly did nothing. It now goes to /account/profile, which
 * is the page you return to rather than the one you pass through once.
 */

const ACCOUNT_NAV = [
  { href: "/account/profile", label: "My profile", icon: User },
  { href: "/account", label: "Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  /* Labelled for what it holds. It was "Settings", which promised a
     preferences page and delivered an address book — and while the profile
     form also lived there, it overlapped "My profile" as well. */
  { href: "/account/settings", label: "Addresses", icon: MapPin },
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
  /* `auth` comes from the server on every check — it is not a cached copy of
     a localStorage profile, so an edit made in Shopify admin shows here. */
  const { auth, signOut } = useAuth();
  const { wishlist } = useCart();

  const initial = (auth?.firstName ?? "").charAt(0).toUpperCase() || "?";

  return (
    <aside className="space-y-4">
      <div className="flex items-center gap-4 px-1">
        {/* Initial rather than an avatar upload. There is nowhere to store an
            image, and a broken avatar is worse than none. */}
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-night text-[1.3rem] font-bold text-white">
          {initial}
        </span>
        <div className="min-w-0">
          {/* Falls back to "there" rather than rendering "Hi , good evening".
              The name can legitimately be absent for a moment on first load,
              and a greeting with a hole in it looks broken. */}
          <p className="truncate text-[0.95rem] font-semibold text-ink">
            Hi {auth?.firstName ?? "there"}, {greeting()}
          </p>
          <p className="truncate text-[0.78rem] text-muted">
            +91 {auth?.phone}
          </p>
          {/* Only when it is a real address. A customer who has not finished
              setup still carries the synthetic @phone.officemate.invalid
              placeholder, and printing that would be worse than printing
              nothing — see AuthState.profileComplete. */}
          {auth?.email && (
            <p className="truncate text-[0.78rem] text-muted">{auth.email}</p>
          )}
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
