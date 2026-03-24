import useSWR from "swr";
import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

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
        padding: "30px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ color: "#2c3e50", fontSize: "2.5em" }}>EcoSort AI</h1>
        <h2
          style={{
            color: "#555",
            fontWeight: "normal",
            lineHeight: "1.5",
            fontSize: "1.2em",
          }}
        >
          Trabalho de conclusão de curso dos alunos do Instituto Mauá de
          Tecnologia: Lixeira inteligente com separação automática de resíduos
          com o uso de inteligência artificial.
        </h2>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e0e0e0",
          marginBottom: "30px",
        }}
      />

      <div
        style={{
          margin: "0 auto",
          maxWidth: "500px",
          backgroundColor: "#f9fcfb",
          border: "2px solid #ecf0f1",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          onClick={toggleList}
          style={{
            cursor: "pointer",
            padding: "30px",
            textAlign: "center",
            backgroundColor: isListOpen ? "#f0f9f5" : "transparent",
            transition: "background-color 0.3s ease",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "1.1em",
              color: "#7f8c8d",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Total de Itens Escaneados
          </p>

          <p
            style={{
              margin: "15px 0",
              fontSize: "4.5em",
              fontWeight: "bold",
              color: "#27ae60",
            }}
          >
            {!data && !error ? "..." : totalItems}
          </p>

          <small
            style={{
              color: "#bdc3c7",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isListOpen ? (
              <>
                <FiChevronUp size={20} /> Ocultar lista
              </>
            ) : (
              <>
                <FiChevronDown size={20} /> Ver últimos itens
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
                  padding: "0 30px 30px 30px",
                  borderTop: "2px solid #ecf0f1",
                }}
              >
                <h3
                  style={{
                    color: "#2c3e50",
                    marginTop: "20px",
                    marginBottom: "15px",
                  }}
                >
                  Últimas Atividades
                </h3>

                {!data.events || data.events.length === 0 ? (
                  <p style={{ color: "#7f8c8d" }}>
                    Nenhum resíduo registado ainda.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {data.events.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          padding: "12px 0",
                          borderBottom: "1px solid #ecf0f1",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              fontSize: "1.2em",
                              color: "#34495e",
                              textTransform: "capitalize",
                            }}
                          >
                            {item.item_class}
                          </strong>
                          <div style={{ fontSize: "0.85em", color: "#95a5a6" }}>
                            Lixeira: {item.bin_id}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{ color: "#27ae60", fontWeight: "bold" }}
                          >
                            {(item.confidence * 100).toFixed(1)}%
                          </span>
                          <div style={{ fontSize: "0.85em", color: "#95a5a6" }}>
                            {new Date(item.detected_at).toLocaleTimeString(
                              "pt-BR",
                            )}
                          </div>
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
        <p style={{ color: "#c0392b", textAlign: "center", marginTop: "20px" }}>
          Falha ao carregar os dados.
        </p>
      )}
    </div>
  );
}

export default Home;
