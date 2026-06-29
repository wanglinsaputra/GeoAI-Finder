import { Redis } from "ioredis";
import type { AnalysisResult } from "@geoai/shared";

const TTL = 5 * 60; // 5 minutes — job data auto-expires

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
  }
  return redis;
}

export async function connectStore(): Promise<void> {
  const r = getRedis();
  if (r.status === "wait") {
    await r.connect();
  }
}

export async function disconnectStore(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function setJobPending(id: string): Promise<void> {
  const r = getRedis();
  const data: AnalysisResult = {
    id,
    status: "pending",
  };
  await r.setex(`job:${id}`, TTL, JSON.stringify(data));
}

export async function setJobProcessing(id: string): Promise<void> {
  const r = getRedis();
  const existing = await r.get(`job:${id}`);
  if (!existing) return;
  const data = JSON.parse(existing) as AnalysisResult;
  data.status = "processing";
  await r.setex(`job:${id}`, TTL, JSON.stringify(data));
}

export async function setJobResult(
  id: string,
  result: Omit<AnalysisResult, "id" | "status"> & { status: "completed" | "failed" }
): Promise<void> {
  const r = getRedis();
  const data: AnalysisResult = {
    id,
    ...result,
  };
  // Refresh TTL so client can poll
  await r.setex(`job:${id}`, TTL, JSON.stringify(data));
}

export async function getJob(id: string): Promise<AnalysisResult | null> {
  const r = getRedis();
  const raw = await r.get(`job:${id}`);
  if (!raw) return null;
  return JSON.parse(raw) as AnalysisResult;
}
