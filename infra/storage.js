import { S3Client } from "@aws-sdk/client-s3";

let s3Client;

const isMock =
  process.env.NODE_ENV === "test" ||
  String(process.env.MOCK_STORAGE).trim().toLowerCase() === "true";

if (isMock) {
  s3Client = {
    send: async () => Promise.resolve({ $metadata: { httpStatusCode: 200 } }),
  };
  console.log("[Storage] Rodando em modo MOCK (Bypass do R2 ativado)");
} else {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  console.log("[Storage] Conectado ao Cloudflare R2 REAL");
}

export default s3Client;
