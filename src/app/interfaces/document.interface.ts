export interface Document {
  id: string;
  title: string;
  repository_uri: string;
  repository_id: string;
  status: 'L' | 'R' | 'E';
}

export interface DocumentDetail extends Document {
  created_at: string;
  updated_at: string;
}

export interface RepositoryDocument extends Document {
  author: string;
  type: string;
  publication_date: string;
  knowledge_area: string;
  license: string;
}

export interface SavedDocument {
  id: number;
  document: DocumentDetail;
  created_at: string;
}

export interface AuthoredDocument {
  id: number;
  document: DocumentDetail;
  created_at: string;
}
