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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Target, CheckCircle2, TrendingUp } from "lucide-react";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AnalyticsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const [selectedVersion, setSelectedVersion] = useState("all");

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
        accuracy: item.accuracy,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    return {
      ...apiData,
      uniqueClasses,
      chartData,
      availableVersions: apiData.availableVersions || [],
    };
  }, [apiData]);

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

          {/* KPIs Principais */}
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
                  {analyticsData.globalAccuracy}%
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

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
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
              <CardContent className="overflow-x-auto">
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
