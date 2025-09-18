// src/app/interfaces/user.interface.ts
export interface User {
  id: number;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  education_level: string;
  field_of_study: string;
  profile_preferences_set?: boolean;
}

export interface AnonymousUser {
  anonymous_id: string;
}
