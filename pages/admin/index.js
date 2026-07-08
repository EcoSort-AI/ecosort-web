/* eslint-disable no-unused-vars */
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

import rawTrashData from "../../data/trash_detections.json";

export default function AdminDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dashboardData = useMemo(() => {
    if (!rawTrashData || rawTrashData.length === 0) return null;
    const totalDetections = rawTrashData.length;
    let totalConfidence = 0;
    const binCounts = {};
    const categoryCounts = {};
    const dateCounts = {};

    rawTrashData.forEach((item) => {
      totalConfidence += item.confidence;
      binCounts[item.bin_id] = (binCounts[item.bin_id] || 0) + 1;
      categoryCounts[item.item_class] =
        (categoryCounts[item.item_class] || 0) + 1;
      const formattedDate = new Date(item.detected_at).toLocaleDateString(
        "en-US",
        { day: "2-digit", month: "2-digit" },
      );
      dateCounts[formattedDate] = (dateCounts[formattedDate] || 0) + 1;
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
      recentDetections: [...rawTrashData]
        .sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at))
        .slice(0, 5),
    };
  }, []);

  if (!isMounted) return null;
  if (!dashboardData)
    return <div className="p-8 text-white">Loading dashboard data...</div>;

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
                margin={{ top: 10, right: 30, bottom: 0 }}
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
            <CardTitle>Localização</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center border-2 border-dashed border-[#374151] rounded-lg m-4">
            <div className="text-center text-gray-400">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Mapa Interativo em Construção</p>
            </div>
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
              const dateString = dateObj.toLocaleDateString("pt-BR"); // dd/mm/yyyy

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
