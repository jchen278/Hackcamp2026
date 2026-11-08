import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Camera, Leaf, LogIn, MapPin, ShieldCheck, HeartHandshake, Plus, Menu, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useMockUser } from "@/lib/mock-auth";
import { useState } from "react";
import { FridgePicker, MapPreview, LocationStatus } from "@/components/FridgeLocator";
import { AddFridgeLocation } from "@/components/AddFridgeLocation";
import { useFridgeLocations } from "@/lib/fridge-locations";
import garden from "@/assets/abstract-harvest.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "PantryPulse — A little shared, a lot of good" },
    { name: "description", content: "Find community fridges in Vancouver, share surplus food, and help your neighbours with PantryPulse." },
    { property: "og:title", content: "PantryPulse — A little shared, a lot of good" },
    { property: "og:description", content: "Find community fridges, contribute food, and support your neighbourhood." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Home,
});

function Home() {
  const [user] = useMockUser();
  const [fridgeId, setFridgeId] = useState<string | null>(null);
  const fridges = useFridgeLocations();
  const fridge = fridges.find((f) => f.id === fridgeId);
  const uploadPath = user ? "/upload" : "/login";
  return <div className="min-h-screen bg-background font-sans">
    <nav className="editorial-nav border-b border-primary/15">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-4 sm:px-8">
        <Button asChild variant="ghost" className="h-11 justify-self-start px-0 text-primary">
          <Link to={user ? user.accountType === "admin" ? "/admin" : "/upload" : "/login"}><LogIn /><span className="max-w-24 truncate">{user ? user.name : "Log in"}</span></Link>
        </Button>
        <Link to="/" className="flex items-center gap-2 font-display text-xl text-primary"><Leaf className="h-4 w-4" />PantryPulse</Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open directory" title="Directory" className="h-11 w-11 justify-self-end text-primary"><Menu className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(event) => { if (window.location.hash === "#explore") event.preventDefault(); }}>
            <DropdownMenuItem asChild><Link to="/"><HomeIcon />Home</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/login"><LogIn />Log in</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to={uploadPath}><Camera />Upload a fridge photo</Link></DropdownMenuItem>
            <DropdownMenuItem asChild onSelect={() => { window.setTimeout(() => document.getElementById("explore")?.scrollIntoView({ block: "start" }), 100); }}><Link to="/" hash="explore"><MapPin />Find a fridge</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/admin"><ShieldCheck />Admin dashboard</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
    <main>
      <section className="pastoral-hero relative isolate overflow-hidden">
        <img src={garden} alt="Dreamy abstract watercolor of citrus, figs, wheat and bowls in sage and cream tones" width={1920} height={1088} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="pastoral-wash absolute inset-0 -z-10" />
        <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-12">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-primary">Good food. Shared freely.</p>
          <h1 className="hero-name text-primary">PantryPulse</h1>
          <p className="hero-tagline mt-2 font-display text-primary">A little shared,<br /><em>a lot of good.</em></p>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-primary">Find fresh food in your neighbourhood.<br />Share what you can. Take what you need.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-6"><a href="#explore"><MapPin /> Find a fridge</a></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-primary/40 bg-background/80 px-6"><Link to={uploadPath}><Camera /> Upload a fridge photo</Link></Button>
          </div>
        </div>
        <span className="absolute bottom-5 right-6 hidden text-xs text-primary-foreground lg:block">Nourishing neighbours, together.</span>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="flex items-end justify-between gap-4 border-b border-primary/20 pb-6"><div><p className="section-kicker">01 / How it works</p><h2 className="mt-2 text-3xl font-medium sm:text-4xl">Small acts. <em>Shared abundance.</em></h2></div><ArrowDown className="mb-1 hidden h-6 w-6 text-primary sm:block" /></div>
        <ol className="mt-7 grid gap-7 md:grid-cols-3">
          {[
            { icon: MapPin, title: "Find", text: "Discover a community fridge near you and see what’s available. Everyone is welcome.", link: "Explore locations", href: "#explore" },
            { icon: Camera, title: "Contribute", text: "Share a photo, review the food items, and confirm your update for approval.", link: "Volunteers & donors sign in", to: uploadPath },
            { icon: ShieldCheck, title: "Coordinate", text: "Help keep food flowing. See fridge stock, shortages, and neighbourhood updates.", link: "Foodbank Coordinators & Managers", to: user?.accountType === "admin" ? "/admin" : "/login" },
          ].map((step, i) => <li key={step.title} className="min-w-0"><div className="flex items-center gap-3 text-primary"><step.icon className="h-5 w-5" /><span className="text-xs">0{i + 1}</span></div><h3 className="mt-3 text-2xl font-medium">{step.title}</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{step.text}</p><Button asChild variant="link" className="mt-3 h-auto max-w-full justify-start whitespace-normal px-0 text-left">{step.href ? <a href={step.href}>{step.link}<ArrowUpRight /></a> : <Link to={step.to === "/admin" ? "/admin" : step.to === "/upload" ? "/upload" : "/login"}>{step.link}<ArrowUpRight /></Link>}</Button></li>)}
        </ol>
      </section>

      <section id="explore" className="scroll-mt-5 bg-card py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="section-kicker">02 / Explore community fridges</p><h2 className="mt-2 text-3xl font-medium sm:text-4xl">Good food, <em>closer to home.</em></h2><p className="mt-3 text-sm text-muted-foreground">Find a spot in your neighbourhood. No login needed.</p></div><AddFridgeLocation onAdded={setFridgeId} /></div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <MapPreview fridges={fridges} selected={fridgeId} onSelect={setFridgeId} />
            <FridgePicker fridges={fridges} value={fridgeId} onChange={setFridgeId} />
          </div>
          {fridge && <div className="mt-6 border-t pt-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl">{fridge.name}</h3><p className="mt-1 text-sm text-muted-foreground">{fridge.address}{fridge.neighbourhood && ` · ${fridge.neighbourhood}`}</p>{!fridge.coordinates && <p className="mt-1 text-xs text-muted-foreground">Map pin not set.</p>}</div><LocationStatus fridge={fridge} /></div><p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Currently available</p>{fridge.inventory.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{fridge.inventory.map((item) => <li key={item.name} className="flex justify-between border-b py-2 text-sm"><span>{item.name} <span className="text-muted-foreground">· {item.category}</span></span><span className="font-semibold">{item.quantity}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No items reported yet.</p>}</div>}
        </div>
      </section>

      <section id="impact" className="bg-secondary/50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8"><p className="section-kicker">03 / Our impact</p><h2 className="mt-2 max-w-2xl text-3xl font-medium sm:text-4xl">More than food.<br /><em>A community that cares.</em></h2><div className="mt-8 grid gap-6 md:grid-cols-2"><div className="rounded-2xl border border-primary/20 bg-background/70 p-6"><p className="section-kicker">Our vision</p><p className="mt-3 font-display text-xl leading-relaxed text-primary sm:text-2xl">A city where no neighbour goes hungry and good food is shared freely.</p></div><div className="rounded-2xl border border-primary/20 bg-background/70 p-6"><p className="section-kicker">Our mission</p><p className="mt-3 font-display text-xl leading-relaxed text-primary sm:text-2xl">To keep community fridges full by making it easy for neighbours to share food and report what's available.</p></div></div><ul className="mt-8 grid gap-6 md:grid-cols-3">{[{ icon: HeartHandshake, title: "Food accessibility", text: "A welcoming place to find nourishment, without barriers." }, { icon: Leaf, title: "Less food waste", text: "Surplus finds a new home, instead of going to waste." }, { icon: Plus, title: "Stronger together", text: "Neighbours helping neighbours, one shared shelf at a time." }].map((item) => <li key={item.title} className="border-t border-primary/20 pt-5"><item.icon className="h-5 w-5 text-primary" /><h3 className="mt-3 text-xl font-medium">{item.title}</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{item.text}</p></li>)}</ul></div>
      </section>

      <section id="get-involved" className="mx-auto max-w-7xl px-5 py-14 text-center sm:px-8 sm:py-20"><Leaf className="mx-auto h-7 w-7 text-primary" /><p className="section-kicker mt-4">04 / Get involved</p><h2 className="mt-3 text-3xl font-medium sm:text-5xl">There’s a place<br /><em>for you at the table.</em></h2><p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">Donate a little extra. Give a little time. Share a photo.<br />Every small act helps a neighbour.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Button asChild size="lg" className="h-12 rounded-full"><Link to={uploadPath}>Volunteer or donate <ArrowUpRight /></Link></Button><Button asChild variant="outline" size="lg" className="h-12 rounded-full"><a href="#explore">Browse as a guest <MapPin /></a></Button></div></section>
    </main>
    <footer className="border-t border-primary/20"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8"><span className="font-display text-lg text-primary">PantryPulse</span><span className="text-xs text-muted-foreground">With care, for our neighbours. · Vancouver, BC</span></div></footer>
  </div>;
}
