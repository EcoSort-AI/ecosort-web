/* eslint-disable no-unused-vars */
import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cpu,
  Cog,
  BarChart3,
  Camera,
  Move,
  ArrowDownRight,
  Database,
  ArrowLeft,
  Sparkles,
  Layers,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { y: 25, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function SobreProjeto() {
  const pilares = [
    {
      titulo: "Visão Computacional & Inteligência Artificial",
      subtitulo: "Processamento Edge em Tempo Real",
      icone: Cpu,
      cor: "#16a34a",
      descricao:
        "No coração do dispositivo, um sistema embarcado executa modelos de visão computacional para inferência local de baixa latência.",
      pontos: [
        "Captura instantânea via sensor de câmara acoplado ao topo da câmara de triagem.",
        "Extração de características e classificação multiclasse (plástico, papel, cartão, vidro e metal) em milissegundos.",
        "Cálculo do grau de confiança antes da tomada de decisão física.",
      ],
    },
    {
      titulo: "Engenharia Mecânica & Atuação",
      subtitulo: "Sistema Pan-Tilt de 2 Eixos",
      icone: Cog,
      cor: "#eab308",
      descricao:
        "Após a decisão da rede neural, o sistema traduz a classe identificada em coordenadas angulares para dois servomotores (eixos X e Y) que movimentam o prato coletor.",
      pontos: [
        "Atuação conjunta entre o Servo X (movimento horizontal / Pan) e o Servo Y (movimento vertical / Tilt).",
        "A combinação dos ângulos X e Y inclina o prato diretamente na direção do compartimento correspondente, fazendo o resíduo deslizar.",
        "Retorno automático ao ponto de equilíbrio central após o descarte, preparando o prato para o próximo item.",
      ],
    },
    {
      titulo: "Arquitetura Cloud & Dashboard",
      subtitulo: "Telemetria Full-Stack e Gestão Analítica",
      icone: BarChart3,
      cor: "#3b82f6",
      descricao:
        "Cada descarte gera um evento estruturado enviado para a nuvem, alimentando uma plataforma web moderna para monitoração em tempo real.",
      pontos: [
        "API RESTful em Next.js com validação rigorosa de esquemas e persistência relacional em PostgreSQL.",
        "Dashboard administrativo com gráficos de volume temporal, distribuição de materiais e precisão da IA.",
        "Mapeamento geográfico interativo para acompanhamento operacional de múltiplas lixeiras.",
      ],
    },
  ];

  const fluxoPassos = [
    {
      passo: "01",
      titulo: "Deposição e Captura",
      descricao:
        "O utilizador deposita o resíduo sobre o prato coletor. A câmara superior captura a imagem do objeto.",
      icone: Camera,
    },
    {
      passo: "02",
      titulo: "Inferência Neuronal",
      descricao:
        "O modelo de Inteligência Artificial analisa a imagem localmente, determinando a classe do material e a certeza da previsão.",
      icone: Sparkles,
    },
    {
      passo: "03",
      titulo: "Coordenação Mecânica",
      descricao:
        "Os servomotores X (Pan horizontal) e Y (Tilt vertical) são acionados simultaneamente com os ângulos exatos do compartimento de destino.",
      icone: Move,
    },
    {
      passo: "04",
      titulo: "Inclinação e Descarte",
      descricao:
        "A combinação angular dos dois eixos inclina o prato para o quadrante correto, derrubando o resíduo no compartimento e nivelando o prato em seguida.",
      icone: ArrowDownRight,
    },
    {
      passo: "05",
      titulo: "Sincronização Cloud",
      descricao:
        "Os metadados da operação (classe, confiança, carimbo de data/hora e ID da lixeira) são registados na base de dados e exibidos no Dashboard.",
      icone: Database,
    },
  ];

  return (
    <div
      style={{ fontFamily: "sans-serif" }}
      className="min-h-screen bg-[#242424] text-white selection:bg-[#16a34a] selection:text-white pb-24"
    >
      <Head>
        <title>Sobre o Projeto | EcoSort AI</title>
      </Head>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#16a34a] rounded-full mix-blend-screen filter blur-[140px] opacity-15" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#eab308] rounded-full mix-blend-screen filter blur-[160px] opacity-10" />
      </div>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
        }}
        className="relative z-10 bg-[#242424]/80 backdrop-blur-md sticky top-0 border-b border-white/5"
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link href="/">
            <Image
              src="/logo.png"
              alt="EcoSort AI Logo"
              width={160}
              height={50}
              priority
              style={{ objectFit: "contain", cursor: "pointer" }}
            />
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors no-underline"
          >
            <ArrowLeft className="w-4 h-4 text-[#16a34a]" />
            Voltar ao Início
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#16a34a]/10 border border-[#16a34a]/30 text-[#16a34a] text-xs font-bold uppercase tracking-wider mb-6">
            <Layers className="w-3.5 h-3.5" />
            Engenharia de Computação & Controle
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            A tecnologia por trás da{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16a34a] to-[#4ade80]">
              reciclagem autónoma.
            </span>
          </h2>

          <p className="text-gray-300 text-lg leading-relaxed">
            O <strong>EcoSort AI</strong> integra visão computacional embarcada,
            atuação eletromecânica de dois eixos e computação em nuvem para
            eliminar o erro humano na triagem de resíduos sólidos, transformando
            lixeiras comuns em terminais inteligentes de sustentabilidade.
          </p>
        </motion.section>

        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-28"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Três Pilares Integrados
            </h3>
            <p className="text-gray-400">
              Hardware e software desenhados para operar em perfeita sincronia.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pilares.map((pilar, idx) => {
              const IconComponent = pilar.icone;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-full bg-[#1f1f1f]/90 border-[#374151] hover:border-[#16a34a]/60 transition-all duration-300 text-white shadow-xl flex flex-col justify-between overflow-hidden relative group">
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: pilar.cor }}
                    />

                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform"
                          style={{ color: pilar.cor }}
                        >
                          <IconComponent className="w-7 h-7" />
                        </div>
                        <span className="text-xs font-mono uppercase tracking-widest text-gray-500">
                          Módulo 0{idx + 1}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold text-white">
                        {pilar.titulo}
                      </CardTitle>
                      <p
                        className="text-xs font-semibold tracking-wide uppercase mt-1"
                        style={{ color: pilar.cor }}
                      >
                        {pilar.subtitulo}
                      </p>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col justify-between">
                      <p className="text-gray-300 text-sm leading-relaxed mb-6">
                        {pilar.descricao}
                      </p>

                      <ul className="space-y-3 border-t border-[#374151]/80 pt-5 text-xs text-gray-300">
                        {pilar.pontos.map((ponto, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2
                              className="w-4 h-4 shrink-0 mt-0.5"
                              style={{ color: pilar.cor }}
                            />
                            <span className="leading-normal">{ponto}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-24 bg-[#1a1a1a] border border-[#374151] rounded-3xl p-8 md:p-12"
        >
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[#eab308] text-xs font-bold uppercase tracking-widest">
              Fluxo Operacional
            </span>
            <h3 className="text-2xl md:text-3xl font-bold mt-2 mb-3">
              Como o EcoSort funciona na prática?
            </h3>
            <p className="text-gray-400 text-sm">
              Do momento em que o resíduo é descartado até ao registo analítico
              no painel administrativo, todo o processo ocorre em poucos
              segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {fluxoPassos.map((item, index) => {
              const StepIcon = item.icone;
              return (
                <div
                  key={index}
                  className="bg-[#242424] border border-[#374151] rounded-2xl p-5 flex flex-col justify-between relative hover:border-[#eab308]/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-black text-[#eab308]/90 font-mono">
                        {item.passo}
                      </span>
                      <div className="p-2 rounded-lg bg-[#1f1f1f] text-[#16a34a]">
                        <StepIcon className="w-5 h-5" />
                      </div>
                    </div>
                    <h4 className="font-bold text-base mb-2 text-white">
                      {item.titulo}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {item.descricao}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-[#1f1f1f] to-[#18181b] border border-[#374151] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-[#16a34a] text-sm font-bold mb-3">
              <ShieldCheck className="w-5 h-5" />
              Qualidade e Rastreabilidade
            </div>
            <h3 className="text-2xl font-bold mb-3">
              Monitorização Contínua e Auditoria de IA
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Além da separação física automatizada, a arquitetura do EcoSort AI
              permite auditar as previsões do modelo, acompanhar a telemetria de
              hardware dos dispositivos e analisar métricas de sustentabilidade
              em tempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Link
              href="/"
              className="px-6 py-3.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-sm transition-colors text-center shadow-lg shadow-[#16a34a]/20 no-underline"
            >
              Ver Contador e Mapa Público
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-full bg-[#242424] hover:bg-[#374151] text-white border border-[#374151] font-bold text-sm transition-colors text-center no-underline"
            >
              Acessar o Painel Admin
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
