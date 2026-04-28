const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(express.static("public"));

app.get("/api/guias", async (req, res) => {
  const { start_date, end_date, page } = req.query;
  const url = `https://api.hekaentrega.co/api/v1/shipments/guide?page=${page}&start_date=${start_date}&end_date=${end_date}`;

  try {
    // Seguro de 10 segundos: si Heka no responde, cancela para evitar el 502 de Render
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: { "Api-Key": API_KEY },
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!data.response) {
      return res.json({ ok: false, error: "Sin datos en esta página" });
    }

    const totalPages = data.response.pager?.pages || 1;

    const cleanRows = (data.response.rows || []).map(row => {
      let estado = "";
      if (row.movemens && row.movemens.length > 0) {
        estado = row.movemens[row.movemens.length - 1].label || "";
      }
      let tipoPago = "";
      if (row.type_payment == 1) tipoPago = "PAGO CONTRAENTREGA";
      else if (row.type_payment == 2) tipoPago = "CONVENCIONAL";
      else if (row.type_payment == 3) tipoPago = "PAGO A DESTINO";

      return [
        row.guide_number || "", estado, row.createdAt,
        row.seller?.company_name || "",
        (row.seller?.name || "") + " " + (row.seller?.last_name || ""),
        (row.client?.name || "") + " " + (row.client?.last_name || ""),
        row.city_destination?.label || "", row.distributor_id || "",
        tipoPago, row.total || 0, row.collection_value || 0
      ];
    });

    res.json({ ok: true, totalPages: totalPages, rows: cleanRows });

  } catch (error) {
    // Si falla por el límite de 10 segundos, avisa para que el frontend salte la página
    res.json({ ok: false, error: "Timeout" });
  }
});

app.listen(PORT, () => console.log("Servidor corriendo en puerto " + PORT));
