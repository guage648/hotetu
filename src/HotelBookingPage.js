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
const SPREADSHEET_ID = "1-JYNZYNZ9XSx2wAfBSOoKQHvAkilmGM3YYwjWIDvUb9mzw";

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
    close: (
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    ),
    sort: <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />,
    search: (
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    ),
    navigation: <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />,
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

// ... 他のコンポーネントは変更ありません (SearchBar, PromoCarousel, etc.) ...
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
        <style>{`@keyframes pulse { 0% { background-color: #e0e0e0; } 50% { background-color: #f0f0f0; } 100% { background-color: #e0e0e0; } }`}</style>
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
        <Icon name="sort" size={18} /> 絞り込み
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

const FilterModal = ({ onClose, onApply }) => {
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 3000,
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ background: "white", padding: 20, borderRadius: 8 }}>
        Filter Modal<button onClick={onApply}>Apply</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
const BookingModal = ({ room, hotelName, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 2000,
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ background: "white", padding: 20, borderRadius: 8 }}>
        Booking Modal for {room.name}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
const ReviewModal = ({ hotel, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 2000,
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ background: "white", padding: 20, borderRadius: 8 }}>
        Review Modal for {hotel.name}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
const VRConnectionModal = ({ onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 10001,
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          color: "black",
          padding: "20px 40px",
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <h3>VR接続</h3>
        <p>VRヘッドセットを接続してください...</p>
        <button
          onClick={onClose}
          style={{ marginTop: 10, padding: "8px 16px" }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
};

// ===== フローティングVRボタン =====
// このコンポーネントが右下に表示されるVRボタンです。
const FloatingVRButton = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        zIndex: 10000,
        background: COLORS.gradient,
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        cursor: "pointer",
        color: "white",
      }}
    >
      <Icon name="vr" size={32} />
    </div>
  );
};

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

  const ImageWithFallback = ({ src, alt, style }) =>
    src ? (
      <img src={src} alt={alt} style={style} />
    ) : (
      <div style={{ ...style, backgroundColor: COLORS.cardBorder }} />
    );

  const ImageGallery = () => (
    <div
      style={{ display: "flex", gap: "8px", height: "250px", padding: "16px" }}
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

      {/* ...コンテンツ部分は変更なし... */}
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
          <div style={{ flex: 1, paddingRight: "16px", overflow: "hidden" }}>
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
              style={{
                marginTop: "4px",
                fontSize: "0.8rem",
                color: COLORS.accent,
              }}
            >
              ナビ
            </span>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 16px 80px 16px" }}>
        <p>客室選択、施設詳細、アメニティ情報...</p>
      </div>

      {/* ===== ★★★ VRボタンの表示 ★★★ ===== */}
      {/* この行で、詳細ページにフローティングボタンを描画しています。コードを正しく全体コピーすれば表示されるはずです。 */}
      <FloatingVRButton onClick={() => setVRModalOpen(true)} />

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

      <style>{`@keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
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
          setPromoImages(promoData.values.slice(1).flat().filter(Boolean));
        } else {
          console.warn(
            `プロモーション画像の取得に失敗しました (Status: ${promoRes.status})`
          );
        }

        let minPrice = Infinity,
          maxPrice = 0;
        const allAmenities = new Set();

        const formattedData = hotelJson
          .map((h, index) => {
            // ===== ★★★ 価格のマッピング修正 ★★★ =====
            // ホテルリストの表示価格を「基礎價格(JPY)」列から取得するように修正しました。
            const priceJpy = parseFloat(h["基礎價格(JPY)"]) || 0;
            const distance = parseFloat(h["距離(KM)"]);

            if (priceJpy > 0) {
              if (priceJpy < minPrice) minPrice = priceJpy;
              if (priceJpy > maxPrice) maxPrice = priceJpy;
            }

            const amenities = h.設施列表
              ? h.設施列表
                  .split(";")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [];
            amenities.forEach((a) => allAmenities.add(a));

            const rooms = [];
            for (let i = 1; i <= 3; i++) {
              if (h[`房型${i}`]) {
                rooms.push({
                  name: h[`房型${i}`],
                  maxOccupancy: parseInt(h[`最大入住人數${i}`], 10) || 2,
                  price: parseInt(h[`價格${i}`], 10) || priceJpy, // 客室価格がない場合は基礎価格を使用
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
              distance_text: h["距離(KM)"]
                ? `${h["距離(KM)"]}km from center`
                : "N/A",
              latitude: parseFloat(h.地圖緯度),
              longitude: parseFloat(h.地圖經度),
              description: h.詳細介紹 || "<p>詳細情報はありません。</p>",
              cover_image_url: h.封面圖,
              poster_image_url: h.詳情圖集1,
              detail_image_1: h.詳情圖集2,
              detail_image_2: h.詳情圖集3,
              amenities: amenities,
              price_jpy: priceJpy, // ここが修正された価格
              rooms: rooms,
            };
          })
          .filter((h) => h.name);

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

  // ...残りのコードは変更ありません...
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
            b.rating_score * Math.log10(b.review_count + 2) -
            a.rating_score * Math.log10(a.review_count + 2)
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
          {...{
            allHotels,
            displayHotels,
            onSelectHotel: setSelectedHotelId,
            onShowFilters: () => setShowFilters(true),
            sort,
            setSort,
            selectedDestinationId,
            onDestinationChange: setSelectedDestinationId,
            promoImages,
            startDate,
            setStartDate,
            endDate,
            setEndDate,
          }}
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
          {...{
            onClose: () => setShowFilters(false),
            onApply: () => setShowFilters(false),
            filters,
            setFilters,
            priceBounds,
            availableAmenities,
            guestCount,
            onGuestChange: setGuestCount,
          }}
        />
      )}
    </div>
  );
}

export default HotelBookingApp;
