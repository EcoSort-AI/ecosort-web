/* eslint-disable no-unused-vars */
import useSWR from "swr";
import { useState, useMemo } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { translateMaterial } from "@/lib/dictionary";

import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { MapPin } from "lucide-react";

const fetcher = (url) => fetch(url).then((response) => response.json());

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

  const { data: countData, error: countError } = useSWR(
    "/api/v1/trash-events/count?limit=1",
    fetcher,
    { refreshInterval: 2000 },
  );

  const { data: metricsData, error: metricsError } = useSWR(
    "/api/v1/metrics",
    fetcher,
    { refreshInterval: 5000 },
  );

  const totalItems = metricsData ? metricsData.total : 0;

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
        totalItems > 0 ? ((item.count / totalItems) * 100).toFixed(1) : "0.0",
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [metricsData, totalItems]);

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
    >
      <Head>
        <title>EcoSort - A Lixeira Inteligente</title>
        <style>{`
          body { margin: 0; padding: 0; background-color: #242424; }
        `}</style>
      </Head>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
        }}
      >
        <h1
          style={{
            color: "#16a34a",
            fontSize: "1.5em",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          EcoSort AI
        </h1>

        <Link
          href={isLoggedIn ? "/admin" : "/login"}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white transition-colors"
        >
          Acessar Painel
        </Link>
      </header>

      <main
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Upper Section */}
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "40px",
            marginBottom: "180px",
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
            >
              Conhecer o EcoSort
            </button>
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
        </section>

        {/* Card Counter */}
        <section
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "180px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              padding: "40px 60px",
              borderRadius: "24px",
              border: "1px solid #374151",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "1.1em",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: "bold",
              }}
            >
              Total de Itens Classificados
            </p>
            <p
              style={{
                margin: "15px 0 0 0",
                fontSize: "4.5em",
                fontWeight: "900",
                color: "#eab308",
                lineHeight: "1",
              }}
            >
              {!countData && !countError ? "..." : totalItems}
            </p>
          </div>
        </section>

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
              justifyContent: "space-around",
              gap: "40px",
            }}
          >
            <div
              style={{
                flex: "0 1 350px",
                height: "350px",
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
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
                    width: "350px",
                    height: "350px",
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
