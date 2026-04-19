import { useMemo, useState } from 'react';
import { Package, Scan, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CardModal } from '../modals/CardModal';
import { PackModal } from '../modals/PackModal';
import { SearchModal } from '../modals/SearchModal';
import { Scanner } from '../Scanner';
import { useAllCards } from '@/hooks/useCards';
import { useFx } from '@/hooks/useFx';
import { useCollectionStore } from '@/store/collection';
import { useConfigStore } from '@/store/config';
import { formatMYR, formatUSD } from '@/lib/utils';
import type { Card as CardT } from '@/lib/schemas';

export function Dashboard() {
  const { main, isLoading } = useAllCards();
  const owned = useCollectionStore((s) => s.owned);
  const currency = useConfigStore((s) => s.currency);
  const { data: rate = 4.7 } = useFx();
  const [openSearch, setOpenSearch] = useState(false);
  const [openPack, setOpenPack] = useState(false);
  const [openScan, setOpenScan] = useState(false);
  const [activeCard, setActiveCard] = useState<CardT | null>(null);

  const stats = useMemo(() => {
    const ownedSet = new Set(owned);
    const uniqueOwned = ownedSet.size;
    const total = main.length;
    const byCn = new Map<string, (typeof main)[number]>(
      main.map((c) => [c.collector_number, c] as const),
    );
    let valueUsd = 0;
    for (const cn of owned) valueUsd += byCn.get(cn)?.price_usd ?? 0;
    return {
      uniqueOwned,
      totalCards: owned.length,
      completion: total ? (uniqueOwned / total) * 100 : 0,
      setSize: total,
      valueUsd,
    };
  }, [main, owned]);

  const fmt = currency === 'MYR' ? (n: number) => formatMYR(n * rate) : formatUSD;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpenSearch(true)}>
          <Search className="h-4 w-4" /> Search
        </Button>
        <Button variant="outline" onClick={() => setOpenPack(true)}>
          <Package className="h-4 w-4" /> Log Pack
        </Button>
        <Button variant="outline" onClick={() => setOpenScan((v) => !v)}>
          <Scan className="h-4 w-4" /> Scan
        </Button>
      </div>

      {openScan && <Scanner />}

      {isLoading && !main.length ? (
        <div className="py-12 text-center text-muted-foreground">Loading set data…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Set Completion"
            value={`${stats.completion.toFixed(1)}%`}
            sub={`${stats.uniqueOwned}/${stats.setSize}`}
          />
          <StatCard title="Cards Owned" value={String(stats.totalCards)} sub="incl. duplicates" />
          <StatCard
            title="Collection Value"
            value={fmt(stats.valueUsd)}
            sub={currency === 'MYR' ? `@ ${rate.toFixed(2)} MYR/USD` : 'Scryfall prices'}
          />
          <StatCard title="Unique Cards" value={String(stats.uniqueOwned)} sub={`of ${stats.setSize}`} />
        </div>
      )}

      <SearchModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
        onPick={(c) => setActiveCard(c)}
      />
      <PackModal open={openPack} onClose={() => setOpenPack(false)} />
      <CardModal card={activeCard} onClose={() => setActiveCard(null)} />
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-[Cinzel]">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
