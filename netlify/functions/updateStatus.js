const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, 'db.json');

exports.handler = async (event) => {
  if (event.httpMethod !== 'PATCH') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { id } = event.queryStringParameters;
  const { status } = JSON.parse(event.body);

  const pedidos = JSON.parse(fs.readFileSync(dbPath));
  const pedido = pedidos.find(p => p.id === id);
  if (!pedido) return { statusCode: 404, body: 'Pedido não encontrado' };

  pedido.status = status;
  fs.writeFileSync(dbPath, JSON.stringify(pedidos, null, 2));

  return { statusCode: 200, body: JSON.stringify(pedido) };
};