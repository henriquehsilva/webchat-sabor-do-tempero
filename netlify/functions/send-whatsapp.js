export async function handler(event) {
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, body: 'Method Not Allowed' };
	}

	try {
		const { phone, message } = JSON.parse(event.body);

		const zapiToken = process.env.ZAPI_TOKEN;
		const zapiInstance = process.env.ZAPI_INSTANCE;

		const response = await fetch(`https://api.z-api.io/instances/${zapiInstance}/send-messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Client-Token': zapiToken, 
			},
			body: JSON.stringify({
				phone: phone,
				message: message
			})
		});

		const data = await response.json();

		if (response.ok) {
			return { statusCode: 200, body: JSON.stringify({ success: true, data }) };
		} else {
			return { statusCode: response.status, body: JSON.stringify({ error: data }) };
		}

	} catch (error) {
		return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
	}
}
//   curl -X POST https://chat.sabordotempero.com.br/.netlify/functions/send-whatsapp \
//   -H "Content-Type: application/json" \
//   -d '{"phone":"5562985849729", "message":"Mensagem teste Severino"}'