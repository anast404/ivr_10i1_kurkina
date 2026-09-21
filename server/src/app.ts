import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/auth";
import familyRoutes from "./routes/family";
import pillRoutes from "./routes/pill";
import plantRoutes from "./routes/plant";
import shoppingRoutes from "./routes/shopping";
import userRoutes from "./routes/user";

dotenv.config();

const app = express();
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/pill", pillRoutes);
app.use("/api/plant", plantRoutes);
app.use("/api/shopping", shoppingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
