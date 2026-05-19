/* eslint-disable no-unused-vars */
import useSWR from "swr";
import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";
import Image from "next/image";

const fetcher = (url) => fetch(url).then((response) => response.json());

function Home() {
  const [isListOpen, setIsListOpen] = useState(false);

  const { data, error } = useSWR("/api/v1/trash-events", fetcher, {
    refreshInterval: 2000,
  });

  const toggleList = () => {
    setIsListOpen(!isListOpen);
  };

  const totalItems = data ? data.total : 0;

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        backgroundColor: "#242424",
        minHeight: "100vh",
        paddingBottom: "50px",
      }}
    >
      <Head>
        <title>EcoSort - A Lixeira Inteligente</title>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background-color: #242424;
          }
        `}</style>
      </Head>

      {/* Cabeçalho */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
        }}
      >
        <h1 style={{ color: "#16a34a", fontSize: "1.5em", margin: 0 }}>
          EcoSort AI
        </h1>
        <a
          href="#"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Sobre o Projeto
        </a>
      </header>

      <main
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Secção Superior (Apresentação) */}
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "40px",
            marginBottom: "60px",
          }}
        >
          {/* Lado Esquerdo: Textos */}
          <div style={{ flex: "1 1 400px" }}>
            <h2
              style={{
                fontSize: "3em",
                color: "#ffffff",
                margin: "0 0 20px 0",
                lineHeight: "1.2",
              }}
            >
              Lixeira inteligente com <br />
              <span style={{ color: "#16a34a" }}>separação automática.</span>
            </h2>
            <p
              style={{
                fontSize: "1.1em",
                color: "#d1d5db",
                lineHeight: "1.6",
                marginBottom: "30px",
              }}
            >
              Utilizando Inteligência Artificial e Visão Computacional para
              classificar os resíduos em tempo real.
            </p>
            <button
              style={{
                backgroundColor: "#16a34a",
                color: "#fff",
                border: "none",
                padding: "15px 30px",
                fontSize: "1em",
                borderRadius: "30px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Conhecer o EcoSort
            </button>
          </div>

          {/* Lado Direito: Imagem da Lixeira */}
          <div
            style={{
              flex: "1 1 400px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Image
              src="/Imagem1.png"
              alt="Lixeira Inteligente EcoSort"
              width={380}
              height={450}
              priority
              style={{
                width: "100%",
                maxWidth: "380px",
                height: "auto",
                display: "block",
              }}
            />
          </div>
        </section>

        {/* Secção Inferior (Dashboard Escuro IA) */}
        <section
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            borderRadius: "30px",
            padding: "50px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h3
              style={{
                fontSize: "2.2em",
                color: "#ffffff",
                margin: "0 0 10px 0",
              }}
            >
              Monitoramento em Tempo Real
            </h3>
            <p style={{ color: "#9ca3af", margin: 0 }}>
              Acompanhe as classificações da rede YOLO diretamente do
              microcontrolador.
            </p>
          </div>

          {/* Container do Odómetro/Lista */}
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              border: "1px solid #374151",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <div
              onClick={toggleList}
              style={{
                cursor: "pointer",
                padding: "40px",
                textAlign: "center",
                backgroundColor: isListOpen
                  ? "rgba(31, 41, 55, 0.8)"
                  : "transparent",
                transition: "background-color 0.3s ease",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9em",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  fontWeight: "bold",
                }}
              >
                Total de Itens Escaneados
              </p>

              <p
                style={{
                  margin: "20px 0",
                  fontSize: "5em",
                  fontWeight: "900",
                  color: "#eab308",
                }}
              >
                {!data && !error ? "..." : totalItems}
              </p>

              <small
                style={{
                  color: "#9ca3af",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isListOpen ? (
                  <>
                    <FiChevronUp size={20} /> Ocultar últimos registos
                  </>
                ) : (
                  <>
                    <FiChevronDown size={20} /> Ver últimos registos
                  </>
                )}
              </small>
            </div>

            <AnimatePresence>
              {isListOpen && data && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div
                    style={{
                      padding: "0 40px 40px 40px",
                      borderTop: "1px solid #374151",
                    }}
                  >
                    <h4
                      style={{
                        color: "#ffffff",
                        marginTop: "30px",
                        marginBottom: "20px",
                        fontSize: "1.2em",
                      }}
                    >
                      Últimas Classificações
                    </h4>

                    {!data.events || data.events.length === 0 ? (
                      <p style={{ color: "#6b7280", textAlign: "center" }}>
                        Nenhum resíduo registado ainda.
                      </p>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {data.events.map((item) => (
                          <li
                            key={item.id}
                            style={{
                              padding: "15px",
                              borderBottom: "1px solid #374151",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              backgroundColor: "rgba(31, 41, 55, 0.3)",
                              borderRadius: "10px",
                              marginBottom: "10px",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  fontSize: "1.1em",
                                  color: "#f3f4f6",
                                  textTransform: "capitalize",
                                  display: "block",
                                  marginBottom: "4px",
                                }}
                              >
                                {item.item_class}
                              </strong>
                              <span
                                style={{ fontSize: "0.85em", color: "#9ca3af" }}
                              >
                                Lixeira: {item.bin_id}
                              </span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span
                                style={{
                                  color: "#eab308",
                                  fontWeight: "bold",
                                  fontSize: "1.1em",
                                  display: "block",
                                  marginBottom: "4px",
                                }}
                              >
                                {(item.confidence * 100).toFixed(1)}%
                              </span>
                              <span
                                style={{ fontSize: "0.85em", color: "#9ca3af" }}
                              >
                                {new Date(item.detected_at).toLocaleTimeString(
                                  "pt-BR",
                                )}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <p
              style={{
                color: "#ef4444",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              Falha ao carregar os dados do microcontrolador.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;
