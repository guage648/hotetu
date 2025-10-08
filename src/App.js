import React, { useEffect, useMemo, useState, useRef } from "react";
// date-fnsライブラリがインストールされていることを確認してください: npm install date-fns
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// =======================================================================
// ===== 1. データと設定 (Data & Settings) =====
// =======================================================================

// ご自身のAPIキーを下の""の間に貼り付けてください
const API_KEY = "AIzaSyCekunnrHWHLV92zrz51HvI2l-LDzbyqKw";
// すべてのデータ（ホテル情報、プロモーション、詳細画像）を含むメインのシートID
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

// --- スタイルとアイコン (Styles & Icons) ---
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
          <stop
            offset="100%"
            style={{ stopColor: "#d81b60", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
    </svg>
  );
  const icons = {
    back: (
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    ),
    star: (
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    ),
    "star-outline": (
      <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
    ),
    close: (
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    ),
    sort: <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
    search: (
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    ),
    person: (
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    ),
    add: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />,
    remove: <path d="M19 13H5v-2h14v2z" />,
    edit: (
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    ),
    wifi: (
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 7.14 8.87 7.14 5 11z" />
    ),
    parking: (
      <path d="M18.58 4H5.43C4.64 4 4 4.64 4 5.42v13.15C4 19.36 4.64 20 5.43 20H18.6c.79 0 1.42-.64 1.42-1.42V5.42C20 4.64 19.37 4 18.58 4zM15 15H9v-2h4c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H9V5h6v10z" />
    ),
    pool: (
      <path d="M21.56 16.36c.45-1.03.69-2.16.69-3.36 0-3.87-3.13-7-7-7s-7 3.13-7 7c0 1.2.24 2.33.69 3.36L2 17v4h20v-4l-6.44-.64zM15.25 15c.97 0 1.75.78 1.75 1.75S16.22 18.5 15.25 18.5s-1.75-.78-1.75-1.75S14.28 15 15.25 15zM8.75 15c.97 0 1.75.78 1.75 1.75S9.72 18.5 8.75 18.5S7 17.72 7 16.75 7.78 15 8.75 15zM12 12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
    ),
    restaurant: (
      <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
    ),
    fitness: (
      <path d="M15.98 6.01v-.01L6.01 15.98v.01c-1.72 1.72-2.1 4.35-1 6.45 1.25 2.42 4.02 3.65 6.64 2.75 1.57-.54 2.87-1.84 3.41-3.41 1.09-2.62-.23-5.4-2.75-6.64l-2.31-1.1-1.02-2.28 2.28 1.02 1.1 2.31c.85.4 1.78.36 2.58-.16l.02-.01c.88-.54 1.36-1.57 1.12-2.58-.28-1.18-1.34-2.02-2.55-1.95zm-4.34 7.35 1.48-1.48c.31-.31.31-.82 0-1.13s-.82-.31-1.13 0l-1.48 1.48-2.6-2.6 1.48-1.48c.31-.31.31-.82 0-1.13s-.82-.31-1.13 0l-1.48 1.48-1.55-1.55 1.48-1.48c.31-.31.31-.82 0-1.13s-.82-.31-1.13 0L3 13.59l3.63 3.63 1.55-1.55.01-.01z" />
    ),
    hot_tub: (
      <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V7H1v10h22v-6c0-2.21-1.79-4-4-4z" />
    ),
    meeting_room: (
      <path d="M14 6h-4v3h4V6zm2-2H8C6.9 4 6 4.9 6 6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 12h-4v-2h4v2zm0-4h-4v-2h4v2z" />
    ),
    airport_shuttle: (
      <path d="M20 8.35V4c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v4.35c-1.16.81-2 2.02-2 3.42V18c0 .83.67 1.5 1.5 1.5S3 18.83 3 18v-1h18v1c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6.23c0-1.4-1-2.61-2-3.42zM6 16c-.83 0-1.5-.67-1.5-1.5S5.17 13 6 13s1.5.67 1.5 1.5S6.83 16 6 16zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5s1.5.67 1.5 1.5s-.67 1.5-1.5-1.5zM18 11H6V4h12v7z" />
    ),
    local_bar: (
      <path d="M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z" />
    ),
    navigation: (
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
    ),
    vr: (
      <path d="M20.59 6.21C19.82 5.45 18.72 5 17.5 5H10c-1.22 0-2.32.45-3.09 1.21L5.5 7.62l1.41 1.41L8.32 7.62c.4-.4 1-.62 1.68-.62h7.5c.68 0 1.28.22 1.68.62l1.41 1.41 1.41-1.41-1.41-1.41zM18 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM6 10.5c-.83 0-1.5.67-1.5 1.5S5.17 13.5 6 13.5s1.5-.67 1.5-1.5S6.83 10.5 6 10.5zM21 15.58c-1.11-1.11-2.69-1.58-4.24-1.58H7.24c-1.55 0-3.13.47-4.24 1.58L3 15.58V18h18v-2.42l-.01.01z" />
    ),
    boutique: (
      <>
        <GradientIconWrapper id="grad-boutique" />
        <path
          fill="url(#grad-boutique)"
          d="M3 21h18v-2H3v2zM5 17h14v-4H5v4zM12 2L3 6v2h18V6L12 2z"
        />
      </>
    ),
    family: (
      <>
        <GradientIconWrapper id="grad-family" />
        <path
          fill="url(#grad-family)"
          d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
        />
      </>
    ),
    luxury: (
      <>
        <GradientIconWrapper id="grad-luxury" />
        <path
          fill="url(#grad-luxury)"
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"
        />
      </>
    ),
    deals: (
      <>
        <GradientIconWrapper id="grad-deals" />
        <path
          fill="url(#grad-deals)"
          d="M22.83 12.99 11.83 2H2v9.83l10.99 10.99 9.84-9.83zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"
        />
      </>
    ),
  };
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      height={size}
      width={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ verticalAlign: "middle", ...style }}
    >
      {icons[name] || <path />}
    </svg>
  );
};

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
          .filter(
            (h) =>
              h.name && h.name.toLowerCase().includes(newQuery.toLowerCase())
          )
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
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);
  return (
    <div
      ref={searchContainerRef}
      style={{
        position: "relative",
        padding: "16px 16px 8px 16px",
        background: COLORS.bg,
        zIndex: 100,
      }}
    >
      <div style={{ position: "relative" }}>
        <Icon
          name="search"
          size={20}
          style={{
            position: "absolute",
            left: 12,
            top: 10,
            color: COLORS.textSecondary,
          }}
        />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="ホテル名で検索..."
          style={{
            width: "100%",
            padding: "10px 10px 10px 40px",
            borderRadius: "20px",
            border: `1px solid ${COLORS.cardBorder}`,
            boxSizing: "border-box",
            fontSize: "1rem",
          }}
        />
      </div>
      {results.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "90%",
            left: 16,
            right: 16,
            background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: "12px",
            listStyle: "none",
            padding: "8px 0",
            margin: 0,
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {results.map((hotel) => (
            <li
              key={hotel.id}
              onClick={() => handleSelect(hotel.id)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
              }}
            >
              {hotel.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PromoCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images]);
  if (!images || images.length === 0) {
    return (
      <div
        style={{
          margin: "8px 16px 0 16px",
          height: "150px",
          borderRadius: "16px",
          background: "#e0e0e0",
          animation: "pulse 1.5s infinite ease-in-out",
        }}
      >
        <style>{`
          @keyframes pulse {
            0% { background-color: #e0e0e0; }
            50% { background-color: #f0f0f0; }
            100% { background-color: #e0e0e0; }
          }
        `}</style>
      </div>
    );
  }
  return (
    <div
      style={{
        margin: "8px 16px 0 16px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        height: "150px",
        backgroundColor: COLORS.cardBorder,
      }}
    >
      {images.map((imgUrl, index) => (
        <img
          key={index}
          src={imgUrl}
          alt={`プロモーション ${index + 1}`}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: index === currentIndex ? 1 : 0,
            transition: "opacity 0.8s ease-in-out",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 6,
        }}
      >
        {images.map((_, index) => (
          <div
            key={index}
            style={{
              width: index === currentIndex ? 16 : 8,
              height: 8,
              borderRadius: 4,
              background: "rgba(255,255,255,0.9)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
              transition: "width 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FunctionButtons() {
  const buttons = [
    { label: "ブティック", icon: "boutique" },
    { label: "ファミリー", icon: "family" },
    { label: "ラグジュアリー", icon: "luxury" },
    { label: "特別セール", icon: "deals" },
  ];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        background: COLORS.card,
        padding: "16px 8px",
        borderRadius: 16,
        margin: "20px 0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      {buttons.map((btn) => (
        <div key={btn.label} style={{ textAlign: "center", cursor: "pointer" }}>
          <div
            style={{
              width: 52,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 6px",
            }}
          >
            <Icon name={btn.icon} size={32} />
          </div>
          <span style={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
            {btn.label}
          </span>
        </div>
      ))}
    </div>
  );
}

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
    <div
      style={{
        display: "flex",
        background: COLORS.card,
        borderRadius: 12,
        padding: "12px",
        margin: "0 0 16px 0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        alignItems: "center",
      }}
    >
      <div style={{ flex: 1, display: "flex" }}>
        <div
          style={{
            flex: 1,
            paddingRight: "8px",
            borderRight: `1px solid ${COLORS.cardBorder}`,
          }}
        >
          <label style={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
            チェックイン
          </label>
          <input
            type="date"
            value={format(startDate, "yyyy-MM-dd")}
            onChange={handleStartDateChange}
            style={{
              border: "none",
              fontWeight: "bold",
              fontSize: "0.9rem",
              width: "100%",
              backgroundColor: "transparent",
            }}
          />
        </div>
        <div style={{ flex: 1, paddingLeft: "8px" }}>
          <label style={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
            チェックアウト
          </label>
          <input
            type="date"
            value={format(endDate, "yyyy-MM-dd")}
            min={getMinEndDate()}
            onChange={(e) => setEndDate(new Date(e.target.value))}
            style={{
              border: "none",
              fontWeight: "bold",
              fontSize: "0.9rem",
              width: "100%",
              backgroundColor: "transparent",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SortAndFilterBar({ sort, setSort, onShowFilters }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        background: COLORS.card,
        padding: "8px 16px",
        borderRadius: 12,
      }}
    >
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        style={{
          border: "none",
          background: "transparent",
          fontWeight: "bold",
          fontSize: "1rem",
        }}
      >
        <option value="recommended">おすすめ順</option>
        <option value="price_asc">価格の安い順</option>
        <option value="price_desc">価格の高い順</option>
        <option value="rating_desc">評価の高い順</option>
        <option value="distance_asc">距離の近い順</option>
      </select>
      <button
        onClick={onShowFilters}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: "1rem",
        }}
      >
        <Icon name="sort" size={18} />
        絞り込み
      </button>
    </div>
  );
}

function DestinationFilter({ selectedId, onSelect }) {
  return (
    <div
      className="destination-filter"
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 16,
        marginBottom: 0,
      }}
    >
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
      <div
        style={{
          padding: "8px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3
          style={{
            fontSize: "0.9rem",
            fontWeight: "600",
            margin: "0 0 4px 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {hotel.name}
        </h3>
        <div
          style={{
            fontSize: "0.75rem",
            color: COLORS.textSecondary,
            margin: "2px 0",
          }}
        >
          {hotel.distance_text}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            margin: "4px 0",
          }}
        >
          <Icon name="star" size={14} style={{ color: COLORS.star }} />{" "}
          <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>
            {hotel.rating_score}
          </span>{" "}
          <span style={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
            ({hotel.review_count}件)
          </span>
        </div>
        <div
          style={{ textAlign: "left", marginTop: "auto", paddingTop: "4px" }}
        >
          <span
            style={{
              fontSize: "1rem",
              fontWeight: "bold",
              color: COLORS.accent,
            }}
          >
            {hotel.price_jpy.toLocaleString()}円
          </span>{" "}
          <span style={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
            /泊~
          </span>
        </div>
      </div>
    </div>
  );
}

function HotelList({ hotels, onSelect }) {
  if (hotels.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 0",
          color: COLORS.textSecondary,
        }}
      >
        条件に合うホテルが見つかりませんでした。
      </div>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
      }}
    >
      {hotels.map(
        (hotel) =>
          hotel && (
            <HotelCard key={hotel.id} hotel={hotel} onSelect={onSelect} />
          )
      )}
    </div>
  );
}

function MainPage({
  allHotels,
  displayHotels,
  onSelectHotel,
  onShowFilters,
  sort,
  setSort,
  selectedDestinationId,
  onDestinationChange,
  promoImages,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) {
  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 0 16px 0",
        animation: "fadeIn 0.5s",
      }}
    >
      <SearchBar hotels={allHotels} onSelectHotel={onSelectHotel} />
      <PromoCarousel images={promoImages} />
      <div style={{ padding: "0 16px" }}>
        <FunctionButtons />
        <BookingCriteriaBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        <DestinationFilter
          selectedId={selectedDestinationId}
          onSelect={onDestinationChange}
        />
        <SortAndFilterBar
          sort={sort}
          setSort={setSort}
          onShowFilters={onShowFilters}
        />
        <HotelList hotels={displayHotels} onSelect={onSelectHotel} />
      </div>
    </main>
  );
}

function FilterModal({
  onClose,
  onApply,
  filters,
  setFilters,
  priceBounds,
  availableAmenities,
  guestCount,
  onGuestChange,
}) {
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleToggleSet = (key, value) => {
    const newSet = new Set(filters[key]);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    handleFilterChange(key, newSet);
  };
  const resetFilters = () => {
    setFilters({
      ...filters,
      price: priceBounds,
      stars: new Set(),
      amenities: new Set(),
      minRating: 0,
    });
    onGuestChange(2);
  };
  const handleGuestChange = (amount) => {
    onGuestChange(Math.max(1, guestCount + amount));
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          width: "90%",
          maxWidth: 500,
          height: "80vh",
          background: COLORS.card,
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
        }}
      >
        <header
          style={{
            padding: "16px",
            borderBottom: `1px solid ${COLORS.cardBorder}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={resetFilters}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            リセット
          </button>{" "}
          <h3 style={{ margin: 0 }}>絞り込み</h3>{" "}
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon name="close" size={24} />
          </button>
        </header>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          <h4 style={{ margin: "0 0 12px 0" }}>宿泊人数</h4>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              marginBottom: 24,
            }}
          >
            <button
              onClick={() => handleGuestChange(-1)}
              style={{
                background: COLORS.softAccent,
                border: "none",
                width: 40,
                height: 40,
                borderRadius: "50%",
                cursor: "pointer",
                color: COLORS.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="remove" size={24} />
            </button>
            <div style={{ minWidth: "50px", textAlign: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: "1.5rem" }}>
                {guestCount}
              </span>
              <div style={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
                名
              </div>
            </div>
            <button
              onClick={() => handleGuestChange(1)}
              style={{
                background: COLORS.softAccent,
                border: "none",
                width: 40,
                height: 40,
                borderRadius: "50%",
                cursor: "pointer",
                color: COLORS.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="add" size={24} />
            </button>
          </div>
          <h4 style={{ margin: "0 0 12px 0" }}>ホテルランク</h4>
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {[5, 4, 3].map((star) => (
              <button
                key={star}
                onClick={() => handleToggleSet("stars", star)}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: `1px solid ${
                    filters.stars.has(star) ? COLORS.accent : COLORS.cardBorder
                  }`,
                  borderRadius: 8,
                  background: filters.stars.has(star)
                    ? COLORS.softAccent
                    : "white",
                  cursor: "pointer",
                }}
              >
                {star}つ星
              </button>
            ))}
          </div>
          <h4 style={{ margin: "0 0 12px 0" }}>評価</h4>
          <div style={{ marginBottom: 24 }}>
            <label>最低 {filters.minRating.toFixed(1)} 点</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={filters.minRating}
              onChange={(e) =>
                handleFilterChange("minRating", parseFloat(e.target.value))
              }
              style={{ width: "100%" }}
            />
          </div>
          <h4 style={{ margin: "0 0 12px 0" }}>設備・サービス</h4>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            {availableAmenities.map((amenity) => (
              <button
                key={amenity}
                onClick={() => handleToggleSet("amenities", amenity)}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${
                    filters.amenities.has(amenity)
                      ? COLORS.accent
                      : COLORS.cardBorder
                  }`,
                  borderRadius: 8,
                  background: filters.amenities.has(amenity)
                    ? COLORS.softAccent
                    : "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {filters.amenities.has(amenity) && (
                  <Icon name="check" size={14} />
                )}{" "}
                {amenity}
              </button>
            ))}
          </div>
        </div>
        <footer
          style={{
            padding: "16px",
            borderTop: `1px solid ${COLORS.cardBorder}`,
          }}
        >
          <button
            onClick={onApply}
            style={{
              width: "100%",
              padding: "14px",
              background: COLORS.gradient,
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            決定
          </button>
        </footer>
      </div>
    </div>
  );
}

function BookingModal({ room, hotelName, onClose }) {
  const [step, setStep] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (guestName && guestContact) {
      setStep(2);
    } else {
      alert("すべての必須項目を入力してください。");
    }
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 400,
          background: COLORS.card,
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <header
          style={{
            padding: "16px",
            borderBottom: `1px solid ${COLORS.cardBorder}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>{step === 1 ? "予約情報" : "予約完了"}</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon name="close" size={24} />
          </button>
        </header>
        {step === 1 && (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "16px" }}>
              <p>
                <strong>ホテル:</strong> {hotelName}
              </p>
              <p>
                <strong>部屋タイプ:</strong> {room.name}
              </p>
              <p>
                <strong>価格:</strong>{" "}
                <span style={{ color: COLORS.accent, fontWeight: "bold" }}>
                  {room.price.toLocaleString()}円 / 泊
                </span>
              </p>
              <div style={{ marginTop: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontSize: "0.9rem",
                  }}
                >
                  宿泊者名
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    border: `1px solid ${COLORS.cardBorder}`,
                  }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontSize: "0.9rem",
                  }}
                >
                  連絡先 (電話番号/メールアドレス)
                </label>
                <input
                  type="text"
                  value={guestContact}
                  onChange={(e) => setGuestContact(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    border: `1px solid ${COLORS.cardBorder}`,
                  }}
                />
              </div>
            </div>
            <footer
              style={{
                padding: "16px",
                borderTop: `1px solid ${COLORS.cardBorder}`,
              }}
            >
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "14px",
                  background: COLORS.gradient,
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                支払いに進む
              </button>
            </footer>
          </form>
        )}
        {step === 2 && (
          <div>
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <Icon name="check" size={48} style={{ color: "#4CAF50" }} />
              <h4 style={{ marginTop: 16 }}>お支払い完了！</h4>
              <p style={{ color: COLORS.textSecondary, fontSize: "0.9rem" }}>
                {hotelName} - {room.name}{" "}
                の予約が完了しました。予約詳細はご指定の連絡先にお送りしました。
              </p>
            </div>
            <footer
              style={{
                padding: "16px",
                borderTop: `1px solid ${COLORS.cardBorder}`,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: COLORS.gradient,
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                完了
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

const generateFakeReviews = (count, averageRating) => {
  const usernames = [
    "Kenji S.",
    "Yuki T.",
    "Haruto N.",
    "Mei A.",
    "Ren K.",
    "Anonymous",
    "Traveler2025",
    "美食家",
    "家族旅行者",
  ];
  const positiveSnippets = [
    "素晴らしい景色でした！",
    "スタッフの対応がとても丁寧で感動しました。",
    "部屋は清潔で快適に過ごせました。",
    "朝食が美味しくて、種類も豊富でした。",
    "立地が最高で、どこへ行くにも便利です。",
    "コストパフォーマンスが非常に高いと思います。",
    "また絶対に泊まりに来たいです。",
  ];
  const neutralSnippets = [
    "設備は少し古かったですが、問題なく使えました。",
    "駅から少し歩きます。",
    "一般的なビジネスホテルという感じです。",
    "可もなく不可もなく、といったところです。",
  ];
  const negativeSnippets = [
    "部屋の掃除が行き届いていない箇所がありました。",
    "隣の部屋の音が少し気になりました。",
    "期待していたほどではありませんでした。",
  ];
  const reviews = [];
  for (let i = 0; i < count; i++) {
    const rating = Math.min(
      10,
      Math.max(1, averageRating + (Math.random() - 0.4) * 2)
    );
    let comment = "";
    const commentLength = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < commentLength; j++) {
      if (rating >= 8.5) {
        comment +=
          positiveSnippets[Math.floor(Math.random() * positiveSnippets.length)] +
          " ";
      } else if (rating >= 6.5) {
        comment +=
          neutralSnippets[Math.floor(Math.random() * neutralSnippets.length)] +
          " ";
      } else {
        comment +=
          negativeSnippets[Math.floor(Math.random() * negativeSnippets.length)] +
          " ";
      }
    }
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    reviews.push({
      id: i,
      username: usernames[Math.floor(Math.random() * usernames.length)],
      rating: parseFloat(rating.toFixed(1)),
      date: date,
      comment: comment.trim(),
    });
  }
  return reviews.sort((a, b) => b.date - a.date);
};

function ReviewModal({ hotel, onClose }) {
  const reviews = useMemo(
    () => generateFakeReviews(hotel.review_count, hotel.rating_score),
    [hotel.review_count, hotel.rating_score]
  );
  const StarRating = ({ score }) => {
    const fullStars = Math.floor(score / 2);
    const emptyStars = 5 - fullStars;
    return (
      <div>
        {[...Array(fullStars)].map((_, i) => (
          <Icon key={`f-${i}`} name="star" size={16} style={{ color: COLORS.star }} />
        ))}
        {[...Array(emptyStars)].map((_, i) => (
          <Icon
            key={`e-${i}`}
            name="star-outline"
            size={16}
            style={{ color: COLORS.cardBorder }}
          />
        ))}
      </div>
    );
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
        }}
      />
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          height: "85vh",
          background: COLORS.bg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          animation: "slideInUp 0.3s",
        }}
      >
        <header
          style={{
            padding: "16px",
            borderBottom: `1px solid ${COLORS.cardBorder}`,
            textAlign: "center",
            position: "relative",
          }}
        >
          <h3 style={{ margin: 0 }}>{hotel.review_count}件のレビュー</h3>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              right: 16,
              top: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Icon name="close" size={24} />
          </button>
        </header>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                background: COLORS.card,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontWeight: "bold" }}>{review.username}</span>
                <span
                  style={{ fontSize: "0.8rem", color: COLORS.textSecondary }}
                >
                  {format(review.date, "yyyy年MM月dd日", { locale: ja })}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <StarRating score={review.rating} />
                <span style={{ fontWeight: "bold", color: COLORS.text }}>
                  {review.rating.toFixed(1)}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  lineHeight: 1.6,
                  color: COLORS.textSecondary,
                }}
              >
                {review.comment}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={() => alert("レビュー投稿機能は現在準備中です。")}
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: COLORS.gradient,
            color: "white",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="edit" size={24} />
        </button>
      </div>
    </div>
  );
}

function VRConnectionModal({ onClose }) {
  const [status, setStatus] = useState("searching"); // 'searching', 'connecting', 'success'

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStatus("connecting");
    }, 1200);

    const timer2 = setTimeout(() => {
      setStatus("success");
    }, 2400);

    const timer3 = setTimeout(() => {
      onClose();
    }, 3200); // 總時長約 3.2 秒後關閉

    // 清理計時器，防止組件卸載後繼續執行
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onClose]);

  const statusInfo = {
    searching: {
      icon: "search",
      text: "正在搜索设备 (PICO 3)...",
    },
    connecting: {
      icon: "wifi", // 模擬連接
      text: "正在连接...",
    },
    success: {
      icon: "check",
      text: "连接成功！",
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 6000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          background: COLORS.card,
          borderRadius: 16,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          width: "250px",
        }}
      >
        <Icon
          name={statusInfo[status].icon}
          size={32}
          style={{ color: status === "success" ? "#4CAF50" : COLORS.accent }}
        />
        <span style={{ fontSize: "1rem", color: COLORS.text }}>
          {statusInfo[status].text}
        </span>
      </div>
    </div>
  );
}

function HotelDetailView({ hotel, onClose }) {
  const [bookingRoom, setBookingRoom] = useState(null);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isVRModalOpen, setVRModalOpen] = useState(false);

  if (!hotel) return null;

  const handleNavigation = () => {
    const lat = hotel.latitude;
    const lon = hotel.longitude;
    const name = hotel.name;
    let url = "amapuri://route/plan/?";

    if (lat && lon) {
      url += `dlat=${lat}&dlon=${lon}&dname=${name}&dev=0&t=0`;
    } else {
      url += `dname=${name}&dev=0&t=0`;
    }
    window.location.href = url;
  };

  const amenityIconMap = {
    WiFi: "wifi",
    駐車場: "parking",
    プール: "pool",
    レストラン: "restaurant",
    フィットネス: "fitness",
    温泉: "hot_tub",
    会議室: "meeting_room",
    空港シャトル: "airport_shuttle",
    バー: "local_bar",
  };

  const ImageWithFallback = ({ src, alt, style }) => {
    return src ? (
      <img src={src} alt={alt} style={style} />
    ) : (
      <div style={{ ...style, backgroundColor: COLORS.cardBorder }} />
    );
  };

  const ImageGallery = () => (
    <div
      style={{
        display: "flex",
        gap: "8px",
        height: "250px",
        padding: "16px",
      }}
    >
      <div style={{ flex: 2, height: "100%" }}>
        <ImageWithFallback
          src={hotel.poster_image_url}
          alt={`${hotel.name} メインビュー`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "12px",
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          height: "100%",
        }}
      >
        <ImageWithFallback
          src={hotel.detail_image_1}
          alt={`${hotel.name} 詳細ビュー1`}
          style={{
            width: "100%",
            height: "50%",
            objectFit: "cover",
            borderRadius: "12px",
          }}
        />
        <ImageWithFallback
          src={hotel.detail_image_2}
          alt={`${hotel.name} 詳細ビュー2`}
          style={{
            width: "100%",
            height: "50%",
            objectFit: "cover",
            borderRadius: "12px",
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        animation: "slideInUp 0.3s",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          padding: "12px",
          borderBottom: `1px solid ${COLORS.cardBorder}`,
        }}
      >
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <Icon name="back" size={24} />
        </button>
        <h2
          style={{
            margin: "0 auto",
            transform: "translateX(-12px)",
            fontSize: "1.1rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "0 10px",
          }}
        >
          {hotel.name}
        </h2>
      </header>

      <ImageGallery />

      <div
        style={{
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            background: COLORS.card,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px",
          }}
        >
          <div
            style={{ flex: 1, paddingRight: "16px", overflow: "hidden" }}
          >
            <h3
              style={{
                margin: "0 0 4px 0",
                fontSize: "1.1rem",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {hotel.name}
            </h3>
            <p
              style={{
                margin: "0",
                color: COLORS.textSecondary,
                fontSize: "0.9rem",
              }}
            >
              {hotel.address}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onClick={handleNavigation}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: COLORS.softAccent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name="navigation"
                size={24}
                style={{ color: COLORS.accent }}
              />
            </div>
            <span
              style={{ marginTop: "4px", fontSize: "0.8rem", color: COLORS.accent }}
            >
              导航
            </span>
          </div>
        </div>

        <div
          onClick={() => setVRModalOpen(true)}
          style={{
            background: COLORS.card,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            padding: "16px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              marginRight: "16px",
              background: COLORS.softAccent,
              borderRadius: "8px",
              padding: "8px",
            }}
          >
            <Icon name="vr" size={28} style={{ color: COLORS.accent }} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: "0 0 4px 0", fontWeight: 600 }}>VR看房</h4>
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: COLORS.textSecondary,
              }}
            >
              沉浸式体验房间细节
            </p>
          </div>
          <span style={{ fontSize: "1.2rem", color: COLORS.textSecondary }}>
            &gt;
          </span>
        </div>
      </div>

      <div style={{ padding: "0 16px 16px 16px" }}>
        <h3 style={{ margin: "16px 0 12px 0" }}>部屋タイプを選択</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {hotel.rooms && hotel.rooms.length > 0 ? (
            hotel.rooms.map((room, index) => (
              <div
                key={index}
                style={{
                  background: COLORS.card,
                  padding: "16px",
                  borderRadius: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600 }}>{room.name}</h4>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: COLORS.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    <Icon name="person" size={14} /> 最大宿泊人数:{" "}
                    {room.maxOccupancy}名 | 残り: {room.remaining}部屋
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: "1rem",
                      fontWeight: "bold",
                      color: COLORS.accent,
                    }}
                  >
                    {room.price.toLocaleString()}円{" "}
                    <span
                      style={{ fontSize: "0.8rem", fontWeight: "normal" }}
                    >
                      {" "}
                      / 泊{" "}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setBookingRoom(room)}
                  disabled={room.remaining === 0}
                  style={{
                    padding: "8px 16px",
                    background: COLORS.accent,
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    opacity: room.remaining === 0 ? 0.5 : 1,
                    fontWeight: "bold",
                  }}
                >
                  {room.remaining > 0 ? "予約" : "満室"}
                </button>
              </div>
            ))
          ) : (
            <div
              style={{
                background: COLORS.card,
                padding: "16px",
                borderRadius: 12,
              }}
            >
              <p>現在利用可能な部屋タイプはありません。</p>
            </div>
          )}
        </div>
        <h3 style={{ margin: "0 0 12px 0" }}>ホテル詳細</h3>
        <div
          style={{
            background: COLORS.card,
            padding: "16px",
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="star" size={20} style={{ color: COLORS.star }} />
              <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                {" "}
                {hotel.rating_score}{" "}
              </span>
              <span style={{ color: COLORS.textSecondary }}>
                {" "}
                ({hotel.review_count}件のレビュー){" "}
              </span>
            </div>
            <button
              onClick={() => setReviewModalOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: COLORS.accent,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              すべて表示 &gt;
            </button>
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: hotel.description }}
            style={{ lineHeight: 1.6, color: COLORS.textSecondary }}
          />
        </div>
        {hotel.amenities && hotel.amenities.length > 0 && (
          <>
            <h3 style={{ margin: "0 0 12px 0" }}>設備とサービス</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: "8px",
                background: COLORS.card,
                padding: "16px",
                borderRadius: 12,
              }}
            >
              {hotel.amenities.map((amenity) => (
                <div
                  key={amenity}
                  style={{
                    textAlign: "center",
                    padding: "12px 4px",
                    background: COLORS.bg,
                    borderRadius: "8px",
                    color: COLORS.textSecondary,
                  }}
                >
                  <Icon
                    name={amenityIconMap[amenity] || "check"}
                    size={24}
                    style={{ marginBottom: "6px" }}
                  />
                  <div style={{ fontSize: "0.75rem" }}>{amenity}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {bookingRoom && (
        <BookingModal
          room={bookingRoom}
          hotelName={hotel.name}
          onClose={() => setBookingRoom(null)}
        />
      )}
      {isReviewModalOpen && (
        <ReviewModal hotel={hotel} onClose={() => setReviewModalOpen(false)} />
      )}
      {isVRModalOpen && (
        <VRConnectionModal onClose={() => setVRModalOpen(false)} />
      )}
      <style>{`
        @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

// =======================================================================
// ===== 3. メインアプリケーション (Main Application) =====
// =======================================================================

function HotelBookingApp() {
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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [guestCount, setGuestCount] = useState(2);
  const [filters, setFilters] = useState({
    price: { min: 0, max: 100000 },
    stars: new Set(),
    amenities: new Set(),
    minRating: 0,
  });
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 100000 });
  const [availableAmenities, setAvailableAmenities] = useState([]);

  const processSheetData = (values) => {
    if (!values || values.length < 2) return [];
    const headers = values[0];
    const data = values.slice(1);
    return data.map((row) => {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });
      return rowData;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!API_KEY || API_KEY.includes("ここに") || API_KEY.includes("YOUR")) {
        setError("エラー: コードに有効なGoogle APIキーを設定してください。");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      // 注意：本番環境では、データ範囲をより具体的に指定することをお勧めします（例：'Sheet1!A:AE'）
      const hotelSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:AE?key=${API_KEY}`;
      const promoSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet2!A:A?key=${API_KEY}`;

      try {
        const [hotelRes, promoRes] = await Promise.all([
          fetch(hotelSheetUrl),
          fetch(promoSheetUrl),
        ]);

        if (!hotelRes.ok)
          throw new Error(
            `ホテルデータの取得に失敗しました (Status: ${hotelRes.status})`
          );

        const hotelData = await hotelRes.json();
        const hotelJson = processSheetData(hotelData.values);

        if (promoRes.ok) {
          const promoData = await promoRes.json();
          const promoJson = processSheetData(promoData.values);
          const imageUrls = promoJson
            .map((row) => row["首頁輪播圖片url"])
            .filter(Boolean);
          setPromoImages(imageUrls);
        } else {
          console.warn(
            `プロモーション画像の取得に失敗しました (Status: ${promoRes.status})`
          );
        }

        let minPrice = Infinity,
          maxPrice = 0;
        const allAmenities = new Set();

        // ===== ▼▼▼ ここからデータマッピングロジックです ▼▼▼ =====
        const formattedData = hotelJson.map((h, index) => {
          const id = parseInt(h.ID, 10) || index;
          // 新しいデータ構造に合わせて、'價格1'を基本料金として使用します
          const priceJpy = parseInt(h["價格1"], 10) || 0;

          if (priceJpy < minPrice) minPrice = priceJpy;
          if (priceJpy > maxPrice) maxPrice = priceJpy;

          const amenities = h.設施列表
            ? h.設施列表
                .split(";")
                .map((item) => item.trim())
                .filter(Boolean)
            : [];
          amenities.forEach((a) => allAmenities.add(a));

          // 新しいデータ構造に合わせて、'距離(KM)'を使用します
          const distance = parseFloat(h["距離(KM)"]);

          const rooms = [];
          for (let i = 1; i <= 3; i++) {
            if (h[`房型${i}`]) {
              rooms.push({
                name: h[`房型${i}`],
                maxOccupancy: parseInt(h[`最大入住人數${i}`], 10) || 2,
                price: parseInt(h[`價格${i}`], 10) || 0,
                remaining: parseInt(h[`剩餘房間數${i}`], 10) || 0,
              });
            }
          }

          return {
            id: id,
            destinationId: parseInt(h.目的地ID, 10),
            name: h.酒店標題,
            type: h.酒店類型, // 新しいフィールド
            star_rating: parseInt(h.星級, 10) || 3,
            rating_score: parseFloat(h.評分) || 7.0,
            review_count: parseInt(h.評論數, 10) || 0,
            address: h.詳細地址,
            distance: isNaN(distance) ? Infinity : distance,
            distance_text: isNaN(distance)
              ? "距離不明"
              : `中心から${distance.toFixed(1)}km`,
            latitude: parseFloat(h.地圖緯度),
            longitude: parseFloat(h.地圖經度),
            description: h.詳細介紹 || "<p>詳細情報はありません。</p>",
            cover_image_url: h.封面圖,
            poster_image_url: h.詳情圖集1,
            detail_image_1: h.詳情圖集2,
            detail_image_2: h.詳情圖集3,
            price_jpy: priceJpy, // カード表示用の基本料金
            amenities: amenities,
            special_offer: h.特別優惠, // 新しいフィールド
            rooms: rooms,
          };
        });
        // ===== ▲▲▲ ここまでがデータマッピングロジックです ▲▲▲ =====

        setAllHotels(formattedData);
        const priceRange = {
          min: Math.floor(minPrice / 1000) * 1000,
          max: Math.ceil(maxPrice / 1000) * 1000,
        };
        setPriceBounds(priceRange);
        setFilters((prev) => ({ ...prev, price: priceRange }));
        setAvailableAmenities(Array.from(allAmenities));
      } catch (err) {
        setError(
          `データ読み込みエラー: ${err.message}. APIキーとスプレッドシートIDが正しいか、シートが一般公開されているか確認してください。`
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
        (filters.amenities.size === 0 ||
          [...filters.amenities].every((amenity) =>
            h.amenities.includes(amenity)
          )) &&
        h.rooms &&
        h.rooms.length > 0 &&
        h.rooms.some((room) => room.maxOccupancy >= guestCount)
    );
    switch (sort) {
      case "price_asc":
        result.sort((a, b) => a.price_jpy - b.price_jpy);
        break;
      case "price_desc":
        result.sort((a, b) => b.price_jpy - a.price_jpy);
        break;
      case "rating_desc":
        result.sort((a, b) => b.rating_score - a.rating_score);
        break;
      case "distance_asc":
        result.sort((a, b) => a.distance - b.distance);
        break;
      default:
        result.sort(
          (a, b) =>
            b.rating_score * Math.log10(b.review_count + 1) -
            a.rating_score * Math.log10(a.review_count + 1)
        );
        break;
    }
    setDisplayHotels(result);
  }, [allHotels, selectedDestinationId, filters, sort, guestCount]);

  const selectedHotel = useMemo(
    () => allHotels.find((h) => h.id === selectedHotelId),
    [selectedHotelId, allHotels]
  );
  if (isLoading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        読み込み中...
      </div>
    );
  if (error)
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red" }}>
        <b>エラー:</b> {error}
      </div>
    );

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: "100vh",
      }}
    >
      <style>{`.destination-filter::-webkit-scrollbar { display: none; } .destination-filter { scrollbar-width: none; }`}</style>
      <div style={{ display: selectedHotel ? "none" : "block" }}>
        <MainPage
          allHotels={allHotels}
          displayHotels={displayHotels}
          onSelectHotel={setSelectedHotelId}
          onShowFilters={() => setShowFilters(true)}
          sort={sort}
          setSort={setSort}
          selectedDestinationId={selectedDestinationId}
          onDestinationChange={setSelectedDestinationId}
          promoImages={promoImages}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      </div>
      {selectedHotel && (
        <HotelDetailView
          hotel={selectedHotel}
          onClose={() => setSelectedHotelId(null)}
        />
      )}
      {showFilters && (
        <FilterModal
          onClose={() => setShowFilters(false)}
          onApply={() => setShowFilters(false)}
          filters={filters}
          setFilters={setFilters}
          priceBounds={priceBounds}
          availableAmenities={availableAmenities}
          guestCount={guestCount}
          onGuestChange={setGuestCount}
        />
      )}
    </div>
  );
}

export default HotelBookingApp;
