const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(express.static("public"));

// Función para generar el Excel en el servidor
app.get("/api/descargar-excel", async (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) return res.status(400).send("Fechas requeridas");

  try {
    // 1. Consumir toda la API
    let allRows = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const url = `https://api.hekaentrega.co/api/v1/shipments/guide?page=${page}&start_date=${start_date}&end_date=${end_date}`;
      const response = await fetch(url, { headers: { "Api-Key": API_KEY } });
      const data = await response.json();
      if (!data.response) break;
      
      totalPages = data.response.pager?.pages || 1;
      allRows = allRows.concat(data.response.rows || []);
      page++;
      await new Promise(r => setTimeout(r, 100)); // Pausita cortesía
    }

    // 2. Transformar a CSV simple (Excel lo abre sin problemas)
    let csvContent = "Guía,Estado,Fecha,Empresa,Remitente,Destinatario,Ciudad Dest.,Transportadora,Tipo Pago,Total,Recaudo\n";
    
    allRows.forEach(row => {
      let estado = row.movemens?.length > 0 ? row.movemens[row.movemens.length - 1].label : "";
      let tipoPago = row.type_payment == 1 ? "CONTRAENTREGA" : (row.type_payment == 2 ? "CONVENCIONAL" : "PAGO A DESTINO");
      let nombreRem = `${row.seller?.name || ""} ${row.seller?.last_name || ""}`;
      let nombreDest = `${row.client?.name || ""} ${row.client?.last_name || ""}`;
      
      // Escapar comillas para que el CSV no se rompa
      const escape = (str) => `"${String(str || "").replace(/"/g, '""')}"`;
      
      csvContent += `${escape(row.guide_number)},${escape(estado)},${escape(row.createdAt)},${escape(row.seller?.company_name)},${escape(nombreRem)},${escape(nombreDest)},${escape(row.city_destination?.label)},${escape(row.distributor_id)},${escape(tipoPago)},${row.total || 0},${row.collection_value || 0}\n`;
    });

    // 3. Enviar archivo al navegador para descarga instantánea
    res.setHeader('Content-Type', 'text/csv; charset=utf-8;');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_${start_date}_a_${end_date}.csv`);
    res.send('\uFEFF' + csvContent); // \uFEFF hace que Excel reconozca los acentos bien

  } catch (error) {
    res.status(500).send("Error generando el archivo");
  }
});

app.listen(PORT, () => console.log("🚀 Servidor Bestia corriendo en puerto " + PORT));
