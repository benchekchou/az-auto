export type Carburant = 'Essence' | 'Diesel' | 'Hybride' | 'Électrique' | 'GPL';
export type Transmission = 'Manuelle' | 'Automatique';
export type Statut = 'Disponible' | 'Réservé' | 'Vendu';

export const CARBURANTS: Carburant[] = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
export const TRANSMISSIONS: Transmission[] = ['Manuelle', 'Automatique'];
export const STATUTS: Statut[] = ['Disponible', 'Réservé', 'Vendu'];

export interface Car {
  id: string;
  marque: string;
  modele: string;
  annee: number;
  prix: number;
  kilometrage: number;
  carburant: Carburant;
  transmission: Transmission;
  couleur?: string;
  description?: string;
  statut: Statut;
  photos: string[];
  createdAt: string;
}

export type CarInput = Omit<Car, 'id' | 'createdAt'>;
