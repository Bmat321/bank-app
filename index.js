import express from "express";
import usersRouter from "./routes/users.js";

import authRouter from "./routes/auth.js";

import cookieParser from "cookie-parser";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

const app = express();
// Middleware

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use(express.json());

app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

app.listen(process.env.PORT, () => {
  console.log("APP IS WORING");
});
