import express, { type Express } from "express";
import cors from "cors";
import pinoHttpModule from "pino-http";
import type { HttpLogger, Options } from "pino-http";
import type { IncomingMessage, ServerResponse } from "http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
type PinoHttpFactory = (
  options?: Options<IncomingMessage, ServerResponse>,
) => HttpLogger<IncomingMessage, ServerResponse>;
const createPinoHttp = pinoHttpModule as unknown as PinoHttpFactory;

app.use(
  createPinoHttp({
    logger,
    serializers: {
      req(req: IncomingMessage) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
