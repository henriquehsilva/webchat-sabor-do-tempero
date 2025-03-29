// Estrutura base do projeto RAG para Severino - Garçom Virtual

// 1. Script de ingestão local (scripts/ingest.js)
// Gere embeddings do arquivo .txt e envie para Supabase (ou outro vetor DB)

const fs = require('fs');
const path = require('path');
const openai = require('openai');
const { createClient } = require('@supabase/supabase-js');

openai.apiKey = process.env.VITA_OPENAI_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const file = fs.readFileSync(path.join(__dirname, '../data/severino_contexto_base.txt'), 'utf-8');
  const chunks = file.split(/\n{2,}/).filter(Boolean);

  for (const chunk of chunks) {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk
    });

    const embedding = embeddingResponse.data[0].embedding;

    await supabase.from('severino_contexto').insert({
      texto: chunk,
      embedding
    });
  }

  console.log('Ingestão concluída.');
}

main();

// 2. Função Netlify (netlify/functions/responderSeverino.js)

const openai = require('openai');
const { createClient } = require('@supabase/supabase-js');
openai.apiKey = process.env.VITA_OPENAI_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  const { pergunta } = JSON.parse(event.body);

  // 1. Gera embedding da pergunta
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: pergunta
  });
  const userEmbedding = embeddingResponse.data[0].embedding;

  // 2. Busca similaridade no Supabase
  const { data } = await supabase.rpc('match_severino_contexto', {
    query_embedding: userEmbedding,
    match_threshold: 0.78,
    match_count: 3
  });

  const contexto = data.map(d => d.texto).join('\n\n');

  // 3. Monta prompt
  const messages = [
    {
      role: 'system',
      content: 'Você é o Severino, garçom virtual do Sabor do Tempero. Responda de forma simpática, com jeitinho paulista. Use apenas as informações abaixo para responder.'
    },
    {
      role: 'user',
      content: `Informações relevantes:\n\n${contexto}\n\nPergunta do cliente: ${pergunta}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ resposta: response.choices[0].message.content })
  };
};
