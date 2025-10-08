import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
// 確保已安裝: npm install date-fns
import { format } from "date-fns";

// =======================================================================
// ===== 1. 數據與設定 (Data & Settings) =====
// =======================================================================
const GOOGLE_SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1-JYNZ9XSx2wAfBSOoKQHvAkilmGM3YYwjWIDvUb9mzw/gviz/tq?tqx=out:csv&sheet=Sheet1";

const DESTINATIONS = [
  { id: 0, name: "全部" },
  { id: 1, name: "蒼穹の門" },
  { id: 2, name: "暁風港" },
  { id: 3, name: "流星の跡" },
  { id: 4, name: "未知なる城" },
  { id: 5, name: "光の道" },
  { id: 6, name: "霞光ステーション" },
];

// =======================================================================
// ===== 2. 辅助工具与组件 (Helpers & Components) =====
// =======================================================================

// --- 樣式與圖標 (Styles & Icons) ---
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
    navigate: <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />,
    sort: <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
    search: (
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    ),
    person: (
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
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

// --- 子组件定义 ---

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
          .slice(0, 5) // 最多显示5个结果
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

  // 点击外部区域关闭搜索结果
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
          placeholder="搜索酒店名称..."
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

  if (!images || images.length === 0) return null;

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
          alt={`Promotion ${index + 1}`}
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
    { label: "精品酒店", icon: "boutique" },
    { label: "亲子家庭", icon: "family" },
    { label: "豪华严选", icon: "luxury" },
    { label: "特价优惠", icon: "deals" },
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
        }}
      >
        <option value="recommended">综合推荐</option>
        <option value="price_asc">价格從低到高</option>
        <option value="price_desc">价格從高到低</option>
        <option value="rating_desc">评分优先</option>
        <option value="distance_asc">距离优先</option>
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
        }}
      >
        <Icon name="sort" size={18} />
        筛选
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
            ({hotel.review_count}条)
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
        找不到符合条件的酒店。
      </div>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
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
}) {
  // Data for the promotional carousel. Replace these URLs with your own images.
  const PROMOTIONAL_IMAGES = [
    "https://images.unsplash.com/photo-1542314831-068cd1dbb5eb?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925&auto=format&fit=crop",
  ];

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

      <PromoCarousel images={PROMOTIONAL_IMAGES} />

      <div style={{ padding: "0 16px" }}>
        <FunctionButtons />
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
          height: "70vh",
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
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            重置
          </button>{" "}
          <h3 style={{ margin: 0 }}>筛选</h3>{" "}
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon name="close" size={24} />
          </button>
        </header>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          <h4 style={{ margin: "0 0 12px 0" }}>评级</h4>
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
                {star}星
              </button>
            ))}
          </div>
          <h4 style={{ margin: "0 0 12px 0" }}>评分</h4>
          <div style={{ marginBottom: 24 }}>
            <label>最低 {filters.minRating.toFixed(1)} 分</label>
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
          <h4 style={{ margin: "0 0 12px 0" }}>设施服务</h4>
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
            确认
          </button>
        </footer>
      </div>
    </div>
  );
}

function BookingModal({ room, hotelName, onClose }) {
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (guestName && guestContact) {
      setStep(2); // Move to success step
    } else {
      alert("请填写所有必填信息。");
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
          <h3 style={{ margin: 0 }}>{step === 1 ? "预订信息" : "预订成功"}</h3>
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
                <strong>酒店:</strong> {hotelName}
              </p>
              <p>
                <strong>房型:</strong> {room.name}
              </p>
              <p>
                <strong>价格:</strong>{" "}
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
                  入住人姓名
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
                  联系方式 (电话/邮箱)
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
                去支付
              </button>
            </footer>
          </form>
        )}

        {step === 2 && (
          <div>
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <Icon name="check" size={48} style={{ color: "#4CAF50" }} />
              <h4 style={{ marginTop: 16 }}>支付成功!</h4>
              <p style={{ color: COLORS.textSecondary, fontSize: "0.9rem" }}>
                已为您预订 {hotelName} - {room.name}
                。预订详情已发送至您的联系方式。
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
                完成
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

function HotelDetailView({ hotel, onClose }) {
  const [bookingRoom, setBookingRoom] = useState(null);

  if (!hotel) return null;

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
          }}
        >
          {hotel.name}
        </h2>
      </header>

      <img
        src={hotel.poster_image_url || hotel.cover_image_url}
        alt={hotel.name}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          backgroundColor: COLORS.cardBorder,
        }}
      />

      <div style={{ padding: "16px" }}>
        {/* Room Selection section is now FIRST */}
        <h3 style={{ margin: "0 0 12px 0" }}>选择房型</h3>
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
                    <Icon name="person" size={14} /> 最多入住:{" "}
                    {room.maxOccupancy}人 | 剩余: {room.remaining}间
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
                    <span style={{ fontSize: "0.8rem", fontWeight: "normal" }}>
                      / 泊
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
                  }}
                >
                  {room.remaining > 0 ? "预订" : "售罄"}
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
              <p>暂无可用房型信息。</p>
            </div>
          )}
        </div>

        {/* Hotel Info/Details section is now SECOND */}
        <h3 style={{ margin: "0 0 12px 0" }}>酒店详情</h3>
        <div
          style={{
            background: COLORS.card,
            padding: "16px",
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Icon name="star" size={20} style={{ color: COLORS.star }} />
            <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
              {hotel.rating_score}
            </span>
            <span style={{ color: COLORS.textSecondary }}>
              ({hotel.review_count}条评价)
            </span>
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: hotel.description }}
            style={{ lineHeight: 1.6, color: COLORS.textSecondary }}
          />
        </div>
      </div>

      {bookingRoom && (
        <BookingModal
          room={bookingRoom}
          hotelName={hotel.name}
          onClose={() => setBookingRoom(null)}
        />
      )}

      <style>{`
        @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

// =======================================================================
// ===== 3. 主应用程式 (Main Application) =====
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
  const [filters, setFilters] = useState({
    price: { min: 0, max: 100000 },
    stars: new Set(),
    amenities: new Set(),
    minRating: 0,
  });
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 100000 });
  const [availableAmenities, setAvailableAmenities] = useState([]);

  const parseCsv = (csvText) => {
    const lines = csvText.trim().split(/\r\n|\n/);
    if (lines.length < 2) return [];
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));
    return lines
      .slice(1)
      .map((line) => {
        if (!line) return null;
        const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((v) => {
          let value = v.trim();
          if (value.startsWith('"') && value.endsWith('"'))
            value = value.slice(1, -1);
          return value.replace(/""/g, '"');
        });
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || null;
          return obj;
        }, {});
      })
      .filter(Boolean);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const hotelRes = await fetch(GOOGLE_SHEETS_CSV_URL);
        if (!hotelRes.ok) throw new Error(`数据响应错误`);

        const hotelText = await hotelRes.text();
        const hotelJson = parseCsv(hotelText);

        let minPrice = Infinity,
          maxPrice = 0;
        const allAmenities = new Set();

        const formattedData = hotelJson.map((h, index) => {
          const priceCny =
            parseFloat(h["基礎價格(CNY)"]) || 500 + Math.random() * 1500;
          const priceJpy = Math.round(priceCny * 21.05);
          if (priceJpy < minPrice) minPrice = priceJpy;
          if (priceJpy > maxPrice) maxPrice = priceJpy;

          const amenities = h.設施列表
            ? h.設施列表
                .split(";")
                .map((item) => item.trim())
                .filter(Boolean)
            : [];
          amenities.forEach((a) => allAmenities.add(a));
          const distance = parseFloat(h.距离);

          const rooms = [];
          for (let i = 1; i <= 3; i++) {
            if (h[`房型${i}`]) {
              rooms.push({
                name: h[`房型${i}`],
                maxOccupancy: parseInt(h[`最大入住人數${i}`], 10) || 2,
                price: parseInt(h[`價格${i}`], 10) || priceJpy,
                remaining: parseInt(h[`剩餘房間數${i}`], 10) || 0,
              });
            }
          }

          return {
            id: parseInt(h.ID, 10) || index,
            destinationId: parseInt(h.目的地ID, 10),
            distance: isNaN(distance) ? Infinity : distance,
            distance_text: h.距离,
            name: h.酒店標題,
            star_rating: parseInt(h.星級, 10) || 3,
            rating_score: parseFloat(h.評分) || 7.0,
            review_count: parseInt(h.評論數, 10) || 0,
            address: h.詳細地址,
            latitude: parseFloat(h.地圖緯度),
            longitude: parseFloat(h.地圖經度),
            description: h.詳細介紹 || "<p>詳細情報はありません。</p>",
            cover_image_url: h.封面圖,
            poster_image_url: h.海報圖,
            price_jpy: priceJpy,
            amenities: amenities,
            rooms: rooms,
          };
        });

        setAllHotels(formattedData);
        const priceRange = {
          min: Math.floor(minPrice / 1000) * 1000,
          max: Math.ceil(maxPrice / 1000) * 1000,
        };
        setPriceBounds(priceRange);
        setFilters((prev) => ({ ...prev, price: priceRange }));
        setAvailableAmenities(Array.from(allAmenities));
      } catch (err) {
        setError(`数据读取错误: ${err.message}`);
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
          ))
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
        break;
    }
    setDisplayHotels(result);
  }, [allHotels, selectedDestinationId, filters, sort]);

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
        正在加载...
      </div>
    );
  if (error)
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red" }}>
        <b>错误:</b> {error}
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
        />
      )}
    </div>
  );
}

export default HotelBookingApp;
