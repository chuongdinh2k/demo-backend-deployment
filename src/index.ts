import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createPool, type DbConfig } from "./db.js";
import { createItemsRouter } from "./itemsRoutes.js";

dotenv.config();

function readEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readPort(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid port in ${name}: ${raw}`);
  }
  return parsed;
}

function loadDbConfig(): DbConfig {
  return {
    host: readEnv("DB_HOST"),
    port: readPort("DB_PORT", 3306),
    user: readEnv("DB_USER"),
    password: readEnv("DB_PASSWORD"),
    database: readEnv("DB_NAME"),
  };
}

const dbConfig = loadDbConfig();
const pool = createPool(dbConfig);
const app = express();
const port = readPort("PORT", 3001);

app.use(cors());
app.use(express.json());
app.use("/api/items", createItemsRouter(pool));

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  },
);

app.listen(port, () => {
  console.log("API listening", { port });
});
