// netlify/functions/pedidos.js
var fs = require("fs");
var path = require("path");
exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    const novoPedido = JSON.parse(event.body);
    novoPedido.id = Date.now().toString();
    const dbPath = path.resolve(__dirname, "db.json");
    const pedidos = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, "utf8")) : [];
    pedidos.push(novoPedido);
    fs.writeFileSync(dbPath, JSON.stringify(pedidos, null, 2));
    return {
      statusCode: 201,
      body: JSON.stringify(novoPedido)
    };
  }
  return {
    statusCode: 405,
    body: JSON.stringify({ error: "M\xE9todo n\xE3o permitido" })
  };
};
//# sourceMappingURL=pedidos.js.map
