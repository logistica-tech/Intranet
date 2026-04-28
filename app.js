const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(express.static("public"));

app.get("/api/guias", async (req, res) => {
  const { start_date, end_date, page } = req.query;
  const url = `https://api.hekaentrega.co/api/v1/shipments/guide?page=${page}&start_date=${start_date}&end_date=${end_date}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: { "Api-Key": API_KEY },
      signal: controller.signal
    });

    clearTimeout(timeout);

    const rawText = await response.text();

    if (!rawText.startsWith('{')) {
      return res.status(500).json({ ok: false, error: "Respuesta inválida de Heka" });
    }

    const data = JSON.parse(rawText);

    if (!data.response) {
      return res.json({ ok: false, error: "Sin datos" });
    }

    const totalPages = data.response.pager?.pages || 1;
    const rows = data.response.rows || [];

    const cleanRows = rows.map(row => {
      const mov = row.movemens;
      const estado = (mov && mov.length > 0) ? (mov[mov.length - 1].label || "") : "";

      let tipoPago = "";
      if (row.type_payment == 1) tipoPago = "PAGO CONTRAENTREGA";
      else if (row.type_payment == 2) tipoPago = "CONVENCIONAL";
      else if (row.type_payment == 3) tipoPago = "PAGO A DESTINO";

      return [
        row.guide_number || "",
        estado,
        row.createdAt,
        row.seller?.company_name || "",
        (row.seller?.name || "") + " " + (row.seller?.last_name || ""),
        (row.client?.name || "") + " " + (row.client?.last_name || ""),
        row.city_destination?.label || "",
        row.distributor_id || "",
        tipoPago,
        row.total || 0,
        row.collection_value || 0
      ];
    });

    // Liberar referencia pesada antes de responder
    data.response.rows = null;

    res.json({ ok: true, totalPages, rows: cleanRows });

  } catch (error) {
    res.json({ ok: false, error: "Timeout o error de red" });
  }
});

app.listen(PORT, () => console.log("Servidor corriendo en puerto " + PORT));
