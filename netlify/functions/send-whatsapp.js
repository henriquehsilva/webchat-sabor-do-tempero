export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { phone, message } = JSON.parse(event.body);

    const zapiToken = process.env.ZAPI_TOKEN;
    const zapiInstance = process.env.ZAPI_INSTANCE;

    const url = `https://api.z-api.io/instances/${zapiInstance}/send-text`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': zapiToken
      },
      body: JSON.stringify({
        phone,
        message
      })
    });

    const data = await response.json();

    if (response.ok && data.message === 'Message sent successfully') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data })
      };
    } else {
      return {
        statusCode: response.status,
        body: JSON.stringify({ success: false, data })
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}