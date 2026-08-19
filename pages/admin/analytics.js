/* eslint-disable no-unused-vars */
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { useRouter } from "next/router";
import useSWR from "swr";
import React, { useState, useEffect, useMemo } from "react";
import { translateMaterial } from "@/lib/dictionary";

import { AppSidebar } from "@/components/ui/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogOut,
  Target,
  CheckCircle2,
  TrendingUp,
  GitCompare,
  Scale,
  Layers,
} from "lucide-react";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AnalyticsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const [selectedVersion, setSelectedVersion] = useState("all");

  const [modelA, setModelA] = useState("");
  const [modelB, setModelB] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/sessions", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
    } finally {
      router.push("/");
    }
  };

  const { data: apiData, error } = useSWR(
    `/api/v1/analytics?version=${selectedVersion}`,
    fetcher,
    {
      refreshInterval: 10000,
    },
  );

  const analyticsData = useMemo(() => {
    if (!apiData || apiData.message || !apiData.confusionMatrix) {
      return {
        globalAccuracy: 0,
        totalReviewed: 0,
        accuracyByClass: [],
        confusionMatrix: [],
        uniqueClasses: [],
        chartData: [],
        availableVersions: [],
      };
    }

    const classesSet = new Set();
    apiData.confusionMatrix.forEach((item) => {
      classesSet.add(item.real);
      classesSet.add(item.previsto);
    });
    const uniqueClasses = Array.from(classesSet).sort();

    const chartData = apiData.accuracyByClass
      .map((item) => ({
        category: translateMaterial(item.category),
        accuracy: item.hasSamples ? item.accuracy : null,
      }))
      .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));

    return {
      ...apiData,
      uniqueClasses,
      chartData,
      availableVersions: apiData.availableVersions || [],
    };
  }, [apiData]);

  useEffect(() => {
    if (analyticsData.availableVersions.length > 0) {
      const sortedVersions = [...analyticsData.availableVersions].sort((a, b) =>
        a.localeCompare(b),
      );

      if (!modelA) {
        setModelA(sortedVersions[0]);
      }

      if (!modelB) {
        setModelB(
          sortedVersions.length > 1
            ? sortedVersions[sortedVersions.length - 1]
            : sortedVersions[0],
        );
      }
    }
  }, [analyticsData.availableVersions, modelA, modelB]);

  const { data: dataA } = useSWR(
    modelA ? `/api/v1/analytics?version=${modelA}` : null,
    fetcher,
    { refreshInterval: 10000 },
  );

  const { data: dataB } = useSWR(
    modelB ? `/api/v1/analytics?version=${modelB}` : null,
    fetcher,
    { refreshInterval: 10000 },
  );

  const comparisonData = useMemo(() => {
    if (!dataA?.accuracyByClass || !dataB?.accuracyByClass) return [];

    const categoriesA = dataA.accuracyByClass.map((c) => c.category);
    const categoriesB = dataB.accuracyByClass.map((c) => c.category);
    const allUniqueCategories = Array.from(
      new Set([...categoriesA, ...categoriesB]),
    );

    return allUniqueCategories.map((cat) => {
      const matchA = dataA.accuracyByClass.find((c) => c.category === cat);
      const matchB = dataB.accuracyByClass.find((c) => c.category === cat);

      return {
        subject: translateMaterial(cat),
        category: translateMaterial(cat),
        [modelA]: matchA && matchA.hasSamples ? matchA.accuracy : null,
        [modelB]: matchB && matchB.hasSamples ? matchB.accuracy : null,
      };
    });
  }, [dataA, dataB, modelA, modelB]);

  const evolutionData = useMemo(() => {
    if (
      !analyticsData.availableVersions ||
      analyticsData.availableVersions.length === 0
    )
      return [];

    const sortedVersions = [...analyticsData.availableVersions].sort((a, b) =>
      a.localeCompare(b),
    );

    return sortedVersions
      .map((version) => {
        if (version === modelA && dataA && dataA.globalAccuracy !== null)
          return { version, accuracy: dataA.globalAccuracy };
        if (version === modelB && dataB && dataB.globalAccuracy !== null)
          return { version, accuracy: dataB.globalAccuracy };

        return null;
      })
      .filter(Boolean);
  }, [analyticsData.availableVersions, modelA, modelB, dataA, dataB]);

  if (!isMounted) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#242424]">
        {/* Header */}
        <header
          className="flex h-16 shrink-0 items-center gap-2 border-b border-[#374151] px-4 bg-[#1f1f1f] text-white"
          style={{ fontFamily: "sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 hover:bg-[#374151] hover:text-white text-gray-400" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-300 font-medium">
                    Estatísticas do Modelo
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <button
            onClick={handleLogout}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </header>

        <div
          style={{ fontFamily: "sans-serif" }}
          className="min-h-screen bg-[#242424] p-8 text-white"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-[#16a34a]">
              Desempenho da IA
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Acurácia Global
                </CardTitle>
                <Target className="h-4 w-4 text-[#16a34a]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#16a34a]">
                  {analyticsData.globalAccuracy !== null
                    ? `${analyticsData.globalAccuracy}%`
                    : "---"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Taxa de acerto geral após validação
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Itens Revisados
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analyticsData.totalReviewed}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Imagens validadas pela equipe
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Versão do Modelo
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="w-full bg-[#242424] border border-[#374151] rounded-md px-3 py-2 text-lg text-blue-400 font-bold focus:border-[#16a34a] focus:outline-none mb-1"
                >
                  <option value="all">Todas as Versões</option>
                  {analyticsData.availableVersions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Filtre as estatísticas por versão da IA
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-12">
            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader>
                <CardTitle>Acurácia por Classe</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="category"
                      stroke="#9ca3af"
                      tickLine={false}
                      axisLine={false}
                      className="capitalize"
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      cursor={{ fill: "#2a2a2a" }}
                      contentStyle={{
                        backgroundColor: "#1f1f1f",
                        border: "1px solid #374151",
                        borderRadius: "6px",
                      }}
                      labelStyle={{
                        color: "#ffffff",
                        fontWeight: "bold",
                        marginBottom: "4px",
                      }}
                      itemStyle={{
                        color: "#e5e7eb",
                      }}
                      formatter={(value) => [`${value}%`, "Acurácia"]}
                    />
                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                      {analyticsData.chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.accuracy > 85 ? "#16a34a" : "#eab308"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Confusion Matrix */}
            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader>
                <CardTitle>Matriz de Confusão (Heatmap)</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto pb-2 [scrollbar-color:#374151_#1f1f1f] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#1f1f1f] [&::-webkit-scrollbar-track]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-[#374151] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4b5563] transition-colors">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-gray-400 font-medium border-b border-r border-[#374151] bg-[#2a2a2a]">
                        Real \ Previsto
                      </th>
                      {analyticsData.uniqueClasses.map((cls) => (
                        <th
                          key={`th-${cls}`}
                          className="p-3 text-center text-gray-300 font-medium capitalize border-b border-[#374151]"
                        >
                          {translateMaterial(cls)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.uniqueClasses.map((realClass) => (
                      <tr key={`tr-${realClass}`}>
                        <td className="p-3 text-gray-300 font-medium capitalize border-r border-b border-[#374151] bg-[#2a2a2a]">
                          {translateMaterial(realClass)}
                        </td>
                        {analyticsData.uniqueClasses.map((predictedClass) => {
                          const match = analyticsData.confusionMatrix.find(
                            (m) =>
                              m.real === realClass &&
                              m.previsto === predictedClass,
                          );
                          const count = match ? match.count : 0;
                          const isTruePositive = realClass === predictedClass;

                          let bgColor = "transparent";
                          if (count > 0) {
                            if (isTruePositive) {
                              bgColor = "rgba(22, 163, 74, 0.2)";
                            } else {
                              bgColor = "rgba(239, 68, 68, 0.2)";
                            }
                          }

                          return (
                            <td
                              key={`td-${realClass}-${predictedClass}`}
                              className="p-3 text-center border-b border-[#374151] font-semibold"
                              style={{ backgroundColor: bgColor }}
                            >
                              {count > 0 ? count : "-"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-xs text-gray-400 flex gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-[#16a34a] opacity-50"></div>
                    <span>Acertos (Verdadeiros Positivos)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-[#ef4444] opacity-50"></div>
                    <span>Erros (Falsos Positivos/Negativos)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 pt-8 border-t border-[#374151]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <GitCompare className="text-[#3b82f6]" />
                Comparação de Modelos
              </h2>

              {/* Version Selector */}
              <div className="flex items-center gap-4 bg-[#1f1f1f] p-3 rounded-lg border border-[#374151]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#16a34a]">
                    Modelo A:
                  </span>
                  <select
                    className="bg-[#242424] border border-[#374151] rounded px-3 py-1.5 text-sm font-semibold outline-none focus:border-[#16a34a]"
                    value={modelA}
                    onChange={(e) => setModelA(e.target.value)}
                  >
                    {analyticsData.availableVersions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-gray-500 font-black">X</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#3b82f6]">
                    Modelo B:
                  </span>
                  <select
                    className="bg-[#242424] border border-[#374151] rounded px-3 py-1.5 text-sm font-semibold outline-none focus:border-[#3b82f6]"
                    value={modelB}
                    onChange={(e) => setModelB(e.target.value)}
                  >
                    {analyticsData.availableVersions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Comparison KPIs */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <Card className="bg-[#1f1f1f] border-[#374151] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <Target size={16} /> Comparativo de Acurácia Global
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-xs text-[#16a34a] font-bold mb-1">
                        {modelA || "---"}
                      </p>
                      <p className="text-3xl font-bold">
                        {dataA?.globalAccuracy !== null
                          ? `${dataA?.globalAccuracy}%`
                          : "---"}
                      </p>
                    </div>
                    <div className="h-8 border-l border-[#374151] mx-4"></div>
                    <div className="text-right">
                      <p className="text-xs text-[#3b82f6] font-bold mb-1">
                        {modelB || "---"}
                      </p>
                      <p className="text-3xl font-bold">
                        {dataB?.globalAccuracy !== null
                          ? `${dataB?.globalAccuracy}%`
                          : "---"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1f1f1f] border-[#374151] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <Layers size={16} /> Volume de Itens Revisados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-xs text-[#16a34a] font-bold mb-1">
                        {modelA || "---"}
                      </p>
                      <p className="text-3xl font-bold">
                        {dataA?.totalReviewed || 0}
                      </p>
                    </div>
                    <div className="h-8 border-l border-[#374151] mx-4"></div>
                    <div className="text-right">
                      <p className="text-xs text-[#3b82f6] font-bold mb-1">
                        {modelB || "---"}
                      </p>
                      <p className="text-3xl font-bold">
                        {dataB?.totalReviewed || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-[#1f1f1f] border-[#374151] text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Acurácia por Classe</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#374151"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="category"
                        stroke="#9ca3af"
                        tickLine={false}
                        axisLine={false}
                        className="capitalize"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip
                        cursor={{ fill: "#2a2a2a" }}
                        contentStyle={{
                          backgroundColor: "#1f1f1f",
                          borderColor: "#374151",
                          color: "#fff",
                          borderRadius: "6px",
                        }}
                        formatter={(value) => [`${value}%`, "Acurácia"]}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Bar
                        dataKey={modelA}
                        name={`Modelo A (${modelA})`}
                        fill="#16a34a"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={modelB}
                        name={`Modelo B (${modelB})`}
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#1f1f1f] border-[#374151] text-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Equilíbrio do Modelo
                    <Scale className="h-5 w-5 text-gray-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      data={comparisonData}
                    >
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        className="capitalize"
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        stroke="#374151"
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f1f1f",
                          borderColor: "#374151",
                          color: "#fff",
                          borderRadius: "6px",
                        }}
                        formatter={(value) => [`${value}%`, "Acurácia"]}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />

                      <Radar
                        name={`Modelo B (${modelB})`}
                        dataKey={modelB}
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.25}
                      />

                      <Radar
                        name={`Modelo A (${modelA})`}
                        dataKey={modelA}
                        stroke="#16a34a"
                        fill="#16a34a"
                        fillOpacity={0.45}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Evolution Chart */}
            <div className="mt-6">
              <Card className="bg-[#1f1f1f] border-[#374151] text-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#16a34a]" />
                    Evolução da Acurácia Global
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    Acompanhe o impacto do retreinamento na performance geral da
                    IA.
                  </p>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={evolutionData}
                      margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorAccuracy"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#16a34a"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#16a34a"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#374151"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="version"
                        stroke="#9ca3af"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fontWeight: "bold" }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tickLine={false}
                        axisLine={false}
                        domain={["dataMin - 10", 100]}
                        tickFormatter={(val) => `${val.toFixed(0)}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f1f1f",
                          borderColor: "#374151",
                          color: "#fff",
                          borderRadius: "6px",
                        }}
                        formatter={(value) => [`${value}%`, "Acurácia"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#16a34a"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorAccuracy)"
                        activeDot={{
                          r: 6,
                          fill: "#16a34a",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
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
