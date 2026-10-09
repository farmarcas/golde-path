import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
app.use(cors());

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ api: "ok", db: "ok" });
  } catch (err) {
    res.status(503).json({ api: "ok", db: "erro", detalhe: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API rodando na porta ${port}`));
