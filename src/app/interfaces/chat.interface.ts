export interface Message {
  idChat: number;
  type: 'user' | 'system';
  text: string;
};

export interface Chat {
  id: number;
  idUser: number;
  name: string; 
}