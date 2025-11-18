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

export interface Documents {
  id: string;
  title: string;
  author: string;
  publication_date: string;
  knowledge_area: string;
  license: string;
  repository_uri: string;
  repository_id: string;
  status: "L" | "R" | "E";
  created_at: string;
  updated_at: string;
}

export interface Message {
  fromUser: boolean;
  text: string;
  html?: any; // SafeHtml from DomSanitizer
  references?: Documents[];
  isLoading?: boolean;
}

export interface Chat {
  session_id: string;
  session_name: string;
  user: number;
}

export interface RawMessage {
  answer?: string;
  content?: string;
  text?: string;
  query?: string;
  from_user: boolean;
  reference?: {
    chunks: ReferenceChunk[];
    doc_aggs: any[];
  };
}
