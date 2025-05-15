const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM locais"); // sua tabela
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar locais:", error);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

module.exports = router;
