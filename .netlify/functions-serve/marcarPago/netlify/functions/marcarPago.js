// netlify/functions/marcarPago.js
exports.handler = async (event) => {
  if (event.httpMethod !== "PATCH") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const fs = require("fs");
  const path = require("path");
  const dbPath = path.resolve(__dirname, "db.json");
  const { id } = event.queryStringParameters;
  const pedidos = JSON.parse(fs.readFileSync(dbPath));
  const pedido = pedidos.find((p) => p.id === id);
  if (!pedido)
    return { statusCode: 404, body: "Pedido n\xE3o encontrado" };
  pedido.pago = true;
  fs.writeFileSync(dbPath, JSON.stringify(pedidos, null, 2));
  return { statusCode: 200, body: JSON.stringify(pedido) };
};
//# sourceMappingURL=marcarPago.js.map
