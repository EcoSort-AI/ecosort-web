/* eslint-disable @next/next/no-img-element */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";

import { translateMaterial } from "@/lib/dictionary";
import { toast } from "sonner";

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
import { LogOut, Loader2, Check } from "lucide-react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export default function ReviewPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState(null);

  const [selectedClasses, setSelectedClasses] = useState({});

  const router = useRouter();

  const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const validClasses = [
    "plastic",
    "metal",
    "white glass",
    "green glass",
    "brown glass",
    "paper",
    "cardboard",
    "biological",
  ];

  useEffect(() => {
    fetchPendingEvents();
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

  async function fetchPendingEvents() {
    try {
      const res = await fetch(
        "/api/v1/trash-events?status=pending&has_image=true&limit=50",
      );
      const data = await res.json();

      const pendingEvents = (data.events || []).filter(
        (e) => e.review_status === "pending" && e.image_path,
      );

      setEvents(pendingEvents);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectTempClass = (eventId, cls) => {
    setSelectedClasses((prev) => ({
      ...prev,
      [eventId]: cls,
    }));
  };

  async function handleConfirm(event) {
    const classToSend = selectedClasses[event.id] || event.item_class;

    setValidatingId(event.id);

    try {
      const res = await fetch(`/api/v1/trash-events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctClass: classToSend }),
      });

      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
        setSelectedClasses((prev) => {
          const newState = { ...prev };
          delete newState[event.id];
          return newState;
        });

        toast.success(
          `Classificação atualizada para ${translateMaterial(classToSend)}!`,
        );
      } else if (res.status === 409) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
        setSelectedClasses((prev) => {
          const newState = { ...prev };
          delete newState[event.id];
          return newState;
        });

        toast.info(
          "Outro usuário acabou de revisar esta imagem! Ela foi removida da sua fila.",
        );
      } else {
        const errorData = await res.json();
        toast.error(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Erro ao validar:", error);
      toast.error("Erro de conexão ao tentar validar a imagem.");
    } finally {
      setValidatingId(null);
    }
  }

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
                    Revisão de Imagens
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
              Revisão de Imagens
            </h2>
          </div>

          {loading ? (
            <p className="text-gray-400">Carregando fila de revisão...</p>
          ) : events.length === 0 ? (
            <div className="p-8 bg-[#1f1f1f] border border-[#374151] rounded-xl text-center">
              <p className="text-gray-400 text-lg">
                Nenhum evento pendente. A fila está vazia.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {events.map((event) => {
                const currentSelection =
                  selectedClasses[event.id] || event.item_class;
                const isCurrentlyValidating = validatingId === event.id;

                return (
                  <div
                    key={event.id}
                    className="bg-[#1f1f1f] border border-[#374151] rounded-xl p-4 flex flex-col shadow-sm"
                  >
                    <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden bg-[#242424] border border-[#374151]">
                      <img
                        src={`${R2_PUBLIC_URL}/${event.image_path}`}
                        alt={`Detectado como ${event.item_class}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1 text-sm mb-5">
                      <p className="text-gray-300">
                        <span className="text-gray-500 font-medium">
                          Previsão da IA:
                        </span>{" "}
                        <span className="capitalize font-medium text-white">
                          {translateMaterial(event.item_class)}
                        </span>
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500 font-medium">
                          Confiança:
                        </span>{" "}
                        <span
                          className={
                            event.confidence > 0.85
                              ? "text-green-400 font-semibold"
                              : "text-yellow-400 font-semibold"
                          }
                        >
                          {(event.confidence * 100).toFixed(1)}%
                        </span>
                      </p>
                      <p className="text-gray-400 text-xs">
                        <span className="text-gray-500 font-medium">
                          Lixeira:
                        </span>{" "}
                        {event.bin_id}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">
                          Corrigir Classe
                        </p>
                        <Combobox items={validClasses}>
                          <ComboboxInput
                            placeholder="Selecione a classe..."
                            readOnly={true}
                            value={translateMaterial(currentSelection)}
                            disabled={isCurrentlyValidating}
                            style={{
                              cursor: isCurrentlyValidating
                                ? "not-allowed"
                                : "pointer",
                              fontFamily: "sans-serif",
                            }}
                            className="capitalize bg-[#1f1f1f] text-white border-[#374151] placeholder:text-gray-500 focus:ring-[#16a34a] !cursor-pointer !select-none caret-transparent disabled:opacity-50"
                          />
                          <ComboboxContent
                            style={{ fontFamily: "sans-serif" }}
                            className="bg-[#1f1f1f] border border-[#374151] text-white shadow-lg rounded-md"
                          >
                            <ComboboxEmpty className="py-3 text-center text-sm text-gray-400">
                              Nenhuma classe encontrada.
                            </ComboboxEmpty>
                            <ComboboxList>
                              {(cls) => (
                                <ComboboxItem
                                  key={cls}
                                  value={cls}
                                  onSelect={() =>
                                    handleSelectTempClass(event.id, cls)
                                  }
                                  onClick={() =>
                                    handleSelectTempClass(event.id, cls)
                                  }
                                  className="capitalize cursor-pointer text-gray-300 hover:bg-[#374151] hover:text-white data-[selected=true]:bg-[#374151] data-[selected=true]:text-white rounded-sm px-2 py-1.5"
                                >
                                  <span>{translateMaterial(cls)}</span>
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </div>

                      <button
                        onClick={() => handleConfirm(event)}
                        disabled={isCurrentlyValidating}
                        className="w-full py-2 px-4 bg-[#16a34a] hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isCurrentlyValidating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Validando...
                          </>
                        ) : (
                          <>Confirmar</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
