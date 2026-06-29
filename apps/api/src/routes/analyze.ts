import type { FastifyInstance } from "fastify";
import { v4 as uuid } from "uuid";
import { validateImage } from "../lib/validator.js";
import { Errors } from "../lib/errors.js";
import {
  createAnalysis,
  analyzeImage,
  getAnalysis,
} from "../services/analysis.js";
import type { AnalyzeResponse, AnalyzeDetailResponse } from "@geoai/shared";

export async function analyzeRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/analyze",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send(Errors.invalidImage());
      }

      const buffer = await data.toBuffer();
      const validation = validateImage(data.mimetype, buffer);

      if (!validation.valid) {
        return reply.status(400).send({ error: validation.error });
      }

      const id = uuid();
      await createAnalysis(id);

      // Process async — analyzeImage copies buffer internally, zeros original
      analyzeImage(id, buffer).catch((err) => {
        console.error(`Analysis ${id} failed:`, err);
      });

      const response: AnalyzeResponse = { id, status: "pending" };
      return reply.status(202).send(response);
    }
  );

  app.get("/api/analyze/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await getAnalysis(id);

    if (!result) {
      return reply.status(404).send(Errors.notFound(id));
    }

    const response: AnalyzeDetailResponse = result;
    return reply.send(response);
  });
}
