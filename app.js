const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// 🔑 API KEY desde Render
const API_KEY = process.env.API_KEY;

app.use(express.json());
app.use(express.static("public"));

app.get("/api/guias", async (req, res) => {
  const { start_date, end_date, page } = req.query;

  const url = `https://api.hekaentrega.co/api/v1/shipments/guide?page=${page}&start_date=${start_date}&end_date=${end_date}`;

  try {
    const response = await fetch(url, {
      headers: { "Api-Key": API_KEY }
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
