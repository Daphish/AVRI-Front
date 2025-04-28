export interface User {
  email?: string;
  password?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  education_level?: string;
  field_of_study?: number | null;
  is_anonymous?: boolean;
  anonymous_id?: string;
}

export interface AuthToken {
  email: string;
  password: string;
}

export interface AnonymousAuthToken {
  anonymous_id: string;
}

/* export interface User {
    id: number;
    email: string;
    password: string;
    name: string;
    first_name: string;
    last_name: string;
    education_level: string;
    field_of_study: string;
} */
