export interface ChatSession {
  session_id: string;
  session_name: string;
}

export interface RawChatMessage {
  data: {
    answer: string;
    reference: {
      doc_aggs?: {
        doc_id: string;
        doc_name: string;
      }[];
    };
    session_id: string;
  };
}

export interface ChatMessage {
  content: string;
  role: string;
  reference?: {
    document_id: string;
    document_name: string;
  }[];
}
