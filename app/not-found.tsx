import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 pt-24">
      <div className="text-center">
        <span className="eyebrow">Error 404</span>
        <h1 className="display mt-4 text-5xl font-semibold text-ink sm:text-6xl">
          This page took a break
        </h1>
        <p className="lede mx-auto mt-5 max-w-md">
          The page you&apos;re after has moved or never existed. Let&apos;s get you
          back to something comfortable.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="primary" size="lg">
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/categories">Browse categories</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
