import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Save, X } from "lucide-react";

export default function UserFeaturesModal({ isOpen, onClose, targetUsername }) {
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [userFeatures, setUserFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchFeatures() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/v1/users/${targetUsername}/features`,
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableFeatures(data.available_features);
          setUserFeatures(data.user_features);
        } else {
          toast.error("Erro ao carregar permissões do usuário.");
        }
      } catch (error) {
        toast.error("Erro de conexão ao buscar permissões.");
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen && targetUsername) fetchFeatures();
  }, [isOpen, targetUsername]);

  if (!isOpen) return null;

  const handleToggleFeature = (feature) => {
    setUserFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature],
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/users/${targetUsername}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_features: userFeatures }),
      });

      if (response.ok) {
        toast.success("Permissões salvas com sucesso!");
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      toast.error("Erro de conexão ao tentar salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const groupFeatures = (features) => {
    return features.reduce((acc, feature) => {
      let category = "Outros";
      if (feature === "admin") category = "Acesso Master";
      else if (feature.includes("user") || feature.includes("invitation"))
        category = "Gestão de Usuários";
      else if (feature.includes("device") || feature.includes("command"))
        category = "Infraestrutura e Lixeiras";
      else if (feature.includes("trash") || feature.includes("dashboard"))
        category = "Operação e Eventos";
      else if (feature.includes("session") || feature.includes("token"))
        category = "Autenticação";
      else if (feature.includes("status") || feature.includes("migration"))
        category = "Sistema";

      if (!acc[category]) acc[category] = [];
      acc[category].push(feature);
      return acc;
    }, {});
  };

  const groupedFeatures = groupFeatures(availableFeatures);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="bg-[#1f1f1f] border border-[#374151] rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh] text-white"
        style={{ fontFamily: "sans-serif" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#374151]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-[#16a34a] h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Editar Permissões
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Defina os privilégios de acesso para{" "}
                <span className="text-gray-200 font-medium">
                  {targetUsername}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-[#374151] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="p-6 overflow-y-auto flex-1 bg-[#242424] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#242424] [&::-webkit-scrollbar-thumb]:bg-[#374151] hover:[&::-webkit-scrollbar-thumb]:bg-[#4b5563] [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ scrollbarColor: "#374151 #242424", scrollbarWidth: "thin" }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium">
                Carregando matriz de acessos...
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedFeatures).map(([category, features]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider border-b border-[#374151] pb-2">
                    {category}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature) => {
                      const isEnabled = userFeatures.includes(feature);
                      return (
                        <label
                          key={feature}
                          className={`flex items-center justify-between p-4 rounded-md border cursor-pointer transition-all duration-200 select-none ${
                            isEnabled
                              ? "bg-[#1f1f1f] border-[#16a34a]"
                              : "bg-[#2a2a2a] border-[#374151] hover:border-gray-500"
                          }`}
                        >
                          <span
                            className={`text-sm font-mono truncate mr-3 ${isEnabled ? "text-[#16a34a] font-semibold" : "text-gray-300 font-medium"}`}
                            title={feature}
                          >
                            {feature}
                          </span>

                          <div className="relative shrink-0 w-10 h-5">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isEnabled}
                              onChange={() => handleToggleFeature(feature)}
                            />
                            <div className="block w-full h-full rounded-full bg-[#374151] peer-checked:bg-[#16a34a] transition-colors"></div>
                            <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#374151] bg-[#1f1f1f]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-300 bg-transparent hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 py-2 px-6 bg-[#16a34a] hover:bg-[#15803d] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
