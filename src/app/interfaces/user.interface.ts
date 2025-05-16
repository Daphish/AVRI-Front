// src/app/interfaces/user.interface.ts
export interface User {
  id: number;
  email: string;
  // password?: string; // Se elimina, no debe venir del backend en /me/
  name: string; // Nombre completo o username que envíe el backend
  first_name: string;
  last_name: string;
  education_level: string;
  field_of_study: string;
  profile_preferences_set?: boolean; // Para el estado del perfilamiento
}

export interface AnonymousUser {
  anonymous_id: string; // Único campo necesario para identificar anónimos
}