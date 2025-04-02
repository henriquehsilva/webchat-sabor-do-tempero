import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase"; // caminho correto

const testSaveOrder = async () => {
  try {
    const docRef = await addDoc(collection(db, "pedidos"), {
      userId: 'teste',
      message: 'Quero uma feijoada e um suco!',
      createdAt: Timestamp.now(),
    });
    console.log("Pedido salvo com ID:", docRef.id);
  } catch (e) {
    console.error("Erro ao salvar pedido:", e);
  }
};

testSaveOrder();
