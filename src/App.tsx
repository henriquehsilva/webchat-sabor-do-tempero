import React, { useState, useRef, useEffect } from 'react';
import { ChefHat, Send, Utensils } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import { useKeenSlider } from 'keen-slider/react';
import QRCode from 'react-qr-code';
import severinoAvatar from '/severino.png';
import 'react-medium-image-zoom/dist/styles.css';
import 'keen-slider/keen-slider.min.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  type?: 'text' | 'menu' | 'pix';
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Olá! Eu sou o Severino. Posso anotar seu pedido?",
      sender: 'bot'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: false,
    slides: {
      perView: 1,
      spacing: 16,
    },
    breakpoints: {
      '(min-width: 640px)': {
        slides: { perView: 2, spacing: 24 },
      },
      '(min-width: 1024px)': {
        slides: { perView: 3, spacing: 32 },
      },
    },
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Verifica se é solicitação de pagamento
    const isPixTest = inputMessage.toLowerCase().includes('teste pix');

    if (isPixTest) {
      const botMessage: Message = {
        id: messages.length + 2,
        text: 'pix-test',
        sender: 'bot',
        type: 'pix'
      };
      setMessages(prev => [...prev, botMessage]);
      return;
    }

    const botReplyText = await sendToGPT(inputMessage, [...messages, userMessage]);

    const botMessage: Message = {
      id: messages.length + 2,
      text: botReplyText,
      sender: 'bot'
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const sendToGPT = async (userMessage: string, history: Message[]) => {
    const formattedMessages = history.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Você é o Severino, garçom virtual do restaurante Sabor do Tempero.
Seu jeito é simpático, direto e acolhedor, como um bom atendente de restaurante popular.
Fale como um paulistano simples e prestativo, usando expressões como “beleza?”, “pode deixar”, “já te ajudo”, “tamo junto”.

**Informações importantes que você deve seguir sempre:**

- Você atende clientes de **Rio Quente - GO** e região.
- Se o cliente estiver **em Rio Quente**, não há taxa de entrega.
- Se for **fora de Rio Quente**, a entrega tem taxa fixa de **R$ 5,00**. Informe isso de forma gentil.
- O valor da **marmita é fixo: R$ 23,00**.
- Hoje o cardápio do dia é:
  - Arroz branco
  - Feijão caseiro
  - Frango grelhado OU bife acebolado
  - Farofa da casa
  - Salada simples (alface, tomate e cenoura)
- Você pode sugerir o cardápio e informar os valores.
- Caso o cliente pergunte sobre outra cidade fora da área, informe que por enquanto só atendemos Rio Quente e região próxima, mas que estamos crescendo.
- A cozinheira é a Dona Fatima, que faz tudo com muito carinho e amor.
- Caso queira buscar a marmita, informe que o local é na Alameda da Garças, Qd. 17, Lt. 13, Fauna I - Rio Quente/GO, e que o horário de funcionamento é das 11h às 15h.
- Se o cliente falar que pode fechar o pedido, entenda que ele quis dizer teste pix.
- Se o cliente perguntar sobre o valor do prato, informe que o valor é de R$ 23,00.
**Nunca invente informações que não estão acima.**

Se o cliente disser “oi”, “bom dia”, “quero pedir”, “me manda o cardápio”, responda com simpatia e reforce o valor da marmita e o cardápio do dia.

Sempre incentive o cliente a fazer o pedido.`
            },
            ...formattedMessages,
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? 'Desculpe, não entendi sua solicitação.';
    } catch (error) {
      console.error('Erro ao consultar GPT:', error);
      return 'Ops! Algo deu errado ao tentar conversar com o Severino.';
    }
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'menu') {
      const menuItems = JSON.parse(message.text);
      return (
        <div className="message-bubble bg-white text-black rounded-lg shadow p-2 max-w-full">
          <div ref={sliderRef} className="keen-slider">
            {menuItems.map((item: any, index: number) => (
              <div
                key={index}
                className="keen-slider__slide bg-white rounded-lg overflow-hidden shadow-md"
              >
                <Zoom>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover cursor-zoom-in rounded-t-lg"
                  />
                </Zoom>
                <div className="p-4">
                  <h3 className="font-bold text-text">{item.name}</h3>
                  <p className="text-primary font-medium">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (message.type === 'pix') {
      const pixPayload = `00020126360014BR.GOV.BCB.PIX01119040684219152040000530398654040.015802BR5925Sabor do Tempero Teste6009Rio Quente62200515***6304`;
      return (
        <div className="bg-white text-black rounded-lg shadow p-4">
          <p className="mb-2 font-bold text-red-600">⚠️ Este é um teste! Não pague este Pix, ou será cobrado R$ 0,01.</p>
          <QRCode value={pixPayload} size={256} />
          <p className="mt-2 text-center text-sm">Pix Copia e Cola:<br /><span className="break-words text-xs">{pixPayload}</span></p>
        </div>
      );
    }

    return message.text;
  };

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-3xl mx-auto h-screen flex flex-col">
        <header className="bg-primary p-4 rounded-b-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <ChefHat size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white">Sabor do Tempero</h1>
          </div>
          <p className="text-white/80 text-sm mt-1">Comida caseira autêntica entregue na sua porta.</p>
        </header>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 chat-container">
          {messages.map(message => {
            const isMenu = message.type === 'menu';

            return (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}
              >
                {message.sender === 'bot' && !isMenu && (
                  <img
                    src={severinoAvatar}
                    alt="Severino"
                    className="w-10 h-10 rounded-full border border-black/20 shadow mr-2 mt-1"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.5))' }}
                  />
                )}

                <div className={`${isMenu ? 'w-full' : 'max-w-xs'}`}>
                  {isMenu ? (
                    <div className="w-full">{renderMessage(message)}</div>
                  ) : (
                    <div
                      className={`px-4 py-2 rounded-lg shadow whitespace-pre-line break-words ${message.sender === 'user' ? 'bg-primary text-white text-right' : 'bg-white text-black text-left'}`}
                      style={{ wordBreak: 'normal', overflowWrap: 'break-word', maxWidth: '100%' }}
                    >
                      {renderMessage(message)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-white/5 backdrop-blur-sm">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInputMessage('Mostrar cardápio do dia');
                setTimeout(handleSend, 100);
              }}
              className="p-2 rounded-full bg-secondary text-dark hover:bg-highlight transition-colors"
            >
              <Utensils size={24} />
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2 rounded-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSend}
              className="p-2 rounded-full bg-primary text-white hover:bg-highlight transition-colors"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
