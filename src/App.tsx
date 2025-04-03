import React, { useState, useRef, useEffect } from 'react';
import { ChefHat, Send, Utensils } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import { useKeenSlider } from 'keen-slider/react';
import QRCode from 'react-qr-code';
import severinoAvatar from '/severino.png';
import severinoSystemPrompt from '../prompts/severinoPrompt';
import 'react-medium-image-zoom/dist/styles.css';
import 'keen-slider/keen-slider.min.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: "AIzaSyD9_vta323kgL_1zBVwrvVaLdNzPIZjyA4",
	authDomain: "sabor-do-tempero.firebaseapp.com",
	projectId: "sabor-do-tempero",
	storageBucket: "sabor-do-tempero.firebasestorage.app",
	messagingSenderId: "372714924053",
	appId: "1:372714924053:web:3c82f804d809a06f2e061c",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  type?: 'text' | 'menu';
  image?: string;
}

interface Pedido {
  nome: string;
  telefone: string;
  endereco: string;
  retirada: boolean;
  prato: string;
  quantidade: number;
  pagamento: string;
  taxaEntrega: number;
  total: number;
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
  const [showImage, setShowImage] = useState(false);
  const [pedido, setPedido] = useState<Partial<Pedido>>({});
  const [coletandoPedido, setColetandoPedido] = useState(false);
  const [confirmandoPedido, setConfirmandoPedido] = useState(false);


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
  
    const lower = inputMessage.toLowerCase();
  
    if (!coletandoPedido && lower.includes('fazer pedido')) {
      setColetandoPedido(true);
      return botReply("Vamos lá! Qual seu nome completo?");
    }
  
    if (coletandoPedido && !pedido.nome) {
      setPedido(prev => ({ ...prev, nome: inputMessage }));
      return botReply("Qual seu telefone com DDD?");
    } else if (coletandoPedido && !pedido.telefone) {
      setPedido(prev => ({ ...prev, telefone: inputMessage }));
      return botReply("Qual seu endereço completo? (ou diga 'retirada' se for buscar no local)");
    } else if (coletandoPedido && !pedido.endereco && !pedido.retirada) {
      if (lower.includes('retirada')) {
        setPedido(prev => ({ ...prev, retirada: true, endereco: '' }));
      } else {
        setPedido(prev => ({ ...prev, endereco: inputMessage, retirada: false }));
      }
      return botReply("Qual opção de prato? (Ex: Opção 1 ou 2)");
    } else if (coletandoPedido && !pedido.prato) {
      const diaSemanaCompleto = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        timeZone: 'America/Sao_Paulo'
      }).toLowerCase();
  
      const mapaDias: { [key: string]: string } = {
        'segunda-feira': 'segunda',
        'terça-feira': 'terca',
        'quarta-feira': 'quarta',
        'quinta-feira': 'quinta',
        'sexta-feira': 'sexta',
        'sábado': 'sabado',
        'domingo': 'domingo'
      };
  
      const diaSemana = mapaDias[diaSemanaCompleto] || 'dia';
  
      // Mapear opções para nomes dos pratos
      const cardapio: { [key: string]: { [key: string]: string } } = {
        segunda: {
          '1': 'Vaca atolada',
          '2': 'Coxas de frango assadas com batatas'
        },
        terca: {
          '1': 'Lombo de porco assado',
          '2': 'Frango à crioula'
        },
        quarta: {
          '1': 'File de frango a parmegiana',
          '2': 'Isca de carne grelhada'
        },
        quinta: {
          '1': 'Rabada ao molho de tomate cassê',
          '2': 'Isca de frango empanada'
        },
        sexta: {
          '1': 'Lagarto recheado',
          '2': 'Frango ao molho caipira'
        },
        sabado: {
          '1': 'Feijoada completa'
        }
      };
  
      const opcaoDigitada = inputMessage.trim();
      const pratoSelecionado = cardapio[diaSemana]?.[opcaoDigitada];
  
      if (!pratoSelecionado) {
        return botReply("Opção inválida. Responda com 1 ou 2, conforme o cardápio do dia.");
      }
  
      setPedido(prev => ({ ...prev, prato: pratoSelecionado }));
      return botReply("Quantas unidades deseja?");
    } else if (coletandoPedido && !pedido.quantidade) {
      const qtd = parseInt(inputMessage);
      if (!isNaN(qtd)) {
        setPedido(prev => ({ ...prev, quantidade: qtd }));
        return botReply("Qual a forma de pagamento? (PIX, Cartão, Dinheiro)");
      } else {
        return botReply("Por favor, informe a quantidade como número.");
      }
    } else if (coletandoPedido && !pedido.pagamento) {
      setPedido(prev => ({ ...prev, pagamento: inputMessage }));
      setConfirmandoPedido(true);
      return botReply("Posso fechar o pedido com essas informações? (sim/não)");
    }
  
    if (confirmandoPedido && lower.includes('sim')) {
      let taxaEntrega = 0;
      if (!pedido.retirada) {
        taxaEntrega = pedido.endereco?.toLowerCase().includes('esplanada') ? 5 : 0;
      }
      
      const total = 23 * (pedido.quantidade || 1) + taxaEntrega;
      const dataHora = new Date().toISOString();

      const pedidoFinal = {
        ...pedido,
        taxaEntrega,
        total,
        criadoEm: dataHora,
        status: 'pedido feito'
      } as Pedido & { criadoEm: string; status: string };

      await addDoc(collection(db, 'pedidos'), pedidoFinal);
      setPedido({});
      setColetandoPedido(false);
      setConfirmandoPedido(false);

      return botReply(
        `Pedido confirmado!\n\n📦 Resumo do pedido:\n- Nome: ${pedidoFinal.nome}\n- Telefone: ${pedidoFinal.telefone}\n- ${pedidoFinal.retirada ? 'Retirada no local' : `Entrega: ${pedidoFinal.endereco}`}\n- Prato: ${pedidoFinal.prato}\n- Quantidade: ${pedidoFinal.quantidade}\n- Pagamento: ${pedidoFinal.pagamento}\n- Taxa de entrega: R$ ${pedidoFinal.taxaEntrega.toFixed(2)}\n- Total: R$ ${pedidoFinal.total.toFixed(2)}\n- Data/Hora: ${new Date(pedidoFinal.criadoEm).toLocaleString('pt-BR')}`
      );
    } else if (confirmandoPedido && lower.includes('não')) {
      setPedido({});
      setColetandoPedido(false);
      setConfirmandoPedido(false);
      return botReply("Pedido cancelado. Se quiser recomeçar, é só digitar 'fazer pedido'.");
    }
  
    const diaSemanaCompleto = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      timeZone: 'America/Sao_Paulo'
    }).toLowerCase();
  
    const mapaDias: { [key: string]: string } = {
      'segunda-feira': 'segunda',
      'terça-feira': 'terca',
      'quarta-feira': 'quarta',
      'quinta-feira': 'quinta',
      'sexta-feira': 'sexta',
      'sábado': 'sabado',
      'domingo': 'domingo'
    };
  
    const diaSemana = mapaDias[diaSemanaCompleto] || 'dia';
  
    const botReplyText = await sendToGPT(inputMessage, [...messages, userMessage], diaSemana);
  
    const botMessage: Message = {
      id: messages.length + 2,
      text: botReplyText,
      sender: 'bot'
    };
  
    setMessages(prev => [...prev, botMessage]);
  };

  const botReply = (text: string) => {
    const botMessage: Message = {
      id: messages.length + 2,
      text,
      sender: 'bot'
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const sendToGPT = async (userMessage: string, history: Message[], diaSemana: string) => {
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
              content: severinoSystemPrompt.replace('{{DIA_DA_SEMANA}}', diaSemana.toUpperCase())
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
    return message.text;
  };

  const diaSemanaCompleto = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    timeZone: 'America/Sao_Paulo'
  }).toLowerCase();

  const mapaDias: { [key: string]: string } = {
    'segunda-feira': 'segunda',
    'terça-feira': 'terca',
    'quarta-feira': 'quarta',
    'quinta-feira': 'quinta',
    'sexta-feira': 'sexta',
    'sábado': 'sabado',
    'domingo': 'domingo'
  };

  const diaSemana = mapaDias[diaSemanaCompleto] || 'dia';
  const imageUrl = `https://sabordotempero.com.br/cardapio/${diaSemana}.jpeg`;

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
            return (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}
              >
                {message.sender === 'bot' && (
                  <img
                    src={severinoAvatar}
                    alt="Severino"
                    className="w-10 h-10 rounded-full border border-black/20 shadow mr-2 mt-1"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.5))' }}
                  />
                )}

                <div className={`max-w-xs`}>
                  <div
                    className={`px-4 py-2 rounded-lg shadow whitespace-pre-line break-words ${message.sender === 'user' ? 'bg-primary text-white text-right' : 'bg-white text-black text-left'}`
                    }
                    style={{ wordBreak: 'normal', overflowWrap: 'break-word', maxWidth: '100%' }}
                  >
                    {renderMessage(message)}
                  </div>
                </div>
              </div>
            );
          })}

          {showImage && (
            <div className="flex justify-start">
              <Zoom>
                <img
                  src={imageUrl}
                  alt="Imagem do cardápio do dia"
                  className="w-full rounded-lg shadow cursor-zoom-in max-w-xs"
                />
              </Zoom>
            </div>
          )}
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
