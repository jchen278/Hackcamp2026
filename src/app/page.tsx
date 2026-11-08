import { auth0 } from "@/lib/auth0";
import { getFridgesWithInventory } from "@/features/pantries/queries";
import { HomePageClient } from "@/components/HomePageClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth0.getSession();
  const fridges = await getFridgesWithInventory();

  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }
    : null;

  return <HomePageClient user={user} initialFridges={fridges} />;
}