import React, { useState } from 'react';
import {
  DollarSign,
  X,
  ShoppingBag,
  TrendingUp,
  Package,
  Moon,
  Sun,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import {
  MarketItem,
  POŽAREVAC_MARKET_ITEMS,
  InventoryItem,
  TimeOfDay,
  StreetEconomyEngine,
} from '../services/streetEconomy';
import { audioDsp } from '../services/audioDsp';

export interface StreetMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCash: number;
  inventory: InventoryItem[];
  timeOfDay: TimeOfDay;
  onBuyItem: (item: MarketItem, quantity: number, price: number) => void;
  onSellItem: (invItem: InventoryItem, quantity: number, price: number) => void;
}

export const StreetMarketModal: React.FC<StreetMarketModalProps> = ({
  isOpen,
  onClose,
  playerCash,
  inventory,
  timeOfDay,
  onBuyItem,
  onSellItem,
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'inventory'>('market');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Sve' },
    { id: 'seeds', label: '🌱 Semenke' },
    { id: 'produce', label: '🌿 Bilje' },
    { id: 'contraband', label: '💾 Crno Tržište' },
    { id: 'booster', label: '⚡ Energetici' },
    { id: 'gear', label: '👕 Oprema' },
  ];

  const filteredMarketItems = POŽAREVAC_MARKET_ITEMS.filter((item) =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md font-mono p-4">
      <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-5 shadow-2xl max-w-2xl w-full text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-400 tracking-wider">
                ULIČNI BUVLJAK & TRGOVINA POŽAREVAC
              </div>
              <div className="text-[10px] text-slate-400">
                Kupi jeftino, preprodaj skupo, preokreni keš na ulici!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-400 font-black text-xs flex items-center gap-1 shadow-inner">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{playerCash.toLocaleString()} KEŠ</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Time of Day Market Banner */}
        <div className="my-3 p-2.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {timeOfDay === 'night' ? (
              <Moon className="w-4 h-4 text-purple-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <div>
              <span className="font-bold text-slate-300">Trenutno Doba: </span>
              <span className="font-black text-amber-300 uppercase">{timeOfDay}</span>
            </div>
          </div>
          {timeOfDay === 'night' ? (
            <span className="text-[10px] text-purple-300 font-bold bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-500/50">
              🌙 NOĆNO TRŽIŠTE: +50-80% VREDNOST CRNE ROBE!
            </span>
          ) : (
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/50">
              ☀️ DNEVNI BAZAR: STABILNE CENE SEMENA & OPREME
            </span>
          )}
        </div>

        {/* Navigation Tabs (Kupi na Pijaci vs Tvoj Ranac) */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              setActiveTab('market');
              audioDsp.playRotateTick();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'market'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>PONUDA NA TEZGAMA (KUPOVINA)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('inventory');
              audioDsp.playRotateTick();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>TVOJ RANAC ({inventory.length} PREDMETA)</span>
          </button>
        </div>

        {/* Categories Bar */}
        {activeTab === 'market' && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  audioDsp.playRotateTick();
                }}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold shrink-0 transition cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400'
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {activeTab === 'market' ? (
            filteredMarketItems.map((item) => {
              const { buy, sell } = StreetEconomyEngine.calculateItemPrices(item, timeOfDay);
              const canAfford = playerCash >= buy;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{item.name}</span>
                        {item.nightPriceMultiplier && timeOfDay === 'night' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900 border border-purple-400 text-purple-200">
                            HOT 🌙
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-400">${buy}</div>
                      <div className="text-[9px] text-slate-500">Otkup: ${sell}</div>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        onBuyItem(item, 1, buy);
                        audioDsp.playThugCoinSound();
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      KUPI
                    </button>
                  </div>
                </div>
              );
            })
          ) : inventory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Tvoj ranac je prazan! Kupi semenke na buvljaku ili uberi biljke na Čačalici.
            </div>
          ) : (
            inventory.map((inv) => {
              const baseMarketItem = POŽAREVAC_MARKET_ITEMS.find((m) => m.id === inv.itemId);
              const sellPrice = baseMarketItem
                ? StreetEconomyEngine.calculateItemPrices(baseMarketItem, timeOfDay).sell
                : inv.sellPrice;

              return (
                <div
                  key={inv.itemId}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{inv.icon}</span>
                    <div>
                      <div className="text-xs font-black text-white">{inv.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Količina u rancu: <span className="text-emerald-400 font-bold">{inv.quantity} kom</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-400">
                        +${sellPrice * inv.quantity}
                      </div>
                      <div className="text-[9px] text-slate-500">${sellPrice}/kom</div>
                    </div>

                    <button
                      onClick={() => {
                        onSellItem(inv, 1, sellPrice);
                        audioDsp.playThugCoinSound();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer"
                    >
                      PRODAJ 1
                    </button>
                    {inv.quantity > 1 && (
                      <button
                        onClick={() => {
                          onSellItem(inv, inv.quantity, sellPrice);
                          audioDsp.playThugCoinSound();
                        }}
                        className="px-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition cursor-pointer"
                      >
                        SVE ({inv.quantity})
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
