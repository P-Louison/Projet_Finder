import { useSyncExternalStore } from "react";

let jetonCourant = null;
const abonnes = new Set();

function notifier() {
  abonnes.forEach((abonne) => abonne());
}

function abonner(abonne) {
  abonnes.add(abonne);
  return () => abonnes.delete(abonne);
}

export function jeton() {
  return jetonCourant;
}

export function useJeton() {
  return useSyncExternalStore(abonner, jeton, () => null);
}

export function setJeton(valeur) {
  if (typeof valeur !== "string" || valeur.length === 0) {
    throw new TypeError("Le jeton de connexion est invalide.");
  }
  jetonCourant = valeur;
  notifier();
}

export function effacerJeton() {
  jetonCourant = null;
  notifier();
}
