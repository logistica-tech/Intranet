const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/api/guias", async (req, res) => {

  const { start_date, end_date, page } = req.query;

  const url = `https://api.hekaentrega.co/api/v1/shipments/guide?page=${page}&start_date=${start_date}&end_date=${end_date}`;

  try {
    const response = await fetch(url, {
      headers: { "Api-Key": "4119b22963cd34982cba2762c73e833967e53277d0e79fd914ca22e9e4840f9b" }
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }

});

app.listen(PORT, () => console.log("Servidor listo"));
