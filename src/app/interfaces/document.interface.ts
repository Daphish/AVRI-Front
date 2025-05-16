// src/app/interfaces/document.interface.ts

/**
 * Representa un documento básico en la lista
 */
export interface Document {
  /** Identificador único */
  id: string; // <--- STRING
  /** Título o nombre del documento */
  title: string;
  /** URI del repositorio donde está alojado */
  repository_uri: string;
  /** ID externa del documento dentro del repositorio institucional */
  repository_id: string; // <--- AÑADIDO Y REQUERIDO
  /** Estado: L = Libre, R = Restringido, E = Embargado */
  status: 'L' | 'R' | 'E';
}

/**
 * Representa un documento con detalles adicionales
 */
export interface DocumentDetail extends Document {
  /** Fecha de creación ISO 8601 */
  created_at: string;
  /** Fecha de última modificación ISO 8601 */
  updated_at: string;
}

/**
 * Representa un documento con los metadatos del repositorio institucional
 */
export interface RepositoryDocument extends Document {
  /** Lista de autores */
  author: string;
  /** Tipo de documento */
  type: string;
  /** Fecha de publicación */
  publication_date: string;
  /** Área de conocimiento externa */
  knowledge_area: string;
  /** Tipo de licencia */
  license: string;
}

/**
 * Representa un documento guardado por un usuario
 */
export interface SavedDocument {
  /** Identificador del registro de guardado */
  id: number; // Este ID es del registro de guardado, no del documento en sí
  /** El documento guardado */
  document: DocumentDetail;
  /** Fecha en que el usuario guardó el documento */
  created_at: string;
}

/**
 * Representa un documento marcado como propio por un usuario
 */
export interface AuthoredDocument {
  /** Identificador del registro de autoría */
  id: number; // Este ID es del registro de autoría
  /** El documento autorado */
  document: DocumentDetail;
  /** Fecha en que se añadió la autoría */
  created_at: string;
}