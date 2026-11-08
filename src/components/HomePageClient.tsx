"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  HeartHandshake,
  Plus,
  Menu,
  Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FridgePicker, MapPreview, LocationStatus } from "@/components/FridgeLocator";
import { AddFridgeLocation } from "@/components/AddFridgeLocation";
import { useFridgeLocations } from "@/lib/fridge-locations";
import garden from "@/assets/community-garden.jpg";

interface UserProfile {
  name?: string | null;
  email?: string | null;
}

export function HomePageClient({ user }: { user: UserProfile | null }) {
  const [fridgeId, setFridgeId] = useState<string | null>(null);
  const fridges = useFridgeLocations();
  const fridge = fridges.find((f) => f.id === fridgeId);

  const scanPath = "/scan";
  const loginPath = "/auth/login";
  const logoutPath = "/auth/logout";

  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : null);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Editorial Navigation */}
      <nav className="editorial-nav border-b border-primary/15 sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-4 sm:px-8">
          <div className="justify-self-start flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" className="h-10 px-3 text-primary gap-2">
                  <Link href="/scan">
                    <Camera className="h-4 w-4" />
                    <span className="max-w-28 truncate font-medium">
                      {displayName ?? "Volunteer"}
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="h-10 text-xs text-muted-foreground hover:text-destructive">
                  <a href={logoutPath} title="Log out">
                    <LogOut className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : (
              <Button asChild variant="ghost" className="h-10 px-3 text-primary gap-2">
                <a href={loginPath}>
                  <LogIn className="h-4 w-4" />
                  <span>Log in</span>
                </a>
              </Button>
            )}
          </div>

          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <Leaf className="h-5 w-5" />
            <span>PantryPulse</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open directory"
                title="Directory"
                className="h-10 w-10 justify-self-end text-primary"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              onCloseAutoFocus={(event) => {
                if (typeof window !== "undefined" && window.location.hash === "#explore") {
                  event.preventDefault();
                }
              }}
            >
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2">
                  <HomeIcon className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </DropdownMenuItem>
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/scan" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span>Scan &amp; Upload Fridge</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={logoutPath} className="flex items-center gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      <span>Log out ({displayName})</span>
                    </a>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <a href={loginPath} className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Volunteer Log In</span>
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                asChild
                onSelect={() => {
                  window.setTimeout(() => {
                    document.getElementById("explore")?.scrollIntoView({ block: "start", behavior: "smooth" });
                  }, 100);
                }}
              >
                <a href="#explore" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Find a fridge</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main>
        {/* Pastoral Hero */}
        <section className="pastoral-hero relative isolate overflow-hidden min-h-[520px] flex items-center">
          <Image
            src={garden}
            alt="PantryPulse community fridge garden"
            priority
            fill
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="pastoral-wash absolute inset-0 -z-10" />
          <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-5 py-12 sm:px-8 lg:px-12 w-full">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Good food. Shared freely.
            </p>
            <h1 className="hero-name text-primary">PantryPulse</h1>
            <p className="hero-tagline mt-2 font-display text-primary">
              A little shared,<br />
              <em className="italic">a lot of good.</em>
            </p>
            <p className="mt-5 max-w-md text-base leading-relaxed text-primary/90 font-medium">
              Find fresh food in your neighbourhood.<br />
              Share what you can. Take what you need.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-12 rounded-full px-6 shadow-md gap-2">
                <a href="#explore">
                  <MapPin className="h-4 w-4" /> Find a fridge
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-primary/40 bg-background/80 px-6 backdrop-blur-sm gap-2"
              >
                <Link href={scanPath}>
                  <Camera className="h-4 w-4" /> Upload a fridge photo
                </Link>
              </Button>
            </div>
          </div>
          <span className="absolute bottom-5 right-6 hidden text-xs font-medium text-primary lg:block">
            Nourishing neighbours, together.
          </span>
        </section>

        {/* 01 / How it works */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="flex items-end justify-between gap-4 border-b border-primary/20 pb-6">
            <div>
              <p className="section-kicker">01 / How it works</p>
              <h2 className="mt-2 text-3xl font-medium sm:text-4xl text-foreground">
                Small acts. <em className="italic font-display">Shared abundance.</em>
              </h2>
            </div>
            <ArrowDown className="mb-1 hidden h-6 w-6 text-primary sm:block" />
          </div>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Find",
                text: "Discover a community fridge near you and see what’s available. Everyone is welcome.",
                link: "Explore locations",
                href: "#explore",
              },
              {
                icon: Camera,
                title: "Contribute",
                text: "Share a snapshot, review detected food items, and confirm your update to help keep inventories accurate.",
                link: "Volunteers & donors scan here",
                href: scanPath,
              },
              {
                icon: ShieldCheck,
                title: "Coordinate",
                text: "Help keep food flowing. See fridge stock, shortages, and automated restock alerts.",
                link: "Foodbank Coordinators & Managers",
                href: "/admin",
              },
            ].map((step, i) => (
              <li key={step.title} className="min-w-0 bg-card/60 rounded-2xl p-6 border border-primary/10">
                <div className="flex items-center gap-3 text-primary">
                  <step.icon className="h-5 w-5" />
                  <span className="text-xs font-bold font-mono">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-2xl font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                <Button asChild variant="link" className="mt-4 h-auto px-0 text-left font-medium text-primary">
                  <a href={step.href}>
                    {step.link} <ArrowUpRight className="h-3.5 w-3.5 inline ml-1" />
                  </a>
                </Button>
              </li>
            ))}
          </ol>
        </section>

        {/* 02 / Explore community fridges */}
        <section id="explore" className="scroll-mt-8 bg-card py-16 sm:py-20 border-y border-border">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="section-kicker">02 / Explore community fridges</p>
                <h2 className="mt-2 text-3xl font-medium sm:text-4xl text-foreground">
                  Good food, <em className="italic font-display">closer to home.</em>
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Find a spot in your neighbourhood. Real-time updates without barriers.
                </p>
              </div>
              <AddFridgeLocation onAdded={setFridgeId} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <MapPreview fridges={fridges} selected={fridgeId} onSelect={setFridgeId} />
              <FridgePicker fridges={fridges} value={fridgeId} onChange={setFridgeId} />
            </div>

            {fridge && (
              <div className="mt-8 border-t border-border pt-6 bg-muted/30 rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold">{fridge.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fridge.address}
                      {fridge.neighbourhood && ` · ${fridge.neighbourhood}`}
                    </p>
                    {!fridge.coordinates && (
                      <p className="mt-1 text-xs text-muted-foreground">Map pin not set.</p>
                    )}
                  </div>
                  <LocationStatus fridge={fridge} />
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Currently available items
                  </p>
                  {fridge.inventory.length ? (
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {fridge.inventory.map((item) => (
                        <li
                          key={item.name}
                          className="flex items-center justify-between border-b border-border/80 py-2.5 text-sm"
                        >
                          <span>
                            <strong className="font-medium text-foreground">{item.name}</strong>{" "}
                            <span className="text-xs text-muted-foreground">· {item.category}</span>
                          </span>
                          <span className="font-mono font-semibold rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                            {item.quantity} units
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground italic">
                      No items reported yet for this location.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={`/scan?fridgeId=${fridge.id}`}>
                      <Camera className="h-3.5 w-3.5 mr-1" /> Update this fridge
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 03 / Our impact */}
        <section id="impact" className="bg-secondary/40 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="section-kicker">03 / Our impact</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-medium sm:text-4xl text-foreground">
              More than food.<br />
              <em className="italic font-display">A community that cares.</em>
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-primary/20 bg-background/80 p-7 shadow-soft">
                <p className="section-kicker">Our vision</p>
                <p className="mt-3 font-display text-xl leading-relaxed text-primary sm:text-2xl">
                  A city where no neighbour goes hungry and good food is shared freely.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-background/80 p-7 shadow-soft">
                <p className="section-kicker">Our mission</p>
                <p className="mt-3 font-display text-xl leading-relaxed text-primary sm:text-2xl">
                  To keep community fridges full by making it easy for neighbours to share food and report what&apos;s available.
                </p>
              </div>
            </div>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: HeartHandshake,
                  title: "Food accessibility",
                  text: "A welcoming place to find nourishment, without barriers or paperwork.",
                },
                {
                  icon: Leaf,
                  title: "Less food waste",
                  text: "Surplus finds a new home immediately, instead of going to waste.",
                },
                {
                  icon: Plus,
                  title: "Stronger together",
                  text: "Neighbours helping neighbours, one shared shelf at a time.",
                },
              ].map((item) => (
                <li key={item.title} className="border-t border-primary/20 pt-6">
                  <item.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 text-xl font-medium">{item.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 04 / Get involved */}
        <section id="get-involved" className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 sm:py-24">
          <Leaf className="mx-auto h-8 w-8 text-primary" />
          <p className="section-kicker mt-4">04 / Get involved</p>
          <h2 className="mt-3 text-3xl font-medium sm:text-5xl text-foreground">
            There’s a place<br />
            <em className="italic font-display">for you at the table.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Donate a little extra. Give a little time. Share a photo.<br />
            Every small act helps a neighbour.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="h-12 rounded-full px-8 shadow-md">
              <Link href={scanPath}>
                Volunteer or donate <ArrowUpRight className="h-4 w-4 ml-1 inline" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-8">
              <a href="#explore">
                Browse as a guest <MapPin className="h-4 w-4 ml-1 inline" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-card/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-8 sm:px-8">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-display text-xl font-bold text-primary">PantryPulse</span>
          </div>
          <span className="text-xs text-muted-foreground">
            With care, for our neighbours. · Vancouver, BC
          </span>
        </div>
      </footer>
    </div>
  );
}
