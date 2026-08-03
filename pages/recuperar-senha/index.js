/* eslint-disable no-unused-vars */
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RequestRecoveryPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/v1/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await response.json();
      setMessage({
        type: response.ok ? "success" : "error",
        text: body.message,
      });
      setStatus("done");
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Erro ao conectar com o servidor." });
      setStatus("error");
    }
  }

  return (
    <>
      <Head>
        <title>Recuperar Senha - EcoSort</title>
      </Head>
      <div
        className="relative flex w-full items-center justify-center p-6 md:p-10 text-white"
        style={{
          fontFamily: "sans-serif",
          backgroundColor: "#242424",
          minHeight: "100vh",
          paddingBottom: "50px",
        }}
      >
        <Link
          href="/login"
          className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={16} /> Voltar para Login
        </Link>

        <Card className="w-full max-w-sm bg-[#1f1f1f] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#16a34a]">
              Recuperar senha
            </CardTitle>
            <CardDescription className="text-gray-400">
              Digite seu e-mail para receber as instruções.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "done" && message?.type === "success" ? (
              <div className="text-sm text-center p-4 bg-[#16a34a]/10 border border-[#16a34a]/20 rounded-md text-[#16a34a]">
                E-mail enviado! Verifique sua caixa de entrada.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {message?.type === "error" && (
                  <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20">
                    {message.text}
                  </div>
                )}
                <div className="grid gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-300"
                  >
                    E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-[#374151] bg-[#2a2a2a] text-white focus-visible:ring-[#16a34a]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-[#16a34a] hover:bg-[#15803d]"
                >
                  {status === "loading" ? "Enviando..." : "Enviar e-mail"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
