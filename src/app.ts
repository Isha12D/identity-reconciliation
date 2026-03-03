import express from "express";
import cors from "cors";
import identifyRoutes from "./routes/identify.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/identify", identifyRoutes);

export default app;