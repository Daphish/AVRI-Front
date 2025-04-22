export interface Chat {
  session_id: string;
  session_name: string;
  user: number;
}

export interface Message {
  id: string;
  session_id: string;
  type: 'user' | 'system';
  text: string;
  created_at?: string;
}
