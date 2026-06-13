import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────
type Page = "home" | "inventory" | "upgrade" | "catalog" | "history" | "profile" | "support";

interface Skin {
  id: string;
  name: string;
  weapon: string;
  rarity: "consumer" | "industrial" | "milspec" | "restricted" | "classified" | "covert" | "extraordinary";
  wear: string;
  price: number;
  image: string;
  float: number;
  stattrak?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "upgrade" | "offer" | "info";
  time: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const HERO_IMG = "https://cdn.poehali.dev/projects/492c8702-220d-4cec-86f9-9df87b984e3f/files/d5b55878-fb9b-4ee5-994a-45833cb89ac8.jpg";
const AK_IMG = "https://cdn.poehali.dev/projects/492c8702-220d-4cec-86f9-9df87b984e3f/files/38d3ce61-d731-4cc5-afb9-aa26e3153719.jpg";
const KNIFE_IMG = "https://cdn.poehali.dev/projects/492c8702-220d-4cec-86f9-9df87b984e3f/files/cd0e2b43-e02f-444c-a20f-cc9465e24a61.jpg";

const MOCK_SKINS: Skin[] = [
  { id: "1", name: "Нео-нуар", weapon: "AWP", rarity: "covert", wear: "Factory New", price: 4250, image: AK_IMG, float: 0.012 },
  { id: "2", name: "Дракон Огненный Змей", weapon: "AK-47", rarity: "classified", wear: "Field-Tested", price: 1890, image: AK_IMG, float: 0.23, stattrak: true },
  { id: "3", name: "Изумрудный клинок", weapon: "Karambit", rarity: "extraordinary", wear: "Minimal Wear", price: 12400, image: KNIFE_IMG, float: 0.08 },
  { id: "4", name: "Ретрибьюшн", weapon: "M4A4", rarity: "restricted", wear: "Factory New", price: 680, image: AK_IMG, float: 0.04 },
  { id: "5", name: "Нуар", weapon: "Desert Eagle", rarity: "classified", wear: "Factory New", price: 2100, image: KNIFE_IMG, float: 0.01 },
  { id: "6", name: "Стальной крыс", weapon: "USP-S", rarity: "milspec", wear: "Well-Worn", price: 320, image: AK_IMG, float: 0.44 },
  { id: "7", name: "Пламенный дракон", weapon: "Glock-18", rarity: "restricted", wear: "Minimal Wear", price: 490, image: AK_IMG, float: 0.11 },
  { id: "8", name: "Синий сталь", weapon: "M9 Bayonet", rarity: "extraordinary", wear: "Factory New", price: 8700, image: KNIFE_IMG, float: 0.006 },
];

const MOCK_HISTORY = [
  { id: "tx001", type: "upgrade", from: "AK-47 | Нео-нуар", to: "AWP | Дракон", result: "win", profit: "+3 200 ₽", time: "2 мин назад", chance: 34 },
  { id: "tx002", type: "upgrade", from: "Glock-18 | Пламенный", to: "M4A4 | Хаулер", result: "lose", profit: "-490 ₽", time: "15 мин назад", chance: 68 },
  { id: "tx003", type: "deposit", from: "—", to: "Desert Eagle | Нуар", result: "win", profit: "+2 100 ₽", time: "1 час назад", chance: 100 },
  { id: "tx004", type: "upgrade", from: "USP-S | Нуар", to: "Karambit | Изумруд", result: "lose", profit: "-680 ₽", time: "3 часа назад", chance: 21 },
  { id: "tx005", type: "upgrade", from: "AWP | Нео-нуар", to: "Karambit | Стальной крыс", result: "win", profit: "+8 100 ₽", time: "вчера", chance: 19 },
];

const MOCK_NOTIFS: Notification[] = [
  { id: "n1", title: "Апгрейд завершён!", message: "AWP | Нео-нуар успешно обменян", type: "upgrade", time: "2 мин" },
  { id: "n2", title: "Новый скин", message: "Karambit | Crimson Web появился в каталоге", type: "offer", time: "10 мин" },
  { id: "n3", title: "Горячее предложение", message: "AK-47 | Огненный Змей -15% до 22:00", type: "offer", time: "30 мин" },
];

const RARITY_LABELS: Record<string, string> = {
  consumer: "Ширпотреб",
  industrial: "Промышленное",
  milspec: "Армейское",
  restricted: "Запрещённое",
  classified: "Засекреченное",
  covert: "Тайное",
  extraordinary: "Экстраординарное",
};

// ─── SkinCard ─────────────────────────────────────────────────────────────────
function SkinCard({ skin, onSelect, selected }: { skin: Skin; onSelect?: () => void; selected?: boolean }) {
  return (
    <div
      onClick={onSelect}
      className={`skin-card rounded-lg overflow-hidden ${onSelect ? "cursor-none" : ""} ${selected ? "border-primary/80 shadow-[0_0_20px_hsl(var(--primary)/0.3)]" : ""}`}
    >
      <div className="relative">
        <img src={skin.image} alt={skin.name} className="w-full h-36 object-cover" />
        {skin.stattrak && (
          <span className="absolute top-2 left-2 text-[10px] font-oswald font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-1.5 py-0.5 rounded">
            StatTrak™
          </span>
        )}
        <span className={`absolute top-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded border rarity-${skin.rarity} bg-black/60`}>
          {skin.float.toFixed(3)}
        </span>
      </div>
      <div className="p-3">
        <div className={`text-[10px] font-mono rarity-${skin.rarity} mb-0.5 uppercase tracking-wider`}>
          {RARITY_LABELS[skin.rarity]}
        </div>
        <div className="text-white font-rajdhani font-semibold text-sm leading-tight">{skin.weapon} | {skin.name}</div>
        <div className="text-muted-foreground text-xs mt-0.5">{skin.wear}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-primary font-oswald font-bold text-base">{skin.price.toLocaleString()} ₽</span>
          {onSelect && (
            <span className={`text-xs font-mono ${selected ? "text-primary" : "text-muted-foreground"}`}>
              {selected ? "✓ Выбрано" : "Выбрать"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NotifToast ───────────────────────────────────────────────────────────────
function NotifToast({ notif, onClose }: { notif: Notification; onClose: () => void }) {
  const icons: Record<string, string> = { success: "CheckCircle", upgrade: "Zap", offer: "Tag", info: "Info" };
  const colors: Record<string, string> = { success: "text-green-400", upgrade: "text-primary", offer: "text-yellow-400", info: "text-blue-400" };

  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="notif-toast rounded-lg p-3 flex items-start gap-3 min-w-[280px]">
      <Icon name={icons[notif.type]} fallback="Bell" size={18} className={colors[notif.type]} />
      <div className="flex-1">
        <div className="font-oswald text-white text-sm font-semibold">{notif.title}</div>
        <div className="text-muted-foreground text-xs mt-0.5">{notif.message}</div>
      </div>
      <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────
function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative min-h-[88vh] flex items-center overflow-hidden grid-bg scanlines">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="hero" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        <div className="absolute top-24 right-1/4 w-2 h-2 rounded-full bg-primary/60 animate-pulse-neon" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-purple-400/60 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-1/3 right-1/5 w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-primary" />
              <span className="font-mono text-primary text-xs tracking-widest uppercase">CS2 Upgrade Platform</span>
            </div>
            <h1 className="font-oswald text-6xl md:text-8xl font-bold text-white leading-none mb-2 glitch" data-text="UPGRADE">
              UPGRADE
            </h1>
            <h2 className="font-oswald text-4xl md:text-6xl font-bold leading-none mb-6" style={{ color: "hsl(var(--primary))", textShadow: "0 0 30px hsl(160 100% 50% / 0.6)" }}>
              ТВОЙ АРСЕНАЛ
            </h2>
            <p className="text-muted-foreground font-rajdhani text-lg md:text-xl mb-8 max-w-lg leading-relaxed">
              Превращай обычные скины в редкие. Умный апгрейд с честными шансами и мгновенным результатом. Войди через Steam — играй по-крупному.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="btn-steam flex items-center gap-2">
                <Icon name="LogIn" size={18} />
                Войти через Steam
              </button>
              <button onClick={() => setPage("catalog")} className="btn-neon flex items-center gap-2">
                <Icon name="Layers" size={18} />
                Каталог скинов
              </button>
            </div>
            <div className="flex gap-8 mt-12">
              {[{ label: "Апгрейдов", value: "1.2M+" }, { label: "Игроков", value: "84K+" }, { label: "Выплачено", value: "₽340M" }].map((s) => (
                <div key={s.label}>
                  <div className="font-oswald text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-muted-foreground font-mono text-xs uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h3 className="font-oswald text-3xl text-center text-white mb-12 tracking-wider">КАК ЭТО РАБОТАЕТ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "LogIn", step: "01", title: "Вход через Steam", desc: "Безопасная авторизация. Мы видим только публичный инвентарь." },
            { icon: "ArrowUpDown", step: "02", title: "Выбор апгрейда", desc: "Выбери скин из инвентаря и скин-цель. Видишь шансы в реальном времени." },
            { icon: "Zap", step: "03", title: "Мгновенный результат", desc: "Честный алгоритм. Победа — скин в инвентарь. Проигрыш — попробуй снова." },
          ].map((f) => (
            <div key={f.step} className="neon-border rounded-lg p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 font-oswald text-7xl font-bold text-white/3 leading-none select-none">{f.step}</div>
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                <Icon name={f.icon} size={20} className="text-primary" />
              </div>
              <div className="font-oswald text-white text-xl font-semibold mb-2">{f.title}</div>
              <div className="text-muted-foreground text-sm font-rajdhani leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hot skins */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-oswald text-3xl text-white tracking-wider">ГОРЯЧИЕ СКИНЫ</h3>
          <button onClick={() => setPage("catalog")} className="text-primary font-oswald text-sm uppercase tracking-wider hover:text-white transition-colors flex items-center gap-1">
            Все скины <Icon name="ChevronRight" size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MOCK_SKINS.slice(0, 4).map((skin) => (
            <SkinCard key={skin.id} skin={skin} />
          ))}
        </div>
      </div>
    </div>
  );
}

function InventoryPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const total = MOCK_SKINS.filter((s) => selected.includes(s.id)).reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-oswald text-4xl text-white tracking-wider">МОЙ ИНВЕНТАРЬ</h2>
          <p className="text-muted-foreground text-sm mt-1 font-mono">steam: ProPlayer_2077 · {MOCK_SKINS.length} предметов</p>
        </div>
        <div className="text-right">
          <div className="font-oswald text-2xl text-primary">{MOCK_SKINS.reduce((s, k) => s + k.price, 0).toLocaleString()} ₽</div>
          <div className="text-muted-foreground text-xs font-mono">общая стоимость</div>
        </div>
      </div>
      {selected.length > 0 && (
        <div className="neon-border rounded-lg p-4 mb-6 flex items-center justify-between animate-scale-in">
          <span className="text-white font-rajdhani">Выбрано: <span className="text-primary font-bold">{selected.length}</span> · {total.toLocaleString()} ₽</span>
          <div className="flex gap-3">
            <button className="btn-neon py-2 px-4 text-sm">Апгрейд</button>
            <button onClick={() => setSelected([])} className="text-muted-foreground hover:text-white text-sm transition-colors">Сбросить</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MOCK_SKINS.map((skin, i) => (
          <div key={skin.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <SkinCard skin={skin} onSelect={() => toggle(skin.id)} selected={selected.includes(skin.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function UpgradePage() {
  const [fromSkin] = useState<Skin>(MOCK_SKINS[1]);
  const [toSkin] = useState<Skin>(MOCK_SKINS[0]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

  const chance = Math.min(95, Math.round((fromSkin.price / toSkin.price) * 100));

  const doUpgrade = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setTimeout(() => {
      setResult(Math.random() < chance / 100 ? "win" : "lose");
      setSpinning(false);
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <h2 className="font-oswald text-4xl text-white tracking-wider mb-2">АПГРЕЙД</h2>
      <p className="text-muted-foreground text-sm font-mono mb-8">Обменяй скин на более редкий с шансом победы</p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        {/* From */}
        <div>
          <div className="font-oswald text-muted-foreground text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="Package" size={14} /> Ваш скин
          </div>
          <div className="skin-card rounded-lg overflow-hidden">
            <img src={fromSkin.image} alt={fromSkin.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <div className={`text-[10px] font-mono rarity-${fromSkin.rarity} mb-1`}>{RARITY_LABELS[fromSkin.rarity]}</div>
              <div className="text-white font-rajdhani font-semibold">{fromSkin.weapon} | {fromSkin.name}</div>
              <div className="text-primary font-oswald text-xl font-bold mt-1">{fromSkin.price.toLocaleString()} ₽</div>
            </div>
          </div>
        </div>

        {/* Chance circle */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(160 100% 50%)" strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 34 * chance / 100} ${2 * Math.PI * 34}`}
                style={{ filter: "drop-shadow(0 0 6px hsl(160 100% 50%))" }} />
            </svg>
            <span className="font-oswald font-bold text-xl text-white">{chance}%</span>
          </div>
          <div className="upgrade-arrow">
            <Icon name="ArrowRight" size={28} className="text-primary" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">шанс победы</span>
        </div>

        {/* To */}
        <div>
          <div className="font-oswald text-muted-foreground text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="Trophy" size={14} /> Цель апгрейда
          </div>
          <div className="skin-card rounded-lg overflow-hidden">
            <img src={toSkin.image} alt={toSkin.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <div className={`text-[10px] font-mono rarity-${toSkin.rarity} mb-1`}>{RARITY_LABELS[toSkin.rarity]}</div>
              <div className="text-white font-rajdhani font-semibold">{toSkin.weapon} | {toSkin.name}</div>
              <div className="text-primary font-oswald text-xl font-bold mt-1">{toSkin.price.toLocaleString()} ₽</div>
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`mt-6 rounded-lg p-6 text-center animate-scale-in border ${result === "win" ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`}>
          <Icon name={result === "win" ? "Trophy" : "X"} size={48} className={`mx-auto mb-2 ${result === "win" ? "text-yellow-400" : "text-red-400"}`} />
          <div className="font-oswald text-3xl font-bold text-white mb-1">{result === "win" ? "ПОБЕДА!" : "ПРОИГРЫШ"}</div>
          <div className="text-muted-foreground font-rajdhani">
            {result === "win" ? `${toSkin.weapon} | ${toSkin.name} добавлен в инвентарь` : `${fromSkin.weapon} | ${fromSkin.name} утерян`}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button onClick={doUpgrade} disabled={spinning} className="btn-neon px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {spinning ? (
            <span className="flex items-center gap-2">
              <Icon name="Loader2" size={20} className="animate-spin" />
              Апгрейд идёт...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Icon name="Zap" size={20} />
              Начать апгрейд
            </span>
          )}
        </button>
        <div className="text-muted-foreground font-mono text-xs mt-3">Комиссия: 3% · Честный алгоритм · Provably Fair</div>
      </div>
    </div>
  );
}

function CatalogPage() {
  const [search, setSearch] = useState("");
  const [filterRarity, setFilterRarity] = useState("all");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "float">("price-desc");

  const filtered = MOCK_SKINS
    .filter((s) => (filterRarity === "all" || s.rarity === filterRarity) && `${s.weapon} ${s.name}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "price-asc" ? a.price - b.price : sortBy === "price-desc" ? b.price - a.price : a.float - b.float);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
      <h2 className="font-oswald text-4xl text-white tracking-wider mb-6">КАТАЛОГ СКИНОВ</h2>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск скина..." className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 font-rajdhani" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "price-asc" | "price-desc" | "float")} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/60 font-rajdhani cursor-none">
          <option value="price-desc">Цена: выс→низ</option>
          <option value="price-asc">Цена: низ→выс</option>
          <option value="float">Float</option>
        </select>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "covert", "classified", "restricted", "milspec", "extraordinary"].map((r) => (
          <button key={r} onClick={() => setFilterRarity(r)} className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider border transition-all ${filterRarity === r ? `rarity-${r === "all" ? "consumer" : r} border-current bg-white/5` : "border-border text-muted-foreground hover:border-white/20"}`}>
            {r === "all" ? "Все" : RARITY_LABELS[r]}
          </button>
        ))}
      </div>
      <div className="text-muted-foreground text-xs font-mono mb-4">{filtered.length} предметов</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((skin, i) => (
          <div key={skin.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
            <SkinCard skin={skin} />
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPage() {
  const wins = MOCK_HISTORY.filter((h) => h.result === "win").length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <h2 className="font-oswald text-4xl text-white tracking-wider mb-2">ИСТОРИЯ ОПЕРАЦИЙ</h2>
      <p className="text-muted-foreground text-sm font-mono mb-8">Все транзакции и апгрейды</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Апгрейдов", value: MOCK_HISTORY.length, color: "text-white" },
          { label: "Побед", value: `${wins}/${MOCK_HISTORY.length}`, color: "text-green-400" },
          { label: "Винрейт", value: `${Math.round((wins / MOCK_HISTORY.length) * 100)}%`, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="neon-border rounded-lg p-4 text-center">
            <div className={`font-oswald text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="neon-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-0 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-secondary/30 px-4 py-2 border-b border-border">
          <div>Из</div><div>В</div>
          <div className="w-12 text-center">Шанс</div>
          <div className="w-20 text-right">Итог</div>
          <div className="w-20 text-right">Время</div>
        </div>
        {MOCK_HISTORY.map((tx, i) => (
          <div key={tx.id} className={`grid grid-cols-[1fr_1fr_auto_auto_auto] gap-0 px-4 py-3 border-b border-border/30 items-center text-sm font-rajdhani animate-fade-in ${i % 2 === 0 ? "" : "bg-secondary/10"}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="text-white text-sm truncate pr-2">{tx.from}</div>
            <div className="text-white text-sm truncate pr-2">{tx.to}</div>
            <div className="w-12 text-center font-mono text-xs text-muted-foreground">{tx.chance}%</div>
            <div className="w-20 text-right font-oswald font-bold text-sm" style={{ color: tx.result === "win" ? "#4ade80" : "#f87171" }}>{tx.profit}</div>
            <div className="w-20 text-right text-muted-foreground text-xs font-mono">{tx.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  const [notifSettings, setNotifSettings] = useState({ newSkins: true, upgrades: true, offers: false, price: true });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <h2 className="font-oswald text-4xl text-white tracking-wider mb-8">ПРОФИЛЬ</h2>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <div className="neon-border rounded-lg p-6 text-center h-fit">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center mx-auto mb-4 animate-pulse-neon">
            <Icon name="User" size={36} className="text-primary" />
          </div>
          <div className="font-oswald text-xl text-white font-bold">ProPlayer_2077</div>
          <div className="text-muted-foreground text-xs font-mono mt-1">Steam ID: 76561198...</div>
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {[["Статус", "ВЕРИФИЦИРОВАН", "text-primary text-xs font-oswald font-bold"], ["Регистрация", "12.03.2024", "text-white font-mono text-xs"], ["Апгрейдов", "247", "text-white font-oswald font-bold"]].map(([label, val, cls]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground font-rajdhani">{label}</span>
                <span className={cls}>{val}</span>
              </div>
            ))}
          </div>
          <button className="btn-steam w-full mt-6 flex items-center justify-center gap-2 text-sm">
            <Icon name="RefreshCw" size={14} /> Обновить Steam
          </button>
        </div>
        <div className="space-y-4">
          <div className="neon-border rounded-lg p-5">
            <h3 className="font-oswald text-lg text-white tracking-wider mb-4 flex items-center gap-2">
              <Icon name="Bell" size={18} className="text-primary" /> PUSH-УВЕДОМЛЕНИЯ
            </h3>
            {[
              { key: "newSkins", label: "Новые скины в каталоге", desc: "Когда появляются редкие предметы" },
              { key: "upgrades", label: "Завершение апгрейдов", desc: "Результат каждого апгрейда" },
              { key: "offers", label: "Горячие предложения", desc: "Скидки и акции платформы" },
              { key: "price", label: "Изменение цен", desc: "Когда цена скина меняется >10%" },
            ].map((s) => (
              <div key={s.key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                <div>
                  <div className="text-white font-rajdhani text-sm">{s.label}</div>
                  <div className="text-muted-foreground text-xs font-mono mt-0.5">{s.desc}</div>
                </div>
                <button
                  onClick={() => setNotifSettings((p) => ({ ...p, [s.key]: !p[s.key as keyof typeof p] }))}
                  className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${notifSettings[s.key as keyof typeof notifSettings] ? "bg-primary" : "bg-secondary"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notifSettings[s.key as keyof typeof notifSettings] ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="neon-border rounded-lg p-5">
            <h3 className="font-oswald text-lg text-white tracking-wider mb-4 flex items-center gap-2">
              <Icon name="Shield" size={18} className="text-primary" /> БЕЗОПАСНОСТЬ
            </h3>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <div>
                <div className="text-white font-rajdhani text-sm">Steam Guard</div>
                <div className="text-muted-foreground text-xs font-mono mt-0.5">Двухфакторная аутентификация</div>
              </div>
              <span className="text-green-400 font-mono text-xs">АКТИВЕН</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-white font-rajdhani text-sm">Последний вход</div>
                <div className="text-muted-foreground text-xs font-mono mt-0.5">14.06.2026, 15:42 · Москва</div>
              </div>
              <Icon name="CheckCircle" size={16} className="text-green-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", category: "upgrade", message: "" });
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      <h2 className="font-oswald text-4xl text-white tracking-wider mb-2">ПОДДЕРЖКА</h2>
      <p className="text-muted-foreground text-sm font-mono mb-8">Отвечаем в течение 30 минут</p>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
        <div className="neon-border rounded-lg p-6">
          {sent ? (
            <div className="text-center py-12 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={32} className="text-primary" />
              </div>
              <div className="font-oswald text-2xl text-white mb-2">ЗАЯВКА ОТПРАВЛЕНА</div>
              <div className="text-muted-foreground font-rajdhani">Ответим на {form.email || "вашу почту"} в течение 30 минут</div>
              <button onClick={() => { setSent(false); setForm({ name: "", email: "", category: "upgrade", message: "" }); }} className="btn-neon mt-6 text-sm px-6 py-2">
                Новый тикет
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[["name", "Имя", "ProPlayer"], ["email", "Email", "email@mail.ru"]].map(([key, label, ph]) => (
                  <div key={key}>
                    <label className="font-oswald text-xs text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
                    <input value={form[key as keyof typeof form]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={ph} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/60 font-rajdhani" />
                  </div>
                ))}
              </div>
              <div>
                <label className="font-oswald text-xs text-muted-foreground uppercase tracking-wider block mb-1">Категория</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/60 font-rajdhani cursor-none">
                  <option value="upgrade">Проблема с апгрейдом</option>
                  <option value="inventory">Инвентарь не обновляется</option>
                  <option value="payment">Вопрос по оплате</option>
                  <option value="bug">Ошибка на сайте</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              <div>
                <label className="font-oswald text-xs text-muted-foreground uppercase tracking-wider block mb-1">Сообщение</label>
                <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={5} placeholder="Опишите проблему..." className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/60 font-rajdhani resize-none" />
              </div>
              <button onClick={() => form.message && setSent(true)} className="btn-neon w-full flex items-center justify-center gap-2">
                <Icon name="Send" size={16} /> Отправить тикет
              </button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {[
            { icon: "MessageCircle", title: "Telegram", value: "@cs2upgrade_help", desc: "Быстрый ответ" },
            { icon: "Clock", title: "Время работы", value: "24/7", desc: "Всегда онлайн" },
            { icon: "Zap", title: "Среднее время", value: "< 30 мин", desc: "Время ответа" },
          ].map((c) => (
            <div key={c.title} className="neon-border rounded-lg p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name={c.icon} size={16} className="text-primary" />
              </div>
              <div>
                <div className="font-oswald text-white text-sm font-semibold">{c.title}</div>
                <div className="text-primary text-sm font-mono">{c.value}</div>
                <div className="text-muted-foreground text-xs font-rajdhani">{c.desc}</div>
              </div>
            </div>
          ))}
          <div className="neon-border rounded-lg p-4">
            <div className="font-oswald text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <Icon name="HelpCircle" size={16} className="text-primary" /> FAQ
            </div>
            {["Как работает апгрейд?", "Честный ли алгоритм?", "Как вывести скин?"].map((q) => (
              <button key={q} className="w-full text-left text-muted-foreground hover:text-white text-xs font-rajdhani py-2 border-b border-border/30 last:border-0 transition-colors flex items-center justify-between">
                {q} <Icon name="ChevronRight" size={12} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorDot.current) { cursorDot.current.style.left = `${e.clientX - 4}px`; cursorDot.current.style.top = `${e.clientY - 4}px`; }
      if (cursorRing.current) { cursorRing.current.style.left = `${e.clientX - 16}px`; cursorRing.current.style.top = `${e.clientY - 16}px`; }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    const timers = MOCK_NOTIFS.map((n, i) =>
      setTimeout(() => setToasts((p) => [...p, n]), [3000, 8000, 15000][i])
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  const NAV = [
    { id: "home", label: "Главная", icon: "Home" },
    { id: "inventory", label: "Инвентарь", icon: "Package" },
    { id: "upgrade", label: "Апгрейд", icon: "Zap" },
    { id: "catalog", label: "Каталог", icon: "Layers" },
    { id: "history", label: "История", icon: "Clock" },
    { id: "profile", label: "Профиль", icon: "User" },
    { id: "support", label: "Поддержка", icon: "HelpCircle" },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <div ref={cursorDot} className="cursor-dot" />
      <div ref={cursorRing} className="cursor-ring" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => setPage("home")} className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary flex items-center justify-center" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
              <Icon name="Zap" size={12} className="text-background" />
            </div>
            <span className="font-oswald font-bold text-white text-lg tracking-widest">CS2<span className="text-primary">UP</span></span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => setPage(n.id as Page)} className={`nav-item ${page === n.id ? "active" : ""}`}>
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
              <Icon name="Bell" size={18} />
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-background text-[9px] font-bold rounded-full flex items-center justify-center font-mono">
                {MOCK_NOTIFS.length}
              </span>
            </button>
            <button className="btn-steam text-xs px-3 py-1.5 hidden md:flex items-center gap-1.5">
              <Icon name="LogIn" size={14} /> Steam
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-muted-foreground hover:text-white">
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {/* Notif dropdown */}
        {notifOpen && (
          <div className="absolute right-6 top-16 w-80 bg-card border border-border rounded-lg overflow-hidden shadow-2xl animate-scale-in z-50">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-oswald text-white text-sm uppercase tracking-wider">Уведомления</span>
              <button onClick={() => setNotifOpen(false)}><Icon name="X" size={14} className="text-muted-foreground" /></button>
            </div>
            {MOCK_NOTIFS.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors">
                <div className="flex items-start gap-2">
                  <Icon name={n.type === "upgrade" ? "Zap" : "Tag"} size={14} className={`mt-0.5 ${n.type === "upgrade" ? "text-primary" : "text-yellow-400"}`} />
                  <div>
                    <div className="text-white text-xs font-rajdhani font-semibold">{n.title}</div>
                    <div className="text-muted-foreground text-xs font-rajdhani">{n.message}</div>
                    <div className="text-muted-foreground text-[10px] font-mono mt-0.5">{n.time} назад</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 bg-background/95 border-b border-border animate-fade-in">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => { setPage(n.id as Page); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${page === n.id ? "text-primary border-l-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-white"}`}>
                <Icon name={n.icon} size={16} />
                <span className="font-oswald text-sm uppercase tracking-wider">{n.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="pt-14">
        {page === "home" && <HomePage setPage={setPage} />}
        {page === "inventory" && <InventoryPage />}
        {page === "upgrade" && <UpgradePage />}
        {page === "catalog" && <CatalogPage />}
        {page === "history" && <HistoryPage />}
        {page === "profile" && <ProfilePage />}
        {page === "support" && <SupportPage />}
      </main>

      <footer className="border-t border-border/30 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary flex items-center justify-center" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
              <Icon name="Zap" size={10} className="text-background" />
            </div>
            <span className="font-oswald text-white text-sm tracking-widest">CS2<span className="text-primary">UP</span> © 2026</span>
          </div>
          <div className="text-muted-foreground text-xs font-mono text-center">Не аффилировано с Valve · Provably Fair · 18+</div>
          <div className="flex gap-4">
            {["Правила", "Конфиденциальность", "AML"].map((l) => (
              <button key={l} className="text-muted-foreground hover:text-white text-xs font-mono transition-colors">{l}</button>
            ))}
          </div>
        </div>
      </footer>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => <NotifToast key={t.id} notif={t} onClose={() => removeToast(t.id)} />)}
      </div>
    </div>
  );
}