import React, { useState } from "react";
import { X, Mail, Send, CheckCircle, AlertCircle } from "lucide-react";

export function InviteModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: null, message: "" });

    try {
      const response = await fetch("/api/v1/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar o convite.");
      }

      setFeedback({
        type: "success",
        message: "Convite gerado/enviado com sucesso!",
      });
      setEmail("");

      setTimeout(() => {
        onClose();
        setFeedback({ type: null, message: "" });
      }, 2000);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Não foi possível processar o convite.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div
        style={{ fontFamily: "sans-serif" }}
        className="bg-[#1f1f1f] border border-[#374151] rounded-xl w-full max-w-md p-6 text-white relative shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#16a34a] flex items-center gap-2">
            <Mail size={22} /> Convidar Colaborador
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Envie um convite de acesso para um novo membro da equipe EcoSort.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-2">
              E-mail do Colaborador
            </label>
            <input
              type="email"
              required
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#242424] border border-[#374151] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#16a34a] transition-colors"
            />
          </div>

          {/* Error or Success Feedback */}
          {feedback.message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md text-xs font-medium ${
                feedback.type === "success"
                  ? "bg-[#16a34a]/20 text-[#16a34a] border border-[#16a34a]/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {feedback.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#16a34a] hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              <Send size={16} />
              {loading ? "Enviando..." : "Enviar Convite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
