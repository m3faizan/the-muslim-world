import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const PgSession = connectPgSimple(session);

const app: Express = express();

// Trust the first proxy hop (Replit's reverse proxy terminates HTTPS).
// Required so express-session will set Secure cookies even though Express
// itself is reached over plain HTTP internally.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In the Replit environment (dev or prod) the app is always served over HTTPS
// via the shared proxy and may be embedded in an iframe (cross-site context),
// so cookies must be SameSite=None; Secure regardless of NODE_ENV.
const isReplitEnv = !!process.env.REPLIT_DOMAINS;
const needsSecureCookie = process.env.NODE_ENV === "production" || isReplitEnv;

app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: needsSecureCookie,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: needsSecureCookie ? "none" : "lax",
    },
  }),
);

app.use("/api", router);

export default app;
