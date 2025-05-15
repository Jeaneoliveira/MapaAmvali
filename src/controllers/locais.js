const Local = require("../models/local");
exports.getLocais = async (req, res) => {
  try {
    const locais = await Local.findAll();
    res.json(locais);
  } catch (error) {
    res.status(500).json({ error: "erro ao buscar locais" });
  }
};
