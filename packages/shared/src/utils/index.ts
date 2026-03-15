// ---------------------------------------------------------------------------
// Funcoes utilitarias partilhadas do Eat Out Adviser
// ---------------------------------------------------------------------------

import type { TrafficLightRating } from "../types/index.js";
import { SCORE_LABELS, TRAFFIC_LIGHT_THRESHOLDS } from "../constants/index.js";

/**
 * Gera um slug em kebab-case a partir de um nome.
 * Remove acentos, caracteres especiais e converte para minusculas.
 */
export function generateSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Formata uma pontuacao (0-100) para a etiqueta descritiva em portugues.
 *
 * @param score - Pontuacao entre 0 e 100.
 * @returns Etiqueta descritiva (ex.: "Excelente", "Bom", "Inacessivel").
 */
export function formatScore(score: number): string {
  const clamped = clamp(score, 0, 100);
  const label = SCORE_LABELS.find((l) => clamped >= l.min && clamped <= l.max);
  return label?.labelPt ?? "Desconhecido";
}

/**
 * Converte uma pontuacao (0-100) para a classificacao semaforo.
 *
 * @param score - Pontuacao entre 0 e 100.
 * @returns "green" (>= 70), "yellow" (>= 40) ou "red" (< 40).
 */
export function getTrafficLight(score: number): TrafficLightRating {
  const clamped = clamp(score, 0, 100);
  if (clamped >= TRAFFIC_LIGHT_THRESHOLDS.green) return "green";
  if (clamped >= TRAFFIC_LIGHT_THRESHOLDS.yellow) return "yellow";
  return "red";
}

/**
 * Calcula a distancia em quilometros entre dois pontos geograficos
 * usando a formula de Haversine.
 *
 * @param lat1 - Latitude do primeiro ponto (graus).
 * @param lng1 - Longitude do primeiro ponto (graus).
 * @param lat2 - Latitude do segundo ponto (graus).
 * @param lng2 - Longitude do segundo ponto (graus).
 * @returns Distancia em quilometros.
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const EARTH_RADIUS_KM = 6371;

  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Restringe um valor numerico a um intervalo [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
