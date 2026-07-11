export interface UserSession {
  id: number;
  email: string;
  role: string;
  nom: string;
  prenom: string;
  profileComplete?: boolean;
}
