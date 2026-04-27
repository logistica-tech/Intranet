const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/api/guias", async (req, res) => {

  const { start_date, end_date, page } = req.query;

  const url = `https://api.hekaentrega.co/api/v1/shipments/guide?page=${page}&start_date=${start_date}&end_date=${end_date}`;

  try {
    const response = await fetch(url, {
      headers: { "Api-Key": "TU_API_KEY_AQUI" }
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }

});

app.listen(PORT, () => console.log("Servidor listo"));
