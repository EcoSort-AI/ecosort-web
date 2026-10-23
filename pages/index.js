/* eslint-disable no-unused-vars */
import useSWR from "swr";
import { useState, useMemo, useEffect, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { translateMaterial } from "@/lib/dictionary";

import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import {
  MapPin,
  Trash2,
  Wine,
  CupSoda,
  FileText,
  Package,
  Cpu,
  Leaf,
  Sparkles,
} from "lucide-react";

const fetcher = (url) => fetch(url).then((response) => response.json());

const MATERIAL_SCAN_STYLES = {
  glass: { bg: "#65a30d", icon: Wine, label: "VIDRO" },
  "white-glass": { bg: "#65a30d", icon: Wine, label: "VIDRO BRANCO" },
  "green-glass": { bg: "#16a34a", icon: Wine, label: "VIDRO VERDE" },
  "brown-glass": { bg: "#854d0e", icon: Wine, label: "VIDRO MARROM" },
  plastic: { bg: "#dc2626", icon: CupSoda, label: "PLÁSTICO" },
  paper: { bg: "#2563eb", icon: FileText, label: "PAPEL" },
  cardboard: { bg: "#9a3412", icon: Package, label: "PAPELÃO" },
  metal: { bg: "#ca8a04", icon: Cpu, label: "METAL" },
  biological: { bg: "#15803d", icon: Leaf, label: "ORGÂNICO" },
  organic: { bg: "#15803d", icon: Leaf, label: "ORGÂNICO" },
  trash: { bg: "#4b5563", icon: Trash2, label: "OUTROS RESÍDUOS" },
};

function getScanStyle(rawClass) {
  const key = (rawClass || "").toLowerCase();
  if (MATERIAL_SCAN_STYLES[key]) return MATERIAL_SCAN_STYLES[key];
  if (key.includes("glass") || key.includes("vidro"))
    return MATERIAL_SCAN_STYLES.glass;
  if (key.includes("plastic") || key.includes("plastico"))
    return MATERIAL_SCAN_STYLES.plastic;
  if (key.includes("cardboard") || key.includes("papelao"))
    return MATERIAL_SCAN_STYLES.cardboard;
  if (key.includes("paper") || key.includes("papel"))
    return MATERIAL_SCAN_STYLES.paper;
  if (key.includes("metal") || key.includes("lata"))
    return MATERIAL_SCAN_STYLES.metal;
  return {
    bg: "#16a34a",
    icon: Sparkles,
    label: translateMaterial(rawClass).toUpperCase(),
  };
}

function RollingDigit({ char }) {
  const isNumber = /[0-9]/.test(char);

  if (!isNumber) {
    return (
      <span className="inline-block px-0.5 text-white select-none">{char}</span>
    );
  }

  return (
    <span
      className="relative inline-flex justify-center overflow-hidden"
      style={{ height: "1.15em", minWidth: "0.62em" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: "100%", opacity: 0, color: "#4ade80" }}
          animate={{ y: "0%", opacity: 1, color: "#ffffff" }}
          exit={{ y: "-100%", opacity: 0, color: "#16a34a" }}
          transition={{
            y: { type: "spring", stiffness: 260, damping: 24 },
            opacity: { duration: 0.2 },
            color: { duration: 0.8 },
          }}
          className="inline-block select-none"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Map Configuration
const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "16px",
};

const center = {
  lat: -23.6377,
  lng: -46.577,
};

const activeBins = [
  {
    id: "smart_bin_01",
    location: { lat: -23.6477, lng: -46.5742 },
    status: "Disponível",
    local: "Instituto Mauá de Tecnologia",
  },
  {
    id: "smart_bin_02",
    location: { lat: -23.626, lng: -46.5802 },
    status: "Disponível",
    local: "ParkShopping São Caetano",
  },
];

const CHART_COLORS = [
  "#e74c3c",
  "#f39c12",
  "#84cc16",
  "#1abc9c",
  "#2980b9",
  "#8b5cf6",
  "#ec4899",
];

export default function Home({ isLoggedIn }) {
  const [selectedBin, setSelectedBin] = useState(null);

  const [displayCount, setDisplayCount] = useState(null);
  const [activeScanBanner, setActiveScanBanner] = useState(null);
  const prevCountRef = useRef(null);

  const { data: countData, error: countError } = useSWR(
    "/api/v1/trash-events/count",
    fetcher,
    { refreshInterval: 2000 },
  );

  const { data: metricsData } = useSWR("/api/v1/metrics", fetcher, {
    refreshInterval: 5000,
  });

  const apiTotal =
    countData?.total !== undefined
      ? Number(countData.total)
      : metricsData?.total !== undefined
        ? Number(metricsData.total)
        : null;

  useEffect(() => {
    if (apiTotal === null) return;

    if (prevCountRef.current === null) {
      prevCountRef.current = apiTotal;
      setDisplayCount(apiTotal);
      return;
    }

    if (apiTotal > prevCountRef.current) {
      const detectedClass = countData?.latestEvent?.item_class || "plastic";
      triggerClassificationAnimation(apiTotal, detectedClass);
      prevCountRef.current = apiTotal;
    } else if (apiTotal !== prevCountRef.current) {
      prevCountRef.current = apiTotal;
      setDisplayCount(apiTotal);
    }
  }, [apiTotal, countData]);

  const triggerClassificationAnimation = (newCountValue, itemClass) => {
    setDisplayCount(newCountValue);

    const styleInfo = getScanStyle(itemClass);
    setTimeout(() => {
      setActiveScanBanner(styleInfo);
    }, 350);

    setTimeout(() => {
      setActiveScanBanner(null);
    }, 1850);
  };

  const formattedDigits = useMemo(() => {
    if (displayCount === null) return [];
    return Number(displayCount).toLocaleString("pt-BR").split("");
  }, [displayCount]);

  const totalItemsForChart = metricsData ? metricsData.total : 0;

  const chartData = useMemo(() => {
    if (!metricsData || !metricsData.distribution) return [];

    const groupedData = {};

    metricsData.distribution.forEach((item) => {
      let baseClass = item.item_class?.toLowerCase() || "desconhecido";

      if (baseClass.includes("glass") || baseClass.includes("vidro")) {
        baseClass = "glass";
      } else if (
        baseClass.includes("plastic") ||
        baseClass.includes("plastico")
      ) {
        baseClass = "plastic";
      } else if (baseClass.includes("paper") || baseClass.includes("papel")) {
        if (
          baseClass.includes("cardboard") ||
          baseClass.includes("papelão") ||
          baseClass.includes("papelao")
        ) {
          baseClass = "cardboard";
        } else {
          baseClass = "paper";
        }
      } else if (baseClass.includes("metal") || baseClass.includes("lata")) {
        baseClass = "metal";
      }

      groupedData[baseClass] = (groupedData[baseClass] || 0) + item.count;
    });

    const sortedGroups = Object.entries(groupedData)
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);

    return sortedGroups.map((item, index) => ({
      name: translateMaterial(item.className),
      count: item.count,
      percentage:
        totalItemsForChart > 0
          ? ((item.count / totalItemsForChart) * 100).toFixed(1)
          : "0.0",
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [metricsData, totalItemsForChart]);

  const legendData = chartData;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        backgroundColor: "#242424",
        minHeight: "100vh",
        paddingBottom: "50px",
      }}
      className="relative text-white overflow-x-hidden selection:bg-[#16a34a] selection:text-white"
    >
      <Head>
        <title>EcoSort - A Lixeira Inteligente</title>
        <style>{`
          body { margin: 0; padding: 0; background-color: #242424; }
        `}</style>
      </Head>

      {/* Efeito de Luz de Fundo (Ambient Glow) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#16a34a] rounded-full mix-blend-screen filter blur-[140px] opacity-15" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#eab308] rounded-full mix-blend-screen filter blur-[160px] opacity-10" />
      </div>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
        }}
        className="relative z-10 bg-[#242424]/80 backdrop-blur-md sticky top-0 border-b border-white/5"
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/logo.png"
            alt="EcoSort AI Logo"
            width={160}
            height={50}
            priority
            style={{ objectFit: "contain" }}
          />
        </div>

        <Link
          href={isLoggedIn ? "/admin" : "/login"}
          style={{ transform: "translateY(-4px)" }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white transition-colors"
        >
          Acessar Painel
        </Link>
      </header>

      <main
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}
        className="relative z-10"
      >
        {/* Upper Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "40px",
            marginBottom: "160px",
          }}
        >
          <div style={{ flex: "1 1 500px" }}>
            <h2
              style={{
                fontSize: "3em",
                color: "#ffffff",
                margin: "0 0 20px 0",
                lineHeight: "1.2",
                fontWeight: "bold",
              }}
            >
              Lixeira inteligente com <br />
              <span style={{ color: "#16a34a" }}>separação automática.</span>
            </h2>
            <p
              style={{
                fontSize: "1.1em",
                color: "#d1d5db",
                lineHeight: "1.6",
                marginBottom: "30px",
                maxWidth: "440px",
              }}
            >
              Utilizando Inteligência Artificial e Visão Computacional para
              classificar os resíduos em tempo real.
            </p>
            <Link href="/about" style={{ textDecoration: "none" }}>
              <button
                style={{
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  border: "none",
                  padding: "15px 30px",
                  fontSize: "1em",
                  borderRadius: "30px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                className="hover:bg-[#15803d] transition-colors shadow-lg shadow-[#16a34a]/20"
              >
                Conhecer o EcoSort
              </button>
            </Link>
          </div>

          <div
            style={{
              flex: "1 1 400px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Image
              src="/Imagem1.png"
              alt="Lixeira Inteligente EcoSort"
              width={380}
              height={450}
              priority
              style={{
                width: "100%",
                maxWidth: "380px",
                height: "auto",
                display: "block",
              }}
            />
          </div>
        </motion.section>

        {/* SECÇÃO DO CONTADOR ANIMADO COM DADOS REAIS */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center justify-center mb-44"
        >
          <div className="w-full max-w-2xl flex flex-col items-center">
            {/* Pílula Principal do Contador */}
            <div className="relative w-full h-28 md:h-32 rounded-full border border-white/25 bg-[#1a1a1a]/90 shadow-2xl flex items-center justify-center px-6 overflow-hidden">
              {/* Ícone da Lixeira à Esquerda */}
              <div className="absolute left-6 md:left-8 w-12 h-12 rounded-full bg-[#16a34a] flex items-center justify-center shadow-lg shadow-[#16a34a]/30 z-10">
                <Trash2 className="w-6 h-6 text-white" />
              </div>

              {/* Número com Dígitos Rolantes (Slot Machine) */}
              <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight flex items-center justify-center z-10">
                {displayCount === null && !countError ? (
                  <span className="text-gray-400 text-3xl">...</span>
                ) : (
                  formattedDigits.map((char, index) => (
                    <RollingDigit
                      key={`pos-${formattedDigits.length - index}`}
                      char={char}
                    />
                  ))
                )}
              </div>

              {/* Flash Overlay Colorido quando uma nova classificação ocorre */}
              <AnimatePresence>
                {activeScanBanner && (
                  <motion.div
                    key="scan-overlay"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    style={{ backgroundColor: activeScanBanner.bg }}
                    className="absolute inset-0 z-20 flex items-center justify-center gap-3 px-6 rounded-full"
                  >
                    {(() => {
                      const ScanIcon = activeScanBanner.icon;
                      return (
                        <motion.div
                          initial={{ y: 12, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -12, opacity: 0 }}
                          transition={{ duration: 0.22, delay: 0.05 }}
                          className="flex items-center gap-3"
                        >
                          <ScanIcon className="w-8 h-8 md:w-9 md:h-9 text-white/90 shrink-0" />
                          <span className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wider text-white uppercase">
                            {activeScanBanner.label}
                          </span>
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Legenda Inferior */}
            <p className="mt-4 text-base md:text-lg font-bold text-gray-200 tracking-wide">
              Total de itens classificados
            </p>
          </div>
        </motion.section>

        {/* SECTION: Concentric Chart + Horizontal Bars */}
        <section
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "24px",
            padding: "50px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            marginBottom: "180px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h3
              style={{
                fontSize: "2.2em",
                color: "#ffffff",
                margin: "0 0 10px 0",
                fontWeight: "bold",
              }}
            >
              Distribuição de Resíduos
            </h3>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "1.1em" }}>
              Análise em tempo real do volume de materiais identificados pelas
              lixeiras.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "40px",
            }}
          >
            <div
              style={{
                flex: "1 1 350px",
                maxWidth: "350px",
                width: "100%",
                aspectRatio: "1 / 1",
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              {!metricsData ? (
                <div
                  style={{
                    color: "#9ca3af",
                    marginBottom: "auto",
                    marginTop: "auto",
                  }}
                >
                  Carregando gráfico...
                </div>
              ) : chartData.length > 0 ? (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {chartData.map((item, index) => {
                    const step = 100 / Math.max(chartData.length, 1);
                    const size = 100 - index * step;

                    return (
                      <div
                        key={item.name}
                        title={`${item.name}: ${item.percentage}%`}
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: `${size}%`,
                          height: `${size}%`,
                          backgroundColor: item.fill,
                          borderRadius: "50%",
                          border: "none",
                          transition: "all 0.5s ease-in-out",
                          zIndex: index,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "flex-start",
                          paddingTop: "4%",
                        }}
                      >
                        <span
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: "1.1em",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    color: "#9ca3af",
                    textAlign: "center",
                    padding: "0 20px",
                    marginBottom: "auto",
                    marginTop: "auto",
                  }}
                >
                  Nenhum resíduo classificado ainda.
                </div>
              )}
            </div>

            <div
              style={{
                flex: "1 1 400px",
                maxWidth: "500px",
                display: "flex",
                flexDirection: "column",
                gap: "28px",
              }}
            >
              {legendData.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: "1.1em",
                    }}
                  >
                    <span style={{ textTransform: "capitalize" }}>
                      {item.name}
                    </span>
                    <span>{item.percentage}%</span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "26px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "13px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${item.percentage}%`,
                        backgroundColor: item.fill,
                        borderRadius: "13px",
                        transition: "width 1s ease-in-out",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Public Map */}
        <section
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "24px",
            padding: "40px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h3
              style={{
                fontSize: "2.2em",
                color: "#ffffff",
                margin: "0 0 10px 0",
                fontWeight: "bold",
              }}
            >
              Encontre uma lixeira EcoSort perto de você
            </h3>
            <p style={{ color: "#9ca3af", margin: 0 }}>
              Nossos pontos de coleta inteligente estão disponíveis nas
              seguintes localizações.
            </p>
          </div>

          <div
            style={{
              border: "2px solid #374151",
              borderRadius: "18px",
              overflow: "hidden",
            }}
          >
            {loadError && (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#ef4444",
                }}
              >
                Erro ao carregar o mapa.
              </div>
            )}
            {!isLoaded && !loadError && (
              <div
                style={{
                  padding: "80px",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                Carregando mapa...
              </div>
            )}
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={14}
                center={center}
                onClick={() => setSelectedBin(null)}
                options={{
                  styles: [
                    {
                      elementType: "geometry",
                      stylers: [{ color: "#242f3e" }],
                    },
                    {
                      elementType: "labels.text.stroke",
                      stylers: [{ color: "#242f3e" }],
                    },
                    {
                      elementType: "labels.text.fill",
                      stylers: [{ color: "#746855" }],
                    },
                    {
                      featureType: "road",
                      elementType: "geometry",
                      stylers: [{ color: "#38414e" }],
                    },
                    {
                      featureType: "water",
                      elementType: "geometry",
                      stylers: [{ color: "#17263c" }],
                    },
                  ],
                  disableDefaultUI: true,
                  zoomControl: true,
                }}
              >
                {activeBins.map((bin) => (
                  <Marker
                    key={bin.id}
                    position={bin.location}
                    onClick={() => setSelectedBin(bin)}
                  />
                ))}

                {selectedBin && (
                  <InfoWindow
                    position={selectedBin.location}
                    onCloseClick={() => setSelectedBin(null)}
                  >
                    <div style={{ color: "#1f2937", padding: "4px" }}>
                      <h4
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "1.1em",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        {selectedBin.id}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "0.9em",
                          color: "#4b5563",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <MapPin size={14} style={{ marginRight: "5px" }} />{" "}
                        {selectedBin.local}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.95em",
                          fontWeight: "bold",
                        }}
                      >
                        Status:{" "}
                        <span
                          style={{
                            color:
                              selectedBin.status === "Disponível"
                                ? "#16a34a"
                                : "#eab308",
                          }}
                        >
                          {selectedBin.status}
                        </span>
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
  const sessionToken = context.req.cookies.session_id;
  return { props: { isLoggedIn: !!sessionToken } };
}
