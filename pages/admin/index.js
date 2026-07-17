/* eslint-disable no-unused-vars */
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import useSWR from "swr";
import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  BarChart3,
  Target,
  Trash2,
  MapPin,
  Clock,
} from "lucide-react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

const fetcher = (url) => fetch(url).then((res) => res.json());

// Google map configuration
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: -23.6377,
  lng: -46.577,
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#1f1f1f" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1f1f1f" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#374151" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b7280" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#111827" }],
    },
  ],
};

export default function AdminDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMapBin, setSelectedMapBin] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: apiData, error } = useSWR("/api/v1/trash-events", fetcher, {
    refreshInterval: 5000,
  });

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const dashboardData = useMemo(() => {
    if (!apiData) return null;

    const rawData = Array.isArray(apiData) ? apiData : apiData.events || [];

    if (rawData.length === 0) {
      return {
        kpis: {
          totalDetections: 0,
          averageConfidence: "0.0",
          mostActiveBin: "Nenhuma",
          topCategory: "Nenhum",
        },
        volumeOverTime: [],
        categories: [],
        recentDetections: [],
        activeBins: [
          {
            id: "smart_bin_01",
            location: { lat: -23.6477, lng: -46.5742 },
            local: "Instituto Mauá de Tecnologia",
            totalDetections: 0,
            avgConfidence: "0.0",
            topCategory: "Nenhum",
          },
          {
            id: "smart_bin_02",
            location: { lat: -23.628, lng: -46.5802 },
            local: "ParkShopping São Caetano",
            totalDetections: 0,
            avgConfidence: "0.0",
            topCategory: "Nenhum",
          },
        ],
      };
    }

    const totalDetections = rawData.length;
    let totalConfidence = 0;
    const binCounts = {};
    const categoryCounts = {};
    const dateCounts = {};
    const binDetailedMetrics = {};

    rawData.forEach((item) => {
      totalConfidence += item.confidence;
      binCounts[item.bin_id] = (binCounts[item.bin_id] || 0) + 1;
      categoryCounts[item.item_class] =
        (categoryCounts[item.item_class] || 0) + 1;

      const formattedDate = new Date(item.detected_at).toLocaleDateString(
        "en-US",
        { day: "2-digit", month: "2-digit" },
      );
      dateCounts[formattedDate] = (dateCounts[formattedDate] || 0) + 1;

      if (!binDetailedMetrics[item.bin_id]) {
        binDetailedMetrics[item.bin_id] = {
          total: 0,
          confidenceSum: 0,
          categories: {},
        };
      }
      binDetailedMetrics[item.bin_id].total++;
      binDetailedMetrics[item.bin_id].confidenceSum += item.confidence;
      binDetailedMetrics[item.bin_id].categories[item.item_class] =
        (binDetailedMetrics[item.bin_id].categories[item.item_class] || 0) + 1;
    });

    const activeBinsWithMetrics = [
      {
        id: "smart_bin_01",
        location: { lat: -23.6477, lng: -46.5742 },
        local: "Instituto Mauá de Tecnologia",
      },
      {
        id: "smart_bin_02",
        location: { lat: -23.628, lng: -46.5802 },
        local: "ParkShopping São Caetano",
      },
    ].map((bin) => {
      const metrics = binDetailedMetrics[bin.id] || {
        total: 0,
        confidenceSum: 0,
        categories: {},
      };
      const avgConf =
        metrics.total > 0
          ? ((metrics.confidenceSum / metrics.total) * 100).toFixed(1)
          : "0.0";
      const topCat =
        Object.keys(metrics.categories).length > 0
          ? Object.keys(metrics.categories).reduce((a, b) =>
              metrics.categories[a] > metrics.categories[b] ? a : b,
            )
          : "Nenhum";
      return {
        ...bin,
        totalDetections: metrics.total,
        avgConfidence: avgConf,
        topCategory: topCat,
      };
    });

    return {
      kpis: {
        totalDetections,
        averageConfidence: ((totalConfidence / totalDetections) * 100).toFixed(
          1,
        ),
        mostActiveBin: Object.keys(binCounts).reduce((a, b) =>
          binCounts[a] > binCounts[b] ? a : b,
        ),
        topCategory: Object.keys(categoryCounts).reduce((a, b) =>
          categoryCounts[a] > categoryCounts[b] ? a : b,
        ),
      },
      volumeOverTime: Object.keys(dateCounts)
        .map((k) => ({ date: k, detections: dateCounts[k] }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      categories: Object.keys(categoryCounts)
        .map((k) => ({ category: k, count: categoryCounts[k] }))
        .sort((a, b) => b.count - a.count),
      recentDetections: [...rawData]
        .sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at))
        .slice(0, 5),
      activeBins: activeBinsWithMetrics,
    };
  }, [apiData]);

  if (!isMounted) return null;

  if (error)
    return (
      <div className="p-8 text-[#ef4444] min-h-screen bg-[#242424]">
        Erro ao carregar dados da API. Verifique a conexão com o banco de dados.
      </div>
    );

  if (!dashboardData)
    return (
      <div className="p-8 text-gray-400 min-h-screen bg-[#242424]">
        Carregando telemetria em tempo real...
      </div>
    );

  return (
    <div
      style={{ fontFamily: "sans-serif" }}
      className="min-h-screen bg-[#242424] p-8 text-white"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-[#16a34a]">
          Monitoramento EcoSort
        </h2>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        {[
          {
            title: "Total de Detecções",
            val: dashboardData.kpis.totalDetections,
            icon: Trash2,
          },
          {
            title: "Confiança Média (IA)",
            val: dashboardData.kpis.averageConfidence + "%",
            icon: Target,
          },
          {
            title: "Lixeira Mais Ativa",
            val: dashboardData.kpis.mostActiveBin,
            icon: Activity,
          },
          {
            title: "Principal Resíduo",
            val: dashboardData.kpis.topCategory,
            icon: BarChart3,
          },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#1f1f1f] border-[#374151] text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{stat.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-4">
        <Card className="col-span-4 bg-[#1f1f1f] border-[#374151] text-white">
          <CardHeader>
            <CardTitle>Volume de Descarte</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.volumeOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f1f1f",
                    border: "1px solid #374151",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="detections"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-[#1f1f1f] border-[#374151] text-white">
          <CardHeader>
            <CardTitle>Tipos de Resíduos</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.categories}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#374151"
                />
                <XAxis
                  type="number"
                  stroke="#9ca3af"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#9ca3af"
                  tickLine={false}
                  axisLine={false}
                  className="capitalize"
                  width={70}
                  tick={{ fontSize: 12, fill: "#fff" }}
                />
                <Tooltip
                  cursor={{ fill: "#374151" }}
                  contentStyle={{
                    backgroundColor: "#1f1f1f",
                    border: "1px solid #374151",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-[#1f1f1f] border-[#374151] text-white">
          <CardHeader>
            <CardTitle>Localização Operacional</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] relative pb-6 px-4">
            {loadError && (
              <div className="flex items-center justify-center h-full text-[#ef4444]">
                Erro ao carregar o mapa.
              </div>
            )}
            {!isLoaded && !loadError && (
              <div className="flex items-center justify-center h-full text-gray-400">
                Carregando mapa...
              </div>
            )}
            {isLoaded && (
              <div className="w-full h-full rounded-md overflow-hidden border border-[#374151]">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  zoom={13}
                  center={center}
                  onClick={() => setSelectedMapBin(null)}
                  options={mapOptions}
                >
                  {dashboardData.activeBins.map((bin) => (
                    <Marker
                      key={bin.id}
                      position={bin.location}
                      onClick={() => setSelectedMapBin(bin)}
                    />
                  ))}

                  {selectedMapBin && (
                    <InfoWindow
                      position={selectedMapBin.location}
                      onCloseClick={() => setSelectedMapBin(null)}
                    >
                      <div
                        style={{
                          color: "#1f2937",
                          padding: "4px",
                          minWidth: "190px",
                        }}
                      >
                        <h4
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "1.1em",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                          }}
                        >
                          {selectedMapBin.id}
                        </h4>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "0.85em",
                            color: "#4b5563",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <MapPin size={12} style={{ marginRight: "4px" }} />{" "}
                          {selectedMapBin.local}
                        </p>
                        <div
                          style={{
                            borderTop: "1px solid #e5e7eb",
                            paddingTop: "6px",
                            fontSize: "0.9em",
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                          }}
                        >
                          <p style={{ margin: 0 }}>
                            <strong>Total Coletado:</strong>{" "}
                            {selectedMapBin.totalDetections} itens
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Confiança:</strong>{" "}
                            <span
                              style={{ color: "#16a34a", fontWeight: "bold" }}
                            >
                              {selectedMapBin.avgConfidence}%
                            </span>
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Principal:</strong>{" "}
                            <span
                              style={{
                                textTransform: "capitalize",
                                color: "#eab308",
                                fontWeight: "bold",
                              }}
                            >
                              {selectedMapBin.topCategory}
                            </span>
                          </p>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1f1f1f] border-[#374151] text-white">
          <CardHeader>
            <CardTitle>Últimas Detecções</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] overflow-auto">
            {dashboardData.recentDetections.map((item) => {
              const dateObj = new Date(item.detected_at);

              const timeString = dateObj.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const dateString = dateObj.toLocaleDateString("pt-BR");

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-[#374151] py-3"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-4 w-4 text-[#16a34a]" />
                    <div>
                      <p className="text-sm font-medium capitalize text-white">
                        {item.item_class}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.bin_id} • Confiança:{" "}
                        <span className="text-[#eab308] font-bold">
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-400">
                    <div className="flex items-center justify-end">
                      <Clock className="h-3 w-3 mr-1" /> {timeString}
                    </div>
                    <div className="mt-1">{dateString}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const sessionToken = context.req.cookies.session_id;

  if (!sessionToken) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  try {
    const sessionObject = await session.findOneValidByToken(sessionToken);
    const userObject = await user.findOneById(sessionObject.user_id);

    if (!authorization.can(userObject, "read:dashboard")) {
      return {
        redirect: { destination: "/", permanent: false },
      };
    }

    return {
      props: {},
    };
  } catch (error) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }
}
