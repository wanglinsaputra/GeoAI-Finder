import "dotenv/config";
import { buildApp } from "./app.js";

const port = parseInt(process.env.API_PORT || "4000", 10);
const host = process.env.API_HOST || "0.0.0.0";

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port, host });
    console.log(`API server running on http://${host}:${port}`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

main();
