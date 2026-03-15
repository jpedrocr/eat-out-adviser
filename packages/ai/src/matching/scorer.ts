/**
 * Calculo da pontuacao de compatibilidade entre um utilizador e um restaurante.
 *
 * Gera uma pontuacao 0-100 com base nas necessidades de acessibilidade
 * do utilizador e nas caracteristicas fisicas do restaurante.
 */

import type { AccessibilityProfile, UserAccessibilityProfile } from "@eat-out-adviser/shared";

import { getWeightsForMobilityType } from "./weights.js";

/** Resultado detalhado do calculo de pontuacao. */
export interface MatchScoreResult {
  /** Pontuacao final ponderada (0-100). */
  overall: number;
  /** Pontuacao por categoria (0-100 cada). */
  categories: {
    entrance: number;
    parking: number;
    interior: number;
    seating: number;
    bathroom: number;
    communication: number;
  };
  /** Pesos utilizados no calculo (dependem do tipo de mobilidade). */
  weights: Record<string, number>;
  /** Problemas criticos que penalizam a pontuacao. */
  criticalIssues: string[];
}

/**
 * Avalia a pontuacao da entrada do restaurante (0-100).
 */
function scoreEntrance(
  profile: AccessibilityProfile,
  user: UserAccessibilityProfile,
): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  let factors = 0;

  // Entrada acessivel (entrada sem degraus ou com rampa)
  if (profile.hasAccessibleEntrance !== null) {
    factors++;
    if (profile.hasAccessibleEntrance) {
      score += 100;
    } else {
      issues.push("Entrada nao acessivel.");
    }
  }

  // Entrada ao nivel do chao
  if (profile.hasLevelEntrance !== null) {
    factors++;
    if (profile.hasLevelEntrance) {
      score += 100;
    }
  }

  // Rampa de acesso
  if (profile.hasRamp !== null) {
    factors++;
    if (profile.hasRamp) {
      let rampScore = 80;
      if (profile.rampHasHandrails) rampScore += 10;
      if (
        profile.rampIncline !== null &&
        user.maxRampIncline !== null &&
        profile.rampIncline <= user.maxRampIncline
      ) {
        rampScore += 10;
      } else if (
        profile.rampIncline !== null &&
        user.maxRampIncline !== null &&
        profile.rampIncline > user.maxRampIncline
      ) {
        rampScore = 30;
        issues.push(
          `Inclinacao da rampa (${String(profile.rampIncline)}%) excede o limite do utilizador (${String(user.maxRampIncline)}%).`,
        );
      }
      score += Math.min(rampScore, 100);
    }
  }

  // Largura da porta de entrada
  if (profile.entranceDoorWidth !== null) {
    factors++;
    if (user.wheelchairWidth !== null) {
      const clearance = profile.entranceDoorWidth - user.wheelchairWidth;
      if (clearance >= 15) {
        score += 100;
      } else if (clearance >= 5) {
        score += 70;
      } else if (clearance >= 0) {
        score += 40;
        issues.push("Largura da porta de entrada muito justa.");
      } else {
        score += 0;
        issues.push("Porta de entrada demasiado estreita para a cadeira de rodas.");
      }
    } else {
      // Sem largura de cadeira conhecida — avaliar contra minimo recomendado (80cm)
      score += profile.entranceDoorWidth >= 80 ? 100 : profile.entranceDoorWidth >= 70 ? 50 : 10;
    }
  }

  // Degraus na entrada
  if (profile.numberOfSteps !== null && profile.numberOfSteps > 0) {
    factors++;
    if (!profile.hasRamp && !profile.hasPortableRamp) {
      score += 0;
      issues.push(`${String(profile.numberOfSteps)} degrau(s) na entrada sem rampa.`);
    } else if (profile.hasPortableRamp) {
      score += 50;
    }
  }

  return {
    score: factors > 0 ? Math.round(score / factors) : 50,
    issues,
  };
}

/**
 * Avalia a pontuacao do estacionamento (0-100).
 */
function scoreParking(profile: AccessibilityProfile): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  let factors = 0;

  if (profile.hasAccessibleParking !== null) {
    factors++;
    if (profile.hasAccessibleParking) {
      score += 70;
      if (profile.accessibleParkingSpaces !== null && profile.accessibleParkingSpaces >= 2) {
        score += 10;
      }
      if (profile.parkingDistanceToEntrance !== null && profile.parkingDistanceToEntrance <= 50) {
        score += 10;
      }
      if (profile.hasAdjacentAccessAisle) {
        score += 10;
      }
    } else {
      issues.push("Sem estacionamento acessivel.");
    }
  }

  if (profile.hasDropoffArea !== null) {
    factors++;
    score += profile.hasDropoffArea ? 100 : 30;
  }

  return {
    score: factors > 0 ? Math.round(score / factors) : 50,
    issues,
  };
}

/**
 * Avalia a pontuacao do interior e circulacao (0-100).
 */
function scoreInterior(
  profile: AccessibilityProfile,
  user: UserAccessibilityProfile,
): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  let factors = 0;

  // Largura dos corredores
  if (profile.corridorMinWidth !== null) {
    factors++;
    if (user.wheelchairWidth !== null) {
      const clearance = profile.corridorMinWidth - user.wheelchairWidth;
      if (clearance >= 30) {
        score += 100;
      } else if (clearance >= 10) {
        score += 60;
      } else {
        score += 20;
        issues.push("Corredores estreitos para cadeira de rodas.");
      }
    } else {
      score += profile.corridorMinWidth >= 120 ? 100 : profile.corridorMinWidth >= 90 ? 60 : 20;
    }
  }

  // Pavimento
  if (profile.floorType !== null) {
    factors++;
    const smoothFloors: string[] = ["smooth_tile", "wood", "concrete"];
    if (smoothFloors.includes(profile.floorType)) {
      score += profile.isNonSlip ? 100 : 80;
    } else if (profile.floorType === "carpet") {
      score += 60;
    } else {
      score += 30;
      issues.push("Pavimento potencialmente dificil para cadeira de rodas.");
    }
  }

  // Degraus interiores
  if (profile.hasInteriorSteps !== null) {
    factors++;
    if (!profile.hasInteriorSteps) {
      score += 100;
    } else if (profile.hasElevator) {
      score += 80;
    } else {
      score += 0;
      issues.push("Degraus interiores sem elevador.");
    }
  }

  // Espaco de rotacao
  if (profile.turningSpaceAvailable !== null) {
    factors++;
    if (user.turningRadiusNeeded !== null) {
      score += profile.turningSpaceAvailable >= user.turningRadiusNeeded ? 100 : 30;
    } else {
      score +=
        profile.turningSpaceAvailable >= 150 ? 100 : profile.turningSpaceAvailable >= 120 ? 60 : 20;
    }
  }

  // Elevador (se necessario)
  if (user.needsElevator && profile.hasElevator !== null) {
    factors++;
    if (profile.hasElevator) {
      score += profile.elevatorHasAccessibleControls ? 100 : 80;
    } else {
      score += 0;
      issues.push("Sem elevador (necessario para este utilizador).");
    }
  }

  return {
    score: factors > 0 ? Math.round(score / factors) : 50,
    issues,
  };
}

/**
 * Avalia a pontuacao das mesas e assentos (0-100).
 */
function scoreSeating(profile: AccessibilityProfile): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  let factors = 0;

  if (profile.hasAccessibleTables !== null) {
    factors++;
    if (profile.hasAccessibleTables) {
      score += 70;
      if (profile.underTableClearance !== null && profile.underTableClearance >= 70) {
        score += 15;
      }
      if (profile.spaceBetweenTables !== null && profile.spaceBetweenTables >= 90) {
        score += 15;
      }
    } else {
      issues.push("Sem mesas acessiveis.");
    }
  }

  if (profile.hasOutdoorSeating !== null && profile.outdoorSeatingAccessible !== null) {
    factors++;
    score += profile.outdoorSeatingAccessible ? 100 : 40;
  }

  return {
    score: factors > 0 ? Math.round(score / factors) : 50,
    issues,
  };
}

/**
 * Avalia a pontuacao da casa de banho (0-100).
 */
function scoreBathroom(
  profile: AccessibilityProfile,
  user: UserAccessibilityProfile,
): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  let factors = 0;

  if (profile.hasAccessibleBathroom !== null) {
    factors++;
    if (profile.hasAccessibleBathroom) {
      score += 50;

      // Largura da porta
      if (profile.bathroomDoorWidth !== null) {
        if (user.wheelchairWidth !== null) {
          score += profile.bathroomDoorWidth > user.wheelchairWidth + 5 ? 10 : 0;
        } else {
          score += profile.bathroomDoorWidth >= 80 ? 10 : 0;
        }
      }

      // Espaco de rotacao
      if (profile.bathroomTurningSpace !== null) {
        score += profile.bathroomTurningSpace >= 150 ? 10 : 0;
      }

      // Barras de apoio
      if (profile.hasGrabBars) {
        score += 10;
        if (user.bathroomTransferSide !== "not_applicable" && profile.grabBarSide !== null) {
          score +=
            profile.grabBarSide === "both" || profile.grabBarSide === user.bathroomTransferSide
              ? 5
              : 0;
        }
      }

      // Botao de emergencia
      if (profile.hasEmergencyButton) score += 5;

      // Mesmo andar
      if (profile.bathroomOnSameFloor) score += 10;
    } else {
      if (user.needsAccessibleBathroom) {
        issues.push("Sem casa de banho acessivel (necessaria para este utilizador).");
      }
    }
  }

  return {
    score: factors > 0 ? Math.min(Math.round(score / factors), 100) : 50,
    issues,
  };
}

/**
 * Avalia a pontuacao da comunicacao e menu (0-100).
 */
function scoreCommunication(profile: AccessibilityProfile): { score: number; issues: string[] } {
  let score = 0;
  const issues: string[] = [];
  let totalFeatures = 0;

  const features: [boolean | null, number][] = [
    [profile.hasDigitalMenu, 25],
    [profile.hasQRCodeMenu, 20],
    [profile.hasLargePrintMenu, 15],
    [profile.hasBrailleMenu, 15],
    [profile.hasPictureMenu, 10],
    [profile.staffTrainedInAccessibility, 10],
    [profile.hasHearingLoop, 5],
  ];

  for (const [value, weight] of features) {
    if (value !== null) {
      totalFeatures += weight;
      if (value) score += weight;
    }
  }

  return {
    score: totalFeatures > 0 ? Math.round((score / totalFeatures) * 100) : 50,
    issues,
  };
}

/**
 * Calcula a pontuacao de compatibilidade entre um utilizador e um restaurante.
 *
 * A pontuacao e ponderada por categoria de acordo com o tipo de mobilidade
 * do utilizador. Cada categoria recebe uma pontuacao de 0-100, e a pontuacao
 * final e a media ponderada.
 *
 * @param userProfile - Perfil de acessibilidade do utilizador.
 * @param restaurant - Perfil de acessibilidade do restaurante.
 * @returns Resultado detalhado com pontuacao por categoria e problemas criticos.
 */
export function calculateMatchScore(
  userProfile: UserAccessibilityProfile,
  restaurant: AccessibilityProfile,
): MatchScoreResult {
  const weights = getWeightsForMobilityType(userProfile.mobilityType);

  const entrance = scoreEntrance(restaurant, userProfile);
  const parking = scoreParking(restaurant);
  const interior = scoreInterior(restaurant, userProfile);
  const seating = scoreSeating(restaurant);
  const bathroom = scoreBathroom(restaurant, userProfile);
  const communication = scoreCommunication(restaurant);

  const categories = {
    entrance: entrance.score,
    parking: parking.score,
    interior: interior.score,
    seating: seating.score,
    bathroom: bathroom.score,
    communication: communication.score,
  };

  const overall = Math.round(
    (weights.entrance ?? 0.25) * entrance.score +
      (weights.parking ?? 0.1) * parking.score +
      (weights.interior ?? 0.2) * interior.score +
      (weights.seating ?? 0.15) * seating.score +
      (weights.bathroom ?? 0.25) * bathroom.score +
      (weights.communication ?? 0.05) * communication.score,
  );

  const criticalIssues = [
    ...entrance.issues,
    ...parking.issues,
    ...interior.issues,
    ...seating.issues,
    ...bathroom.issues,
    ...communication.issues,
  ];

  return { overall, categories, weights, criticalIssues };
}
