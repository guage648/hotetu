import React, { useEffect, useMemo, useState, useRef } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// =======================================================================
// ===== 導入您提供的工具函式與元件 =====
// =======================================================================

// 價格計算邏輯 (來自您提供的 src/utils/price.ts)
const PRICE_FIELD_CANDIDATES = [
  ["基礎價格(JPY)", "基础价格(JPY)"]
];
const ROOM_PRICE_FIELDS = [
  ["價格1", "价格1"],
  ["價格2", "价格2"],
  ["價格3", "价格3"],
];
function pickFirstExistingKey(row: Record<string, any>, keys: string[]): string | null {
  for (const k of keys) {
    if (k in row && row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") return k;
  }
  return null;
}
function toNumberStrict(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function computeDisplayBaseJPY(row: Record<string, any>): number | null {
  for (const cand of PRICE_FIELD_CANDIDATES) {
    const key = pickFirstExistingKey(row, cand);
    if (key) {
      const val = toNumberStrict(row[key]);
      if (val !== null) return val;
    }
  }
  const candidates: number[] = [];
  for (const fields of ROOM_PRICE_FIELDS) {
    const key = pickFirstExistingKey(row, fields);
    if (key) {
      const val = toNumberStrict(row[key]);
      if (val !== null) candidates.push(val);
    }
  }
  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}
function formatJPY(n: number | null): string {
  if (n === null) return "—";
  try {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n) + '〜';
  } catch {
    return `¥${n.toLocaleString()}〜`;
  }
}


// VR 看房元件 (來自您提供的 src/components/VRQuickConnect.tsx)
function VRQuickConnect({
  title = 'VR看房',
  deviceName = 'PICO 3',
  buttonText = 'VRで見る',
  closeAfterMs = 3000,
  onFinish,
}: { title?: string, deviceName?: string, buttonText?: string, closeAfterMs?: number, onFinish?: () => void }) {
    const [open, setOpen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState<0 | 1 | 2>(0);
    const timerRef = useRef<number | null>(null);
    const startRef = useRef<number>(0);

    const openModal = () => {
        setOpen(true);
        setProgress(0);
        setStep(0);
        startRef.current = performance.now();
    };

    const closeModal = () => {
        setOpen(false);
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => {
        if (!open) return;
        if (timerRef.current) window.clearInterval(timerRef.current);

        const total = Math.max(1200, closeAfterMs);
        const successHold = 350;
        const progressDuration = total - successHold;

        timerRef.current = window.setInterval(() => {
            const elapsed = performance.now() - startRef.current;
            const pct = Math.max(0, Math.min(100, Math.floor((elapsed / progressDuration) * 100)));
            setProgress(pct);
            if (pct < 40) setStep(0); else if (pct < 85) setStep(1); else setStep(2);

            if (pct >= 100) {
                if(timerRef.current) window.clearInterval(timerRef.current);
                timerRef.current = null;
                onFinish?.();
                setTimeout(() => closeModal(), successHold);
            }
        }, 50);

        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [open, closeAfterMs, onFinish]);
    
    // ... (VRQuickConnect 的樣式和 JSX ... 省略以保持簡潔，請確保您檔案中有這部分)
}


// =======================================================================
// ===== 1. データと設定 (Data & Settings) =====
// =======================================================================
const API_KEY = "YOUR_GOOGLE_API_KEY"; // 請務必替換成您的 API Key
const SPREADSHEET_ID = "1-JYNZ9XSx2wAfBSOoKQHvAkilmGM3YYwjWIDvUb9mzw";

// ... (其他設定如 DESTINATIONS, COLORS, Icon 元件等)

// =======================================================================
// ===== 3. メインアプリケーション (Main Application) =====
// =======================================================================

function HotelBookingApp() {
    const [allHotels, setAllHotels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            const hotelSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:AH?key=${API_KEY}`;
            try {
                const res = await fetch(hotelSheetUrl);
                if (!res.ok) throw new Error(`Google Sheets API 請求失敗 (Status: ${res.status})`);
                
                const data = await res.json();
                const values = data.values;
                if (!values || values.length < 2) throw new Error("工作表中沒有有效的資料");

                const headers = values[0];
                const rows = values.slice(1);

                const formattedData = rows.map((row, index) => {
                    const h: Record<string, any> = {};
                    headers.forEach((header, i) => { h[header] = row[i]; });

                    return {
                        id: parseInt(h.ID, 10) || index,
                        name: h.酒店標題,
                        // ... 其他欄位 ...
                        cover_image_url: h.封面圖,
                        poster_image_url: h.詳情圖集1,
                        detail_image_1: h.詳情圖集2,
                        detail_image_2: h.詳情圖集3,
                        address: h.詳細地址,
                        raw: h, // ★★★ 將原始行數據傳遞給價格計算函式
                    };
                }).filter(h => h.name); // 過濾掉沒有名稱的空行

                setAllHotels(formattedData);
            } catch (err: any) {
                setError(err.message);
                console.error("資料獲取錯誤:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectedHotel = useMemo(() => allHotels.find((h) => h.id === selectedHotelId), [selectedHotelId, allHotels]);

    // ... (HotelCard, HotelList, HotelDetailView 等元件定義)
    
    function HotelCard({ hotel, onSelect }: { hotel: any, onSelect: (id: number) => void }) {
        // ★★★ 使用新的價格計算邏輯 ★★★
        const displayPrice = formatJPY(computeDisplayBaseJPY(hotel.raw));
        
        return (
            <div onClick={() => onSelect(hotel.id)} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10, cursor: 'pointer' }}>
                <img src={hotel.cover_image_url} alt={hotel.name} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                <h4>{hotel.name}</h4>
                <p style={{ fontWeight: 'bold', color: '#D32F2F' }}>{displayPrice}</p>
            </div>
        );
    }

    function HotelDetailView({ hotel, onClose }: { hotel: any, onClose: () => void }) {
        return (
            <div>
                <button onClick={onClose}>← 返回</button>
                <h2>{hotel.name}</h2>
                <img src={hotel.poster_image_url} alt={hotel.name} style={{ width: '100%', maxWidth: 400 }}/>
                <p>{hotel.address}</p>
                
                {/* ★★★ 在詳情頁中插入 VR 看房元件 ★★★ */}
                <VRQuickConnect />

            </div>
        );
    }

    if (isLoading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error}</div>;

    return (
        <div>
            {selectedHotel ? (
                <HotelDetailView hotel={selectedHotel} onClose={() => setSelectedHotelId(null)} />
            ) : (
                <div>
                    <h1>飯店列表</h1>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                        {allHotels.map(hotel => (
                            <HotelCard key={hotel.id} hotel={hotel} onSelect={setSelectedHotelId} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default HotelBookingApp;import React, { useEffect, useMemo, useState, useRef } from "react";
// date-fnsライブラリがインストールされていることを確認してください: npm install date-fns
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// =======================================================================
// ===== 1. データと設定 (Data & Settings) =====
// =======================================================================

// ご自身のAPIキーを下の""の間に貼り付けてください
const API_KEY = "AIzaSyCekunnrHWHLV92zrz51HvI2l-LDzbyqKw";
// すべてのデータ（ホテル情報、プロモーション、詳細画像）を含むメインのシートID
// ★ 修正済: 正しいスプレッドシートID
const SPREADSHEET_ID = "1-JYNZ9XSx2wAfBSOoKQHvAkilmGM3YYwjWIDvUb9mzw";

// =======================================================================

const DESTINATIONS = [
  { id: 0, name: "すべて" },
  { id: 1, name: "蒼穹の門" },
  { id: 2, name: "暁風港" },
  { id: 3, name: "流星の跡" },
  { id: 4, name: "未知なる城" },
  { id: 5, name: "光の道" },
  { id: 6, name: "霞光ステーション" },
];

// =======================================================================
// ===== 2. 補助ツールとコンポーネント (Helpers & Components) =====
// =======================================================================

const COLORS = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  text: "#212529",
  textSecondary: "#6c757d",
  accent: "#D32F2F",
  cardBorder: "#dee2e6",
  softAccent: "rgba(211, 47, 47, 0.1)",
  star: "#FFB300",
  gradient: "linear-gradient(45deg, #e53935, #d81b60)",
};

const Icon = ({ name, size = 20, className = "", style = {} }) => {
  const GradientIconWrapper = ({ id }) => (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#e53935", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#d81b60", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  );
  const icons = {
    back: (<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />),
    star: (<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />),
    close: (<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />),
    sort: <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />,
    search: (<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />),
    navigation: <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />,
    vr: (<path d="M20.59 6.21C19.82 5.45 18.72 5 17.5 5H10c-1.22 0-2.32.45-3.09 1.21L5.5 7.62l1.41 1.41L8.32 7.62c.4-.4 1-.62 1.68-.62h7.5c.68 0 1.28.22 1.68.62l1.41 1.41 1.41-1.41-1.41-1.41zM18 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM6 10.5c-.83 0-1.5.67-1.5 1.5S5.17 13.5 6 13.5s1.5-.67 1.5-1.5S6.83 10.5 6 10.5zM21 15.58c-1.11-1.11-2.69-1.58-4.24-1.58H7.24c-1.55 0-3.13.47-4.24 1.58L3 15.58V18h18v-2.42l-.01.01z" />),
    boutique: (<><GradientIconWrapper id="grad-boutique" /><path fill="url(#grad-boutique)" d="M3 21h18v-2H3v2zM5 17h14v-4H5v4zM12 2L3 6v2h18V6L12 2z" /></>),
    family: (<><GradientIconWrapper id="grad-family" /><path fill="url(#grad-family)" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></>),
    luxury: (<><GradientIconWrapper id="grad-luxury" /><path fill="url(#grad-luxury)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" /></>),
    deals: (<><GradientIconWrapper id="grad-deals" /><path fill="url(#grad-deals)" d="M22.83 12.99 11.83 2H2v9.83l10.99 10.99 9.84-9.83zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" /></>),
  };
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" height={size} width={size} viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: "middle", ...style }}>
      {icons[name] || <path />}
    </svg>
  );
};

// ====== 價格嚴格數值化（只允許純數字，"2泊以上" 等直接丟棄） ======
const toNumberStrict = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// --- SearchBar ---
function SearchBar({ hotels, onSelectHotel }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const searchContainerRef = useRef(null);
  const handleQueryChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (newQuery.length > 0) {
      setResults(
        hotels
          .filter((h) => h.name && h.name.toLowerCase().includes(newQuery.toLowerCase()))
          .slice(0, 5)
      );
    } else {
      setResults([]);
    }
  };
  const handleSelect = (hotelId) => {
    onSelectHotel(hotelId);
    setQuery("");
    setResults([]);
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);
  return (
    <div ref={searchContainerRef} style={{ position: "relative", padding: "16px 16px 8px 16px", background: COLORS.bg, zIndex: 100 }}>
      <div style={{ position: "relative" }}>
        <Icon name="search" size={20} style={{ position: "absolute", left: 12, top: 10, color: COLORS.textSecondary }} />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="ホテル名で検索..."
          style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "20px", border: `1px solid ${COLORS.cardBorder}`, boxSizing: "border-box", fontSize: "1rem" }}
        />
      </div>
      {results.length > 0 && (
        <ul
          style={{
            position: "absolute", top: "90%", left: 16, right: 16,
            background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: "12px",
            listStyle: "none", padding: "8px 0", margin: 0, zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {results.map((hotel) => (
            <li key={hotel.id} onClick={() => handleSelect(hotel.id)} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              {hotel.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- PromoCarousel ---
function PromoCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, [images]);
  if (!images || images.length === 0) {
    return (
      <div style={{ margin: "8px 16px 0 16px", height: "150px", borderRadius: "16px", background: "#e0e0e0", animation: "pulse 1.5s infinite ease-in-out" }}>
        <style>{`@keyframes pulse { 0% { background-color: #e0e0e0; } 50% { background-color: #f0f0f0; } 100% { background-color: #e0e0e0; } }`}</style>
      </div>
    );
  }
  return (
    <div style={{ margin: "8px 16px 0 16px", position: "relative", overflow: "hidden", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "150px", backgroundColor: COLORS.cardBorder }}>
      {images.map((imgUrl, index) => (
        <img key={index} src={imgUrl} alt={`プロモーション ${index + 1}`} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity: index === currentIndex ? 1 : 0, transition: "opacity 0.8s ease-in-out" }} />
      ))}
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
        {images.map((_, index) => (
          <div key={index} style={{ width: index === currentIndex ? 16 : 8, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.9)", boxShadow: "0 1px 2px rgba(0,0,0,0.3)", transition: "width 0.3s ease" }} />
        ))}
      </div>
    </div>
  );
}

// --- FunctionButtons ---
function FunctionButtons() {
  const buttons = [
    { label: "ブティック", icon: "boutique" },
    { label: "ファミリー", icon: "family" },
    { label: "ラグジュアリー", icon: "luxury" },
    { label: "特別セール", icon: "deals" },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", background: COLORS.card, padding: "16px 8px", borderRadius: 16, margin: "20px 0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
      {buttons.map((btn) => (
        <div key={btn.label} style={{ textAlign: "center", cursor: "pointer" }}>
          <div style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
            <Icon name={btn.icon} size={32} />
          </div>
          <span style={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>{btn.label}</span>
        </div>
      ))}
    </div>
  );
}

// --- BookingCriteriaBar ---
function BookingCriteriaBar({ startDate, setStartDate, endDate, setEndDate }) {
  const handleStartDateChange = (e) => {
    const newStartDate = new Date(e.target.value);
    setStartDate(newStartDate);
    if (newStartDate >= endDate) {
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      setEndDate(newEndDate);
    }
  };
  const getMinEndDate = () => {
    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return format(nextDay, "yyyy-MM-dd");
  };
  return (
    <div style={{ display: "flex", background: COLORS.card, borderRadius: 12, padding: "12px", margin: "0 0 16px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", alignItems: "center" }}>
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ flex: 1, paddingRight: "8px", borderRight: `1px solid ${COLORS.cardBorder}` }}>
          <label style={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>チェックイン</label>
          <input type="date" value={format(startDate, "yyyy-MM-dd")} onChange={handleStartDateChange} style={{ border: "none", fontWeight: "bold", fontSize: "0.9rem", width: "100%", backgroundColor: "transparent" }} />
        </div>
        <div style={{ flex: 1, paddingLeft: "8px" }}>
          <label style={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>チェックアウト</label>
          <input type="date" value={format(endDate, "yyyy-MM-dd")} min={getMinEndDate()} onChange={(e) => setEndDate(new Date(e.target.value))} style={{ border: "none", fontWeight: "bold", fontSize: "0.9rem", width: "100%", backgroundColor: "transparent" }} />
        </div>
      </div>
    </div>
  );
}

// --- SortAndFilterBar ---
function SortAndFilterBar({ sort, setSort, onShowFilters }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, background: COLORS.card, padding: "8px 16px", borderRadius: 12 }}>
      <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ border: "none", background: "transparent", fontWeight: "bold", fontSize: "1rem" }}>
        <option value="recommended">おすすめ順</option>
        <option value="price_asc">価格の安い順</option>
        <option value="price_desc">価格の高い順</option>
        <option value="rating_desc">評価の高い順</option>
        <option value="distance_asc">距離の近い順</option>
      </select>
      <button onClick={onShowFilters} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: 4, fontSize: "1rem" }}>
        <Icon name="sort" size={18} /> 絞り込み
      </button>
    </div>
  );
}

// --- DestinationFilter ---
function DestinationFilter({ selectedId, onSelect }) {
  return (
    <div className="destination-filter" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 16, marginBottom: 0 }}>
      {DESTINATIONS.map((dest) => (
        <button
          key={dest.id}
          onClick={() => onSelect(dest.id)}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: 20,
            background: selectedId === dest.id ? COLORS.accent : COLORS.card,
            color: selectedId === dest.id ? "white" : COLORS.text,
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
            fontWeight: selectedId === dest.id ? "bold" : "normal",
          }}
        >
          {dest.name}
        </button>
      ))}
    </div>
  );
}

// --- HotelCard ---
function HotelCard({ hotel, onSelect }) {
  return (
    <div
      onClick={() => onSelect(hotel.id)}
      style={{
        background: COLORS.card,
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 120,
          backgroundImage: `url(${hotel.cover_image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: COLORS.cardBorder,
        }}
      />
      <div style={{ padding: "8px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: "600", margin: "0 0 4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {hotel.name}
        </h3>
        <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary, margin: "2px 0" }}>
          {hotel.distance_text}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "4px 0" }}>
          <Icon name="star" size={14} style={{ color: COLORS.star }} />{" "}
          <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{hotel.rating_score}</span>{" "}
          <span style={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>({hotel.review_count}件)</span>
        </div>
        <div style={{ textAlign: "left", marginTop: "auto", paddingTop: "4px" }}>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: COLORS.accent }}>
            {Number(hotel.price_jpy || 0).toLocaleString()}円
          </span>{" "}
          <span style={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>/泊~</span>
        </div>
      </div>
    </div>
  );
}

// --- HotelList ---
function HotelList({ hotels, onSelect }) {
  if (hotels.length === 0) {
    return <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textSecondary }}>条件に合うホテルが見つかりませんでした。</div>;
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
      {hotels.map((hotel) => hotel && <HotelCard key={hotel.id} hotel={hotel} onSelect={onSelect} />)}
    </div>
  );
}

// --- MainPage ---
function MainPage({
  allHotels, displayHotels, onSelectHotel, onShowFilters, sort, setSort,
  selectedDestinationId, onDestinationChange, promoImages, startDate, setStartDate, endDate, setEndDate,
}) {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 16px 0", animation: "fadeIn 0.5s" }}>
      <SearchBar hotels={allHotels} onSelectHotel={onSelectHotel} />
      <PromoCarousel images={promoImages} />
      <div style={{ padding: "0 16px" }}>
        <FunctionButtons />
        <BookingCriteriaBar startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
        <DestinationFilter selectedId={selectedDestinationId} onSelect={onDestinationChange} />
        <SortAndFilterBar sort={sort} setSort={setSort} onShowFilters={onShowFilters} />
        <HotelList hotels={displayHotels} onSelect={onSelectHotel} />
      </div>
    </main>
  );
}

// --- Filter/Booking/Review (簡易プレースホルダー) ---
const FilterModal = ({ onClose, onApply }) => (
  <div style={{ position: "fixed", zIndex: 3000, inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "white", padding: 20, borderRadius: 8 }}>
      Filter Modal<button onClick={onApply}>Apply</button>
      <button onClick={onClose}>Close</button>
    </div>
  </div>
);
const BookingModal = ({ room, hotelName, onClose }) => (
  <div style={{ position: "fixed", zIndex: 2000, inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "white", padding: 20, borderRadius: 8 }}>
      Booking Modal for {room?.name}
      <button onClick={onClose}>Close</button>
    </div>
  </div>
);
const ReviewModal = ({ hotel, onClose }) => (
  <div style={{ position: "fixed", zIndex: 2000, inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "white", padding: 20, borderRadius: 8 }}>
      Review Modal for {hotel?.name}
      <button onClick={onClose}>Close</button>
    </div>
  </div>
);

// ===== ★★★ VR 接続モーダル：検索→接続→成功（自動で約3秒後に閉じる） ★★★
const VRConnectionModal = ({ onClose }) => {
  const [progress, setProgress] = useState(0); // 0~100
  const [step, setStep] = useState(0);         // 0: 検索, 1: 接続, 2: 成功
  const timerRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();
    const total = 3000;      // 全体 ~3s
    const successHold = 350; // 成功表示を少し見せてから閉じる
    const progressDuration = total - successHold;

    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startRef.current;
      const pct = Math.max(0, Math.min(100, Math.floor((elapsed / progressDuration) * 100)));
      setProgress(pct);
      if (pct < 40) setStep(0);
      else if (pct < 85) setStep(1);
      else setStep(2);

      if (pct >= 100) {
        clearInterval(timerRef.current);
        setTimeout(onClose, successHold);
      }
    }, 50);

    return () => timerRef.current && clearInterval(timerRef.current);
  }, [onClose]);

  const now = () => new Date().toLocaleTimeString([], { hour12: false });

  return (
    <div style={{ position: "fixed", zIndex: 10001, inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", color: "black", padding: "20px 24px", borderRadius: 12, textAlign: "left", width: "min(480px, 92vw)" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>VR接続</h3>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>デバイス: <b>PICO 3</b></div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, margin: "8px 0 6px" }}>
          <div style={{ color: "#6b7280" }}>状態</div>
          <div style={{ fontWeight: 700 }}>
            {step === 0 && "デバイス検索中…"}
            {step === 1 && "接続を確立中…"}
            {step === 2 && "接続成功 ✓"}
          </div>
        </div>

        <div style={{ width: "100%", height: 10, background: "#f3f4f6", borderRadius: 999, overflow: "hidden", border: "1px solid #e5e7eb" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg,#111,#444)", transition: "width 120ms ease-out" }} />
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "#6b7280" }}>{progress}%</div>

        <div style={{ marginTop: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", background: "#0b1020", color: "#c9e9ff", borderRadius: 8, border: "1px solid #0f1b33", padding: 10, height: 120, overflow: "auto", fontSize: 12 }}>
          <div>{now()}  Bluetooth/Wi-Fi デバイスをスキャン中…</div>
          <div>{now()}  発見: PICO 3 • RSSI -58dBm</div>
          {step >= 1 && (
            <>
              <div>{now()}  セキュアチャネル(TLS)を確立中…</div>
              <div>{now()}  ハンドシェイク完了、鍵交換 ✔</div>
              <div>{now()}  IMU / リフレッシュレートを同期中…</div>
            </>
          )}
          {step >= 2 && (
            <>
              <div>{now()}  認証済み、セッション確立 ✓</div>
              <div>{now()}  シーン読み込み中… FPS固定 60</div>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={onClose} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f3f4f6", cursor: "pointer" }}>閉じる</button>
        </div>
      </div>
    </div>
  );
};

// ===== 浮動 VR 按鈕（可保留，也可刪除） =====
const FloatingVRButton = ({ onClick }) => (
  <div
    onClick={onClick}
    style={{
      position: "fixed", bottom: "30px", right: "30px", zIndex: 10000,
      background: COLORS.gradient, width: "60px", height: "60px", borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 15px rgba(0,0,0,0.3)", cursor: "pointer", color: "white",
    }}
  >
    <Icon name="vr" size={32} />
  </div>
);

// ===== 詳情頁：內置「VR看房」小板塊（與數據庫無關） =====
function VRQuickConnectCard({ onOpen }) {
  return (
    <section style={{ background: COLORS.card, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>VR看房</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>設備：PICO 3 • 全景預覽</div>
        </div>
        <button
          onClick={onOpen}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: COLORS.gradient,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          🕶️ VRで見る
        </button>
      </div>
    </section>
  );
}

// ===== ホテル詳細ページ =====
function HotelDetailView({ hotel, onClose }) {
  const [bookingRoom, setBookingRoom] = useState(null);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isVRModalOpen, setVRModalOpen] = useState(false);

  if (!hotel) return null;

  const handleNavigation = () => {
    const lat = hotel.latitude;
    const lon = hotel.longitude;
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, "_blank");
  };

  const ImageWithFallback = ({ src, alt, style }) => (src ? <img src={src} alt={alt} style={style} /> : <div style={{ ...style, backgroundColor: COLORS.cardBorder }} />);

  const ImageGallery = () => (
    <div style={{ display: "flex", gap: "8px", height: "250px", padding: "16px" }}>
      <div style={{ flex: 2, height: "100%" }}>
        <ImageWithFallback src={hotel.poster_image_url} alt={`${hotel.name} メインビュー`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", height: "100%" }}>
        <ImageWithFallback src={hotel.detail_image_1} alt={`${hotel.name} 詳細ビュー1`} style={{ width: "100%", height: "50%", objectFit: "cover", borderRadius: "12px" }} />
        <ImageWithFallback src={hotel.detail_image_2} alt={`${hotel.name} 詳細ビュー2`} style={{ width: "100%", height: "50%", objectFit: "cover", borderRadius: "12px" }} />
      </div>
    </div>
  );

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", animation: "slideInUp 0.3s" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", padding: "12px", borderBottom: `1px solid ${COLORS.cardBorder}` }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Icon name="back" size={24} />
        </button>
        <h2 style={{ margin: "0 auto", transform: "translateX(-12px)", fontSize: "1.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 10px" }}>
          {hotel.name}
        </h2>
      </header>

      <ImageGallery />

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
        {/* 酒店信息卡 */}
        <div style={{ background: COLORS.card, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
          <div style={{ flex: 1, paddingRight: "16px", overflow: "hidden" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{hotel.name}</h3>
            <p style={{ margin: "0", color: COLORS.textSecondary, fontSize: "0.9rem" }}>{hotel.address}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flexShrink: 0 }} onClick={handleNavigation}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: COLORS.softAccent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="navigation" size={24} style={{ color: COLORS.accent }} />
            </div>
            <span style={{ marginTop: "4px", fontSize: "0.8rem", color: COLORS.accent }}>ナビ</span>
          </div>
        </div>

        {/* ★ 詳情頁內置的 VR 小板塊（與數據庫無關） ★ */}
        <VRQuickConnectCard onOpen={() => setVRModalOpen(true)} />
      </div>

      <div style={{ padding: "0 16px 80px 16px" }}>
        <p>客室選択、施設詳細、アメニティ情報...</p>
      </div>

      {/* 浮動 VR 按鈕（可選） */}
      <FloatingVRButton onClick={() => setVRModalOpen(true)} />

      {bookingRoom && <BookingModal room={bookingRoom} hotelName={hotel.name} onClose={() => setBookingRoom(null)} />}
      {isReviewModalOpen && <ReviewModal hotel={hotel} onClose={() => setReviewModalOpen(false)} />}
      {isVRModalOpen && <VRConnectionModal onClose={() => setVRModalOpen(false)} />}

      <style>{`@keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

// =======================================================================
// ===== 3. メインアプリケーション (Main Application) =====
// =======================================================================

function HotelBookingPage() {
  const [allHotels, setAllHotels] = useState([]);
  const [displayHotels, setDisplayHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [promoImages, setPromoImages] = useState([]);
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); return tomorrow;
  });
  const [guestCount, setGuestCount] = useState(2);
  const [filters, setFilters] = useState({ price: { min: 0, max: 100000 }, stars: new Set(), amenities: new Set(), minRating: 0 });
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 100000 });
  const [availableAmenities, setAvailableAmenities] = useState([]);

  const processSheetData = (values) => {
    if (!values || values.length < 2) return [];
    const headers = values[0];
    const data = values.slice(1);
    return data.map((row) => {
      const rowData = {};
      headers.forEach((header, index) => { rowData[header] = row[index]; });
      return rowData;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!API_KEY || API_KEY.includes("YOUR")) {
        setError("エラー: コードに有効なGoogle APIキーを設定してください。");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      const hotelSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:AH?key=${API_KEY}`;
      const promoSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet2!A:A?key=${API_KEY}`;

      try {
        const [hotelRes, promoRes] = await Promise.all([fetch(hotelSheetUrl), fetch(promoSheetUrl)]);
        if (!hotelRes.ok) throw new Error(`ホテルデータの取得に失敗しました (Status: ${hotelRes.status})`);

        const hotelData = await hotelRes.json();
        const hotelJson = processSheetData(hotelData.values);

        if (promoRes.ok) {
          const promoData = await promoRes.json();
          setPromoImages(promoData.values.slice(1).flat().filter(Boolean));
        } else {
          console.warn(`プロモーション画像の取得に失敗しました (Status: ${promoRes.status})`);
        }

        let minPrice = Infinity, maxPrice = 0;
        const allAmenities = new Set();

        // 價格來源：只看「價格1/价格1」。房型價格用「價格i/价格i」，無則回退價格1
        const price1Of = (obj) => toNumberStrict(obj["價格1"] ?? obj["价格1"]);
        const roomPriceOf = (obj, i) => toNumberStrict(obj[`價格${i}`] ?? obj[`价格${i}`]);

        const formattedData = hotelJson
          .map((h, index) => {
            const price1 = price1Of(h) ?? 0;
            const distance = parseFloat(h["距離(KM)"]);

            if (price1 > 0) {
              if (price1 < minPrice) minPrice = price1;
              if (price1 > maxPrice) maxPrice = price1;
            }

            const amenities = h.設施列表 ? h.設施列表.split(";").map((i) => i.trim()).filter(Boolean) : [];
            amenities.forEach((a) => allAmenities.add(a));

            const rooms = [];
            for (let i = 1; i <= 3; i++) {
              if (h[`房型${i}`]) {
                const rp = roomPriceOf(h, i) ?? price1;
                rooms.push({
                  name: h[`房型${i}`],
                  maxOccupancy: parseInt(h[`最大入住人數${i}`], 10) || 2,
                  price: rp,
                  remaining: parseInt(h[`剩餘房間數${i}`], 10) || 0,
                });
              }
            }

            return {
              id: parseInt(h.ID, 10) || index,
              destinationId: parseInt(h.目的地ID, 10),
              name: h.酒店標題,
              star_rating: parseInt(h.星級, 10) || 3,
              rating_score: parseFloat(h.評分) || 7.0,
              review_count: parseInt(h.評論數, 10) || 0,
              address: h.詳細地址,
              distance: isNaN(distance) ? Infinity : distance,
              distance_text: h["距離(KM)"] ? `${h["距離(KM)"]}km from center` : "N/A",
              latitude: parseFloat(h.地圖緯度),
              longitude: parseFloat(h.地圖經度),
              description: h.詳細介紹 || "<p>詳細情報はありません。</p>",
              cover_image_url: h.封面圖,
              poster_image_url: h.詳情圖集1,
              detail_image_1: h.詳情圖集2,
              detail_image_2: h.詳情圖集3,
              amenities,
              price_jpy: price1, // ★ 唯一價格來源
              rooms,
            };
          })
          .filter((h) => h.name);

        setAllHotels(formattedData);
        const priceRange = {
          min: isFinite(minPrice) ? Math.floor(minPrice / 1000) * 1000 : 0,
          max: isFinite(maxPrice) ? Math.ceil(maxPrice / 1000) * 1000 : 0,
        };
        setPriceBounds(priceRange);
        setFilters((prev) => ({ ...prev, price: priceRange }));
        setAvailableAmenities(Array.from(allAmenities));
      } catch (err) {
        setError(`データ読み込みエラー: ${err.message}. APIキーとスプレッドシートIDが正しいか、シートが一般公開されているか確認してください。`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 検索・フィルタ・ソート
  useEffect(() => {
    let result = [...allHotels];
    if (selectedDestinationId !== 0) {
      result = result.filter((h) => h.destinationId === selectedDestinationId);
    }
    result = result.filter(
      (h) =>
        h.price_jpy >= filters.price.min &&
        h.price_jpy <= filters.price.max &&
        (filters.stars.size === 0 || filters.stars.has(h.star_rating)) &&
        (filters.minRating === 0 || h.rating_score >= filters.minRating) &&
        (filters.amenities.size === 0 || [...filters.amenities].every((a) => h.amenities.includes(a))) &&
        h.rooms && h.rooms.length > 0 &&
        h.rooms.some((room) => room.maxOccupancy >= guestCount)
    );
    switch (sort) {
      case "price_asc":  result.sort((a, b) => a.price_jpy - b.price_jpy); break;
      case "price_desc": result.sort((a, b) => b.price_jpy - a.price_jpy); break;
      case "rating_desc": result.sort((a, b) => b.rating_score - a.rating_score); break;
      case "distance_asc": result.sort((a, b) => a.distance - b.distance); break;
      default:
        result.sort((a, b) => b.rating_score * Math.log10(b.review_count + 2) - a.rating_score * Math.log10(a.review_count + 2));
        break;
    }
    setDisplayHotels(result);
  }, [allHotels, selectedDestinationId, filters, sort, guestCount]);

  const selectedHotel = useMemo(() => allHotels.find((h) => h.id === selectedHotelId), [selectedHotelId, allHotels]);

  if (isLoading) return (<div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>読み込み中...</div>);
  if (error) return (<div style={{ padding: 40, textAlign: "center", color: "red" }}><b>エラー:</b> {error}</div>);

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', minHeight: "100vh" }}>
      <style>{`.destination-filter::-webkit-scrollbar { display: none; } .destination-filter { scrollbar-width: none; }`}</style>
      <div style={{ display: selectedHotel ? "none" : "block" }}>
        <MainPage
          {...{
            allHotels, displayHotels, onSelectHotel: setSelectedHotelId, onShowFilters: () => setShowFilters(true),
            sort, setSort, selectedDestinationId, onDestinationChange: setSelectedDestinationId,
            promoImages, startDate, setStartDate, endDate, setEndDate,
          }}
        />
      </div>
      {selectedHotel && <HotelDetailView hotel={selectedHotel} onClose={() => setSelectedHotelId(null)} />}
      {showFilters && (
        <FilterModal
          {...{
            onClose: () => setShowFilters(false),
            onApply: () => setShowFilters(false),
            filters, setFilters, priceBounds, availableAmenities, guestCount, onGuestChange: setGuestCount,
          }}
        />
      )}
    </div>
  );
}

export default HotelBookingPage;
