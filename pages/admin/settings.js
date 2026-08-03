/* eslint-disable no-unused-vars */
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import {
  LogOut,
  Save,
  Loader2,
  Cpu,
  HardDrive,
  Thermometer,
  Activity,
  RefreshCw,
  Server,
} from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const router = useRouter();

  const [selectedDevice, setSelectedDevice] = useState("smart-bin-01");
  const [threshold, setThreshold] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Lista simulada de dispositivos cadastrados
  const registeredDevices = ["smart_bin_01", "smart_bin_02", "smart_bin_03"];

  useEffect(() => {
    async function fetchConfig() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/v1/device/config?device=${selectedDevice}`,
        );
        if (response.ok) {
          const data = await response.json();
          setThreshold(data.confidence_threshold);
        } else {
          console.error("Dispositivo não encontrado ou erro na API");
          setThreshold("");
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, [selectedDevice]);

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

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/v1/device/config", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_name: selectedDevice,
          confidence_threshold: parseInt(threshold, 10),
        }),
      });

      if (response.ok) {
        setStatusMessage({ type: "success", text: "Configuração atualizada!" });
      } else {
        setStatusMessage({ type: "error", text: "Erro ao atualizar." });
      }
    } catch (error) {
      setStatusMessage({ type: "error", text: "Erro de conexão." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const modelVersion = "v0.9.0-beta - Modelo de Classificação de Objetos";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#242424]">
        <header
          className="flex h-16 shrink-0 items-center gap-2 border-b border-[#374151] px-4 bg-[#1f1f1f] text-white"
          style={{ fontFamily: "sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 hover:bg-[#374151] hover:text-white text-gray-400" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-300 font-medium flex items-center gap-2">
                    Configurações
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
              Configurações do Sistema
            </h2>
          </div>

          <div className="mb-6 flex items-center gap-4 bg-[#1f1f1f] p-4 rounded-lg border border-[#374151]">
            <label className="text-sm font-medium text-gray-300">
              Dispositivo Ativo:
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-[#242424] border border-[#374151] text-white text-sm rounded-md focus:ring-[#16a34a] focus:border-[#16a34a] block p-2 outline-none min-w-[200px]"
            >
              {registeredDevices.map((device) => (
                <option key={device} value={device}>
                  {device}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {/* AI and HW */}
            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader className="border-b border-[#374151] pb-4 mb-4">
                <CardTitle className="text-lg font-medium text-gray-200">
                  Parâmetros de IA e Hardware
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Valores atuais operando no dispositivo selecionado.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 leading-none">
                    Limiar de Confiança (Threshold %)
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Classificações com certeza abaixo deste valor são enviadas
                    para revisão.
                  </p>

                  {isLoading ? (
                    <div className="flex items-center text-gray-400 text-sm h-10">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Carregando...
                    </div>
                  ) : (
                    <Input
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      min="1"
                      max="100"
                      className="max-w-md bg-[#242424] border-[#374151] text-white focus:border-[#16a34a] focus:ring-[#16a34a]"
                    />
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-gray-300 leading-none">
                    Versão do Modelo em Produção
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    A versão do modelo de visão computacional atualmente
                    embarcado no contêiner.
                  </p>
                  <Input
                    type="text"
                    value={modelVersion}
                    disabled
                    className="max-w-md bg-[#242424] border-[#374151] text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div className="pt-4 flex items-center gap-4 border-t border-[#374151] mt-6">
                  <button
                    onClick={handleSaveConfig}
                    disabled={isLoading || isSaving}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#16a34a] rounded-md hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Salvar Alterações
                  </button>

                  {statusMessage && (
                    <span
                      className={`text-sm ${statusMessage.type === "success" ? "text-[#16a34a]" : "text-red-400"}`}
                    >
                      {statusMessage.text}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Device health */}
            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader className="border-b border-[#374151] pb-4 mb-4">
                <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
                  <Activity size={20} className="text-[#16a34a]" />
                  Saúde: {selectedDevice}
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Telemetria em tempo real e controle do contêiner remoto.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Métricas Mockadas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col bg-[#242424] p-3 rounded-md border border-[#374151]">
                    <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <Cpu size={14} /> Uso de CPU
                    </span>
                    <span className="text-lg font-semibold text-gray-200">
                      {selectedDevice === "smart-bin-01" ? "42%" : "18%"}
                    </span>
                  </div>
                  <div className="flex flex-col bg-[#242424] p-3 rounded-md border border-[#374151]">
                    <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <Thermometer size={14} /> Temp. Placa
                    </span>
                    <span className="text-lg font-semibold text-gray-200">
                      {selectedDevice === "smart-bin-01" ? "58°C" : "45°C"}
                    </span>
                  </div>
                  <div className="flex flex-col bg-[#242424] p-3 rounded-md border border-[#374151]">
                    <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <Activity size={14} /> Memória (RAM)
                    </span>
                    <span className="text-lg font-semibold text-gray-200">
                      {selectedDevice === "smart-bin-01"
                        ? "1.2 / 4 GB"
                        : "0.8 / 4 GB"}
                    </span>
                  </div>
                  <div className="flex flex-col bg-[#242424] p-3 rounded-md border border-[#374151]">
                    <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <HardDrive size={14} /> Armazenamento
                    </span>
                    <span className="text-lg font-semibold text-gray-200">
                      14.5 GB Livres
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#374151]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="block text-sm font-medium text-gray-300">
                        Status do Contêiner
                      </span>
                      <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Rodando (Up 3 days)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      console.log(`Comando enfileirado para ${selectedDevice}!`)
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white transition-colors"
                  >
                    <RefreshCw size={16} />
                    Reiniciar Serviço (Docker)
                  </button>
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
