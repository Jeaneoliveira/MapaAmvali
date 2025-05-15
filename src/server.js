const express = require("express");
const path = require("path");
const cors = require("cors");
const locaisRouter = require("./routes/locais");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Rotas
app.use("/api/locais", locaisRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
