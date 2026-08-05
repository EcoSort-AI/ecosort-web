import { S3Client } from "@aws-sdk/client-s3";

let s3Client;

if (process.env.MOCK_STORAGE === "true") {
  s3Client = {
    send: async () => Promise.resolve({}),
  };
} else {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export default s3Client;
