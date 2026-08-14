/* eslint-disable no-unused-vars */
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
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

  const [selectedDevice, setSelectedDevice] = useState("");
  const [devices, setDevices] = useState([]);
  const [threshold, setThreshold] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [telemetry, setTelemetry] = useState(null);
  const [isTelemetryLoading, setIsTelemetryLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const [isCommandSending, setIsCommandSending] = useState(false);
  const [modelVersion, setModelVersion] = useState("Carregando...");

  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch("/api/v1/devices");
        if (res.ok) {
          const data = await res.json();
          if (data.devices && data.devices.length > 0) {
            setDevices(data.devices);
            setSelectedDevice(data.devices[0]);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dispositivos:", error);
      }
    }
    fetchDevices();
  }, []);

  useEffect(() => {
    if (!selectedDevice) return;

    // Função 1: Carregamento inicial completo (com tela de loading)
    async function fetchInitialData() {
      setIsLoading(true);
      setIsTelemetryLoading(true);
      setTelemetry(null);
      setModelVersion("Carregando...");

      try {
        const configRes = await fetch(
          `/api/v1/device/config?device=${selectedDevice}`,
        );
        if (configRes.ok) {
          const configData = await configRes.json();
          setThreshold(configData.confidence_threshold);
        } else {
          setThreshold("");
        }

        const teleRes = await fetch(
          `/api/v1/device/telemetry?device=${selectedDevice}`,
        );
        if (teleRes.ok) {
          const teleData = await teleRes.json();
          setTelemetry(teleData);
        }

        const eventRes = await fetch(
          `/api/v1/trash-events?bin_id=${selectedDevice}&limit=1&sort=desc`,
        );
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          const latestEvent = eventData.events?.[0];

          if (latestEvent && latestEvent.model_version) {
            setModelVersion(latestEvent.model_version);
          } else if (latestEvent) {
            setModelVersion("Versão não informada no payload");
          } else {
            setModelVersion("Aguardando primeira classificação...");
          }
        } else {
          setModelVersion("Erro ao buscar versão");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do dispositivo:", error);
        setModelVersion("Indisponível (Erro de conexão)");
      } finally {
        setIsLoading(false);
        setIsTelemetryLoading(false);
      }
    }

    // Função 2: Atualização silenciosa apenas da telemetria (sem piscar a tela)
    async function fetchTelemetryBackground() {
      try {
        const teleRes = await fetch(
          `/api/v1/device/telemetry?device=${selectedDevice}`,
        );
        if (teleRes.ok) {
          const teleData = await teleRes.json();
          setTelemetry(teleData);
        }
      } catch (error) {
        console.error("Erro na atualização em segundo plano:", error);
      }
    }

    fetchInitialData();

    const pollingInterval = setInterval(() => {
      fetchTelemetryBackground();
    }, 30000);

    return () => clearInterval(pollingInterval);
  }, [selectedDevice]);

  useEffect(() => {
    if (!telemetry?.created_at) return;

    const interval = setInterval(() => {
      const lastUpdate = new Date(telemetry.created_at).getTime();
      const now = new Date().getTime();
      setIsOnline(now - lastUpdate <= 90000);
    }, 1000);

    return () => clearInterval(interval);
  }, [telemetry]);

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
        toast.success("Configuração atualizada com sucesso!");
      } else {
        toast.error("Erro ao atualizar a configuração.");
      }
    } catch (error) {
      toast.error("Erro de conexão ao tentar salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestartService = async () => {
    setIsCommandSending(true);

    try {
      const response = await fetch("/api/v1/device/commands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_name: selectedDevice,
          command: "restart_docker",
        }),
      });

      if (response.ok) {
        toast.success(
          `Comando enfileirado para ${selectedDevice}! A placa executará a ação em breve.`,
        );
      } else {
        const errorData = await response.json();
        toast.error(`Erro: ${errorData.message || "Desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro de conexão ao enviar comando:", error);
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setIsCommandSending(false);
    }
  };

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
            className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white transition-colors cursor-pointer"
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
            <Server className="text-gray-400" size={20} />
            <label className="text-sm font-medium text-gray-300">
              Dispositivo Ativo:
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-[#242424] border border-[#374151] text-white text-sm rounded-md focus:ring-[#16a34a] focus:border-[#16a34a] block p-2 outline-none min-w-[200px]"
              disabled={devices.length === 0}
            >
              {devices.length === 0 ? (
                <option value="">Nenhum dispositivo encontrado</option>
              ) : (
                devices.map((device) => (
                  <option key={device} value={device}>
                    {device}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {/* AI and HW Settings */}
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
                    Extraído dinamicamente da última classificação da lixeira.
                  </p>

                  {isLoading ? (
                    <div className="flex items-center text-gray-400 text-sm h-10">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Verificando versão...
                    </div>
                  ) : (
                    <Input
                      type="text"
                      value={modelVersion}
                      disabled
                      className="max-w-md bg-[#242424] border-[#374151] text-gray-300 cursor-not-allowed font-mono text-sm"
                    />
                  )}
                </div>

                <div className="pt-4 flex items-center gap-4 border-t border-[#374151] mt-6">
                  <button
                    onClick={handleSaveConfig}
                    disabled={isLoading || isSaving}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#16a34a] rounded-md hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Salvar Alterações
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Device health */}
            <Card className="bg-[#1f1f1f] border-[#374151] text-white flex flex-col">
              <CardHeader className="border-b border-[#374151] pb-4 mb-4">
                <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
                  <Activity size={20} className="text-[#16a34a]" />
                  Saúde: {selectedDevice || "Nenhum"}
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Telemetria em tempo real e controle do contêiner remoto.
                </p>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col">
                {isTelemetryLoading ? (
                  <div className="flex items-center justify-center text-gray-400 text-sm flex-1 min-h-[200px]">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando
                    telemetria...
                  </div>
                ) : !telemetry ? (
                  <div className="flex items-center justify-center text-gray-500 text-sm flex-1 min-h-[200px] border border-dashed border-[#374151] rounded-md">
                    Nenhum dado de telemetria recebido para este dispositivo.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col bg-[#242424] p-3 rounded-md border border-[#374151]">
                        <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                          <Cpu size={14} /> Uso de CPU
                        </span>
                        <span className="text-lg font-semibold text-gray-200">
                          {telemetry.cpu_usage}%
                        </span>
                      </div>
                      <div className="flex flex-col bg-[#242424] p-3 rounded-md border border-[#374151]">
                        <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                          <Thermometer size={14} /> Temp. Placa
                        </span>
                        <span className="text-lg font-semibold text-gray-200">
                          {telemetry.temperature}°C
                        </span>
                      </div>
                      <div className="flex flex-col bg-[#242424] p-3 rounded-md border border-[#374151]">
                        <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                          <Activity size={14} /> Memória (RAM)
                        </span>
                        <span className="text-lg font-semibold text-gray-200">
                          {telemetry.ram_usage}
                        </span>
                      </div>
                      <div className="flex flex-col bg-[#242424] p-3 rounded-md border border-[#374151]">
                        <span className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                          <HardDrive size={14} /> Armazenamento
                        </span>
                        <span className="text-lg font-semibold text-gray-200">
                          {telemetry.disk_free}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#374151] mt-auto">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="block text-sm font-medium text-gray-300">
                            Status do Dispositivo
                          </span>
                          {isOnline ? (
                            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              Ativo (Online)
                            </span>
                          ) : (
                            <span className="text-xs text-red-400 flex items-center gap-1 mt-1">
                              <span className="relative flex h-2 w-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                              Inativo (Offline)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          Última leitura:
                          <br />
                          {new Date(telemetry.created_at).toLocaleTimeString(
                            "pt-BR",
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <button
                          onClick={handleRestartService}
                          disabled={isCommandSending || !isOnline}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {isCommandSending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                          {isCommandSending
                            ? "Enfileirando..."
                            : "Reiniciar Serviço (Docker)"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
