import { RawChatMessage, ChatMessage } from '../interfaces/chat.interface';

export function makeMessage(message: string): ChatMessage {
    return {
        content: message,
        role: 'user',
    }
}

export function parseMessage(message: RawChatMessage): ChatMessage {
  return {
    content: message.answer,
    role: 'assistant',
    reference: message.reference.doc_aggs.map((doc) => ({
        document_id: doc.doc_id,
        document_name: doc.doc_name,
    }))
  };
}
