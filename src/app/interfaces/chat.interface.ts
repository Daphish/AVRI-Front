// Añadimos el tipo para cada chunk de referencia
export interface ReferenceChunk {
  content: string;
  dataset_id: string;
  document_id: string;
  document_name: string;
  id: string;
  image_id: string;
  positions: number[][];
  url?: string | null;
}

export interface Message {
  fromUser: boolean;
  text: string;
  // Nuevo campo para las referencias
  references?: ReferenceChunk[];
}

export interface Chat {
  session_id: string;
  session_name: string;
  user: number;
}

// Extendemos RawMessage para capturar el objeto 'reference' del /ask/
export interface RawMessage {
  answer?:   string;
  content?:  string;
  text?:     string;
  query?:    string;
  from_user: boolean;
  // Nuevo: para respuestas de /ask/
  reference?: {
    chunks: ReferenceChunk[];
    doc_aggs: any[];
  };
}
