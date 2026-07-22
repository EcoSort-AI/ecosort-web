/* eslint-disable no-unused-vars */
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import trashEvent from "models/trashEvent.js";
import { useRouter } from "next/router";
import useSWR from "swr";
import React, { useState } from "react";
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
import { Card } from "@/components/ui/card";
import { LogOut, Filter, Search, Calendar, Cpu, Box } from "lucide-react";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function HistoryPage({ availableClasses = [] }) {
  const router = useRouter();

  const [filterMaterial, setFilterMaterial] = useState("all");
  const [filterDays, setFilterDays] = useState("all");
  const [filterConfidence, setFilterConfidence] = useState(0);

  const queryParams = new URLSearchParams({
    material: filterMaterial,
    days: filterDays,
    min_confidence: filterConfidence,
  }).toString();

  const { data, error } = useSWR(
    `/api/v1/trash-events?${queryParams}`,
    fetcher,
  );
  const eventsList = data?.events || [];
  const isLoading = !data && !error;

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/sessions", { method: "DELETE" });
    } finally {
      router.push("/");
    }
  };

  const formatConfidence = (val) => `${(Number(val) * 100).toFixed(1)}%`;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#242424]">
        <header
          className="flex h-16 items-center justify-between border-b border-[#374151] px-4 bg-[#1f1f1f] text-white w-full"
          style={{ fontFamily: "sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 hover:bg-[#374151] text-gray-400" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-300 font-medium">
                    Histórico de Classificações
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white transition-colors"
          >
            <LogOut size={16} /> Sair
          </button>
        </header>

        <div
          style={{ fontFamily: "sans-serif" }}
          className="min-h-screen bg-[#242424] p-8 text-white"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-[#16a34a] flex items-center gap-3">
              <Search size={28} /> Histórico de Leituras
            </h2>
            <p className="text-gray-400 mt-1 text-sm">
              Monitore os eventos registrados pelas lixeiras inteligentes e
              avalie a precisão do modelo.
            </p>
          </div>

          {/* Filter Bar */}
          <Card className="bg-[#1f1f1f] border-[#374151] p-4 mb-6 text-white">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/4">
                <label className="text-xs font-medium text-gray-400 uppercase flex items-center gap-1 mb-2">
                  <Box size={14} /> Classe
                </label>
                <select
                  value={filterMaterial}
                  onChange={(e) => setFilterMaterial(e.target.value)}
                  className="w-full bg-[#242424] border border-[#374151] rounded-md px-3 py-2 text-sm focus:border-[#16a34a] focus:outline-none"
                >
                  <option value="all">Todas as Classes</option>

                  {availableClasses.map((material) => (
                    <option key={material} value={material}>
                      {translateMaterial(material)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-1/4">
                <label className="text-xs font-medium text-gray-400 uppercase flex items-center gap-1 mb-2">
                  <Calendar size={14} /> Período
                </label>
                <select
                  value={filterDays}
                  onChange={(e) => setFilterDays(e.target.value)}
                  className="w-full bg-[#242424] border border-[#374151] rounded-md px-3 py-2 text-sm focus:border-[#16a34a] focus:outline-none"
                >
                  <option value="all">Todo o período</option>
                  <option value="1">Últimas 24 horas</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 3 meses</option>
                  <option value="180">Últimos 6 meses</option>
                </select>
              </div>

              <div className="w-full md:w-1/4">
                <label className="text-xs font-medium text-gray-400 uppercase flex items-center gap-1 mb-2">
                  <Cpu size={14} /> Confiança Mínima IA
                </label>
                <select
                  value={filterConfidence}
                  onChange={(e) => setFilterConfidence(e.target.value)}
                  className="w-full bg-[#242424] border border-[#374151] rounded-md px-3 py-2 text-sm focus:border-[#16a34a] focus:outline-none"
                >
                  <option value="0">Qualquer precisão</option>
                  <option value="0.7">Acima de 70%</option>
                  <option value="0.8">Acima de 80%</option>
                  <option value="0.9">Acima de 90%</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="bg-[#1f1f1f] border-[#374151] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-[#242424] border-b border-[#374151]">
                  <tr>
                    <th className="px-6 py-4">Data e Hora</th>
                    <th className="px-6 py-4">Lixeira (ID)</th>
                    <th className="px-6 py-4">Classificação</th>
                    <th className="px-6 py-4">Confiança (IA)</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Carregando registros...
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-[#ef4444]"
                      >
                        Erro ao carregar o histórico.
                      </td>
                    </tr>
                  )}
                  {!isLoading && !error && eventsList?.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Nenhuma leitura encontrada para estes filtros.
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    !error &&
                    eventsList?.map((event) => (
                      <tr
                        key={event.id}
                        className="border-b border-[#374151] hover:bg-[#2a2a2a] transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-300">
                          {formatDate(event.detected_at)}
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-mono text-xs">
                          {event.bin_id}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-[#16a34a]/20 text-[#16a34a] font-bold px-2.5 py-1 rounded-full text-xs uppercase">
                            {translateMaterial(event.item_class)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold ${Number(event.confidence) > 0.85 ? "text-green-400" : "text-yellow-400"}`}
                          >
                            {formatConfidence(event.confidence)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export async function getServerSideProps(context) {
  const sessionToken = context.req.cookies.session_id;
  if (!sessionToken)
    return { redirect: { destination: "/login", permanent: false } };

  try {
    const sessionObject = await session.findOneValidByToken(sessionToken);
    const userObject = await user.findOneById(sessionObject.user_id);

    if (!authorization.can(userObject, "read:trash_events")) {
      return { redirect: { destination: "/", permanent: false } };
    }

    const availableClasses = await trashEvent.getUniqueClasses();

    return {
      props: {
        availableClasses,
      },
    };
  } catch (error) {
    return { redirect: { destination: "/login", permanent: false } };
  }
}
