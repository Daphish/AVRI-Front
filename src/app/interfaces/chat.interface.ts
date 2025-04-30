export interface Message {
  fromUser: boolean;
  text: string;
}

export interface Chat {
  session_id: string;
  session_name: string;
  user: number;
}

export interface RawMessage {
  answer?:  string;
  text?:    string;
  content?: string;
  query?:   string;
  from_user: boolean;
}
