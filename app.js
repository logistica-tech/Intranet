const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(express.static("public"));

// Pequeña función de pausa para no saturar a Heka (100ms es nada para Render)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

app.get("/api/guias", async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: "Fechas requeridas" });
  }

  let allRows = [];
  let page = 1;
  let totalPages = 1;

  try {
    // EL SERVIDOR HACE EL TRABAJO DURO AQUÍ
    while (page <= totalPages) {
      const url = `https://api.hekaentrega.co/api/v1/shipments/guide?page=${page}&start_date=${start_date}&end_date=${end_date}`;
      
      const response = await fetch(url, {
        headers: { "Api-Key": API_KEY }
      });

      const data = await response.json();

      if (!data.response || !data.response.rows) break;

      totalPages = data.response.pager?.pages || 1;

      // Mapeamos la data al vuelo para enviar un JSON ligero al frontend
      data.response.rows.forEach(row => {
        let estado = "";
        if (row.movemens && row.movemens.length > 0) {
          estado = row.movemens[row.movemens.length - 1].label || "";
        }

        let tipoPago = "";
        if (row.type_payment == 1) tipoPago = "PAGO CONTRAENTREGA";
        else if (row.type_payment == 2) tipoPago = "CONVENCIONAL";
        else if (row.type_payment == 3) tipoPago = "PAGO A DESTINO";

        allRows.push([
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
        ]);
      });

      page++;
      
      // Pausa de 100ms solo para ser amables con el servidor de Heka
      if (page <= totalPages) await delay(100); 
    }

    // ¡Listo! Le enviamos el paquete completo al navegador de una sola vez
    res.json({ ok: true, rows: allRows });

  } catch (error) {
    console.error("Error en el backend:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo súper rápido en el puerto " + PORT);
});
