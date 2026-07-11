export interface UpdateProfileRequest {
  nom?: string;
  prenom?: string;
  genre?: string;
  adresse?: string;
  description?: string;
  dateNaissance?: string;
  num_Tel?: number;
  anneesExperience?: number;

  linkedin?: string;
  twitter?: string;
  siteweb?: string;

  // Uniquement CANDIDAT / EMPLOYEE
  specialiteEtude?: string;
  universiteEtude?: string;
  niveauEtude?: string;
  cvBase64?: string;

  imageBase64?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}
