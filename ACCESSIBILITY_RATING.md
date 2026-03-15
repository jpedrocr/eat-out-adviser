# Eat Out Adviser - Sistema de Classificacao de Acessibilidade

**Versao:** 1.0
**Data:** 15 de Marco de 2026
**Estado:** Especificacao detalhada para implementacao
**Normas de referencia:** ADA (Americans with Disabilities Act), ISO 21542:2021, EAA (European Accessibility Act), DL 163/2006 (Portugal)

---

## Indice

1. [Filosofia do Sistema](#1-filosofia-do-sistema)
2. [Sistema de Pontuacao Global (0-100)](#2-sistema-de-pontuacao-global-0-100)
3. [Algoritmo de Calculo Detalhado](#3-algoritmo-de-calculo-detalhado)
4. [Pontuacao Personalizada](#4-pontuacao-personalizada)
5. [Sistema Semaforo](#5-sistema-semaforo)
6. [Sistema de Verificacao](#6-sistema-de-verificacao)
7. [Decay e Actualizacao](#7-decay-e-actualizacao)
8. [Matching com Perfil do Utilizador](#8-matching-com-perfil-do-utilizador)
9. [Apresentacao Visual](#9-apresentacao-visual)
10. [Tabela de Referencia de Medidas](#10-tabela-de-referencia-de-medidas)
11. [Implementacao TypeScript](#11-implementacao-typescript)

---

## 1. Filosofia do Sistema

### 1.1 Porque e necessaria uma classificacao de acessibilidade dedicada

Uma classificacao generica de restaurante (comida, servico, ambiente) responde a pergunta "vale a pena ir?". Para uma pessoa com mobilidade reduzida, a pergunta anterior e mais fundamental: "consigo entrar?". E depois de entrar: "consigo sentar-me?", "consigo usar a casa de banho?", "consigo sair com dignidade?".

Estas perguntas nao tem resposta possivel num sistema de 1 a 5 estrelas. Uma estrela em "acessibilidade" pode significar coisas radicalmente diferentes: para quem usa bengala, pode significar "ha dois degraus na entrada"; para quem usa cadeira de rodas electrica, pode significar "a porta tem 70 cm e nao consigo passar".

### 1.2 Insuficiencia das classificacoes genericas

Os sistemas de classificacao genericos falham na acessibilidade por quatro razoes:

1. **Subjectividade nao-comparavel:** Uma estrela de acessibilidade atribuida por um utilizador de muletas nao e equivalente a mesma estrela atribuida por um utilizador de cadeira electrica. As barreiras fisicas sao objectivas e mensuraveis, e o impacto depende do perfil de cada pessoa.

2. **Ausencia de granularidade:** Saber que um restaurante tem "3 estrelas em acessibilidade" nao responde a nenhuma das perguntas praticas: a porta tem largura suficiente para a minha cadeira? Ha espaco de rotacao na casa de banho? A rampa tem inclinacao aceitavel?

3. **Falsa equivalencia:** Num sistema generico, um restaurante com entrada perfeita mas casa de banho inacessivel pode ter a mesma classificacao que um restaurante com entrada dificil mas casa de banho adaptada. Para o utilizador, estas situacoes sao fundamentalmente diferentes.

4. **Impossibilidade de personalizacao:** O que e acessivel para uma pessoa pode nao ser para outra. Uma porta de 75 cm e suficiente para a maioria das cadeiras manuais (largura tipica 55-65 cm) mas insuficiente para muitas cadeiras electricas (largura tipica 60-75 cm).

### 1.3 Importancia da personalizacao

O Eat Out Adviser parte do principio de que acessibilidade nao e binaria nem universal. E um espectro que depende da interseccao entre as caracteristicas fisicas do espaco e as necessidades especificas de cada utilizador.

Por isso, o sistema calcula duas pontuacoes distintas:
- **Pontuacao global:** Avaliacao objectiva do espaco contra limiares normativos (util para proprietarios, verificadores e comparacao geral)
- **Pontuacao personalizada:** Avaliacao especifica para o perfil do utilizador (dimensoes do equipamento de mobilidade, capacidades fisicas, preferencias)

### 1.4 Enquadramento normativo

O sistema de pontuacao esta alinhado com as seguintes normas internacionais:

| Norma | Ambito | Aplicacao no sistema |
|---|---|---|
| ADA (Americans with Disabilities Act) | Limiares minimos de acessibilidade | Valores de referencia para subcritrios (largura de portas, inclinacao de rampas, espacos de rotacao) |
| ISO 21542:2021 | Construcao de edificios -- Acessibilidade e usabilidade do ambiente construido | Limiares europeus/internacionais (geralmente mais exigentes que ADA) |
| EAA (European Accessibility Act) | Requisitos de acessibilidade para produtos e servicos na UE | Enquadramento legal para servicos de restauracao na UE (em vigor desde Junho de 2025) |
| DL 163/2006 (Portugal) | Normas tecnicas de acessibilidade em edificios | Limiares especificos para o contexto portugues (rampas, portas, sanitarios) |
| EN 301 549 | Requisitos de acessibilidade para TIC | Aplicavel a interface digital da aplicacao |

---

## 2. Sistema de Pontuacao Global (0-100)

### 2.1 Categorias e Pesos Base

A pontuacao global e uma media ponderada de seis categorias. Os pesos base reflectem a importancia relativa de cada zona para a acessibilidade geral do espaco.

| Categoria | Peso Base | Justificacao |
|---|---|---|
| Entrada (Entrance) | 25% | Sem entrada acessivel, o resto e irrelevante -- e a primeira barreira |
| Estacionamento (Parking) | 10% | Importante para quem conduz, mas nem todos os utilizadores necessitam |
| Interior (Interior) | 20% | Circulacao, pavimento e espaco de manobra dentro do restaurante |
| Mesas (Seating) | 15% | Altura, espaco livre e distancia entre mesas |
| Casa de Banho (Bathroom) | 25% | Necessidade basica frequentemente negligenciada; espaco de rotacao critico |
| Comunicacao (Communication) | 5% | Formato da ementa, sinalizacao e formacao do pessoal |

### 2.2 Pesos por Tipo de Mobilidade

Os pesos base sao ajustados consoante o tipo de mobilidade do utilizador. Cada perfil tem necessidades distintas que alteram a importancia relativa de cada categoria.

#### Cadeira de rodas electrica

A cadeira electrica e mais larga (60-75 cm), mais comprida (100-120 cm), mais pesada (80-150 kg com utilizador) e necessita de maior raio de viragem (150-180 cm). Estacionamento ganha peso porque o utilizador tipicamente conduz veiculo adaptado.

| Categoria | Peso | Delta vs base | Justificacao |
|---|---|---|---|
| Entrada | 25% | 0% | Critica para todos os perfis |
| Estacionamento | 10% | 0% | Maioria conduz veiculo adaptado |
| Interior | 20% | 0% | Espacos de manobra sao criticos |
| Mesas | 10% | -5% | Importante mas menos que WC |
| Casa de Banho | 30% | +5% | Espaco de rotacao e a maior barreira |
| Comunicacao | 5% | 0% | Mantido |

#### Cadeira de rodas manual

A cadeira manual e mais estreita (55-65 cm), mais leve e mais manobravel. O utilizador pode necessitar de ajuda para subir rampas ingremes.

| Categoria | Peso | Delta vs base | Justificacao |
|---|---|---|---|
| Entrada | 25% | 0% | Rampas e inclinacao sao criticas |
| Estacionamento | 10% | 0% | Pode ser transportado por terceiros |
| Interior | 20% | 0% | Necessita de espaco mas menos que electrica |
| Mesas | 15% | 0% | Altura e espaco livre para joelhos |
| Casa de Banho | 25% | 0% | Importante mas raio de viragem menor |
| Comunicacao | 5% | 0% | Mantido |

#### Scooter motorizado

O scooter e longo (120-140 cm), com raio de viragem grande (200+ cm) e dificil de manobrar em espacos apertados. Estacionamento e muito relevante.

| Categoria | Peso | Delta vs base | Justificacao |
|---|---|---|---|
| Entrada | 20% | -5% | Importante mas menos que interior |
| Estacionamento | 15% | +5% | Scooter necessita de estacionamento proximo |
| Interior | 30% | +10% | Comprimento e raio de viragem elevados |
| Mesas | 10% | -5% | Pode transferir-se para cadeira |
| Casa de Banho | 20% | -5% | Pode nao usar WC no restaurante |
| Comunicacao | 5% | 0% | Mantido |

#### Andarilho / Rollator

O andarilho e compacto (55-65 cm de largura) mas o utilizador tem mobilidade limitada e necessita de superficies estaveis. Risco de queda e uma preocupacao central.

| Categoria | Peso | Delta vs base | Justificacao |
|---|---|---|---|
| Entrada | 20% | -5% | Degraus sao problema, mas menos critico que para cadeira |
| Estacionamento | 10% | 0% | Pode ser transportado por terceiros |
| Interior | 25% | +5% | Superficies anti-derrapantes e espaco sao criticos |
| Mesas | 15% | 0% | Precisa de mesa estavel para apoio |
| Casa de Banho | 25% | 0% | Barras de apoio sao essenciais |
| Comunicacao | 5% | 0% | Mantido |

#### Muletas

O utilizador com muletas necessita de superficies estaveis, pouco desnivel e apoios. Largura de passagem e menos critica, mas degraus e superficies irregulares sao problemticos.

| Categoria | Peso | Delta vs base | Justificacao |
|---|---|---|---|
| Entrada | 30% | +5% | Degraus e superficies sao a maior barreira |
| Estacionamento | 10% | 0% | Distancia ate a entrada e relevante |
| Interior | 20% | 0% | Superficies anti-derrapantes |
| Mesas | 10% | -5% | Menos restricoes de espaco |
| Casa de Banho | 25% | 0% | Barras de apoio essenciais |
| Comunicacao | 5% | 0% | Mantido |

#### Bengala

Perfil com menos restricoes fisicas mas sensivel a degraus, superficies irregulares e iluminacao.

| Categoria | Peso | Delta vs base | Justificacao |
|---|---|---|---|
| Entrada | 25% | 0% | Degraus e superficies |
| Estacionamento | 10% | 0% | Distancia |
| Interior | 20% | 0% | Superficies |
| Mesas | 15% | 0% | Sem restricoes especiais |
| Casa de Banho | 20% | -5% | Barras de apoio uteis mas nao criticas |
| Comunicacao | 10% | +5% | Sinalizacao e iluminacao mais relevantes |

#### Mobilidade reduzida (idosos, gravidez, lesao temporaria)

Perfil generalista com sensibilidade a degraus, distancias e conforto.

| Categoria | Peso | Delta vs base | Justificacao |
|---|---|---|---|
| Entrada | 20% | -5% | Degraus sao problema mas podem gerir com ajuda |
| Estacionamento | 15% | +5% | Proximidade e fundamental |
| Interior | 20% | 0% | Conforto e estabilidade |
| Mesas | 15% | 0% | Altura confortavel |
| Casa de Banho | 20% | -5% | Barras de apoio uteis |
| Comunicacao | 10% | +5% | Sinalizacao clara e importante |

---

## 3. Algoritmo de Calculo Detalhado

Cada categoria e calculada como soma ponderada de subcritrios, cada um avaliado numa escala de 0 a 100. O score da categoria e a soma dos subcritrios multiplicados pelo seu peso relativo dentro da categoria.

### 3.1 Entrada (Entrance Score)

```
entrance_score = (
  accessible_entrance_score × 0.30 +
  door_width_score × 0.20 +
  step_score × 0.25 +
  surface_score × 0.10 +
  ramp_quality_score × 0.10 +
  lighting_score × 0.05
)
```

#### `accessible_entrance_score(has_accessible_entrance)`

Avaliacao booleana da existencia de uma entrada acessivel (ao nivel do chao ou com rampa).

| Condicao | Pontuacao |
|---|---|
| `has_accessible_entrance = true` e `has_level_entrance = true` | 100 |
| `has_accessible_entrance = true` e `has_ramp = true` | 80 |
| `has_accessible_entrance = true` (com ajuda possivel) | 60 |
| `has_portable_ramp = true` (rampa portatil disponivel) | 40 |
| `has_accessible_entrance = false` | 0 |

#### `door_width_score(door_width_cm, wheelchair_width_cm)`

A largura de referencia depende do perfil do utilizador. Para a pontuacao global, usa-se a largura de referencia normativa de 80 cm (ISO 21542).

| Condicao | Pontuacao | Justificacao |
|---|---|---|
| `door_width >= ref_width + 15` | 100 | Confortavel: passagem com folga |
| `door_width >= ref_width + 5` | 75 | Adequado: passagem com margem |
| `door_width >= ref_width` | 50 | Justo: passagem possivel mas sem margem |
| `door_width >= ref_width - 5` | 25 | Apertado: pode passar com dificuldade |
| `door_width < ref_width - 5` | 0 | Inacessivel: nao passa |

Onde `ref_width` para pontuacao global = 80 cm (ISO 21542) e para pontuacao personalizada = `user.wheelchair_width`.

#### `step_score(num_steps, step_height_cm, has_ramp, has_portable_ramp)`

| Condicao | Pontuacao |
|---|---|
| `num_steps = 0` (entrada ao nivel) | 100 |
| `num_steps > 0` e `has_ramp = true` e rampa conforme | 80 |
| `num_steps = 1` e `step_height <= 2` (ressalto minimo) | 60 |
| `num_steps > 0` e `has_portable_ramp = true` | 40 |
| `num_steps = 1` e `step_height <= 5` | 20 |
| `num_steps = 1` e `step_height > 5` | 5 |
| `num_steps >= 2` e sem rampa | 0 |

#### `surface_score(surface_type)`

| Tipo de superficie | Pontuacao | Justificacao |
|---|---|---|
| `smooth` | 100 | Superficie lisa e regular |
| `cobblestone` (calcada portuguesa) | 30 | Muito irregular, vibracao e instabilidade |
| `gravel` (gravilha) | 20 | Rodas afundam, dificil de circular |
| `uneven` (irregular) | 15 | Risco de queda ou bloqueio |
| `grass` (relva) | 10 | Rodas afundam, dificil para cadeiras pesadas |

#### `ramp_quality_score(has_ramp, ramp_incline, ramp_has_handrails)`

So aplicavel quando existem degraus e rampa. Caso nao haja degraus, este subcritrio e neutro (100).

| Condicao | Pontuacao |
|---|---|
| Sem degraus (entrada ao nivel) | 100 |
| `ramp_incline <= 6%` e `ramp_has_handrails = true` | 100 |
| `ramp_incline <= 6%` e `ramp_has_handrails = false` | 85 |
| `ramp_incline <= 8%` e `ramp_has_handrails = true` | 80 |
| `ramp_incline <= 8%` e `ramp_has_handrails = false` | 65 |
| `ramp_incline <= 10%` e `ramp_has_handrails = true` | 50 |
| `ramp_incline <= 10%` e `ramp_has_handrails = false` | 35 |
| `ramp_incline <= 12%` | 20 |
| `ramp_incline > 12%` | 5 |
| Sem rampa e com degraus | 0 |

Limiares: DL 163/2006 (Portugal) recomenda <= 6%; ADA permite ate 8.33% (1:12).

#### `lighting_score(lighting_level)`

| Nivel de iluminacao | Pontuacao |
|---|---|
| `well_lit` | 100 |
| `moderate` | 60 |
| `poor` | 20 |

### 3.2 Estacionamento (Parking Score)

```
parking_score = (
  accessible_parking_score × 0.35 +
  distance_score × 0.20 +
  space_width_score × 0.15 +
  access_aisle_score × 0.15 +
  surface_score × 0.10 +
  dropoff_score × 0.05
)
```

#### `accessible_parking_score(has_accessible_parking, accessible_parking_spaces)`

| Condicao | Pontuacao |
|---|---|
| `accessible_parking_spaces >= 2` | 100 |
| `accessible_parking_spaces = 1` | 80 |
| `has_accessible_parking = false` mas estacionamento geral proximo | 30 |
| Sem estacionamento | 0 |

#### `distance_score(parking_distance_to_entrance_m)`

| Distancia (metros) | Pontuacao |
|---|---|
| `<= 20` | 100 |
| `<= 50` | 80 |
| `<= 100` | 50 |
| `<= 200` | 25 |
| `> 200` | 10 |

#### `space_width_score(parking_space_width_cm)`

| Largura (cm) | Pontuacao | Referencia |
|---|---|---|
| `>= 370` (150 + 120 aisle integrado) | 100 | Excelente para vans adaptadas |
| `>= 330` | 80 | Bom |
| `>= 280` | 60 | Adequado |
| `>= 244` | 40 | Minimo ADA |
| `< 244` | 10 | Insuficiente |

#### `access_aisle_score(has_adjacent_access_aisle, access_aisle_width_cm)`

| Condicao | Pontuacao |
|---|---|
| `has_aisle = true` e `width >= 152` | 100 |
| `has_aisle = true` e `width >= 120` | 70 |
| `has_aisle = true` e `width < 120` | 40 |
| `has_aisle = false` | 0 |

Limiar: ADA 502.3 exige >= 152 cm (60 pol.) para vans.

#### `parking_surface_score(parking_surface_type)`

| Tipo de superficie | Pontuacao |
|---|---|
| `asphalt` | 100 |
| `concrete` | 100 |
| `cobblestone` | 40 |
| `gravel` | 20 |
| `other` | 30 |

#### `dropoff_score(has_dropoff_area)`

| Condicao | Pontuacao |
|---|---|
| `has_dropoff_area = true` | 100 |
| `has_dropoff_area = false` | 0 |

### 3.3 Interior (Interior Score)

```
interior_score = (
  corridor_width_score × 0.25 +
  floor_score × 0.15 +
  turning_space_score × 0.30 +
  counter_height_score × 0.10 +
  interior_steps_score × 0.15 +
  elevator_score × 0.05
)
```

#### `corridor_width_score(corridor_min_width_cm, wheelchair_width_cm)`

Para a pontuacao global, usa-se como referencia a largura normativa de 90 cm (ADA 403.5.1).

| Condicao | Pontuacao | Justificacao |
|---|---|---|
| `width >= 150` | 100 | Duas cadeiras cruzam-se |
| `width >= 120` | 85 | ISO 21542: passagem confortavel |
| `width >= 90` | 65 | ADA: passagem minima |
| `width >= 80` | 40 | Passagem apertada para cadeira manual |
| `width >= 70` | 15 | Apenas bengala/muletas |
| `width < 70` | 0 | Inacessivel |

#### `floor_score(floor_type, is_non_slip)`

| Tipo de piso | Base | Bonus anti-derrapante |
|---|---|---|
| `smooth_tile` | 80 | +20 se `is_non_slip` |
| `wood` | 75 | +15 se `is_non_slip` |
| `concrete` | 70 | +20 se `is_non_slip` |
| `carpet` | 50 | N/A (ja anti-derrapante mas dificulta rodas) |
| `uneven` | 15 | +10 se `is_non_slip` |
| `other` | 40 | +15 se `is_non_slip` |

Nota: Alcatifa (carpet) recebe pontuacao mais baixa porque dificulta a locomocao de cadeiras de rodas, apesar de ser anti-derrapante.

#### `turning_space_score(turning_space_cm, user_turning_radius_cm)`

Para a pontuacao global, usa-se como referencia 152 cm (ADA 304.3.1).

| Condicao | Pontuacao |
|---|---|
| `space >= ref + 30` | 100 |
| `space >= ref + 10` | 85 |
| `space >= ref` | 70 |
| `space >= ref - 10` | 45 |
| `space >= ref - 20` | 25 |
| `space < ref - 20` | 0 |

Onde `ref` para pontuacao global = 152 cm e para pontuacao personalizada = `user.turning_radius_needed`.

#### `counter_height_score(counter_height_cm, has_low_counter)`

| Condicao | Pontuacao |
|---|---|
| `has_low_counter = true` e `counter_height <= 86` | 100 |
| `has_low_counter = true` e `counter_height <= 91` | 80 |
| `counter_height <= 91` (sem balcao rebaixado mas altura aceitavel) | 60 |
| `counter_height <= 100` | 30 |
| `counter_height > 100` e `has_low_counter = false` | 10 |

Limiar: ADA 904.4 exige <= 91.4 cm (36 pol.) para balcao acessivel.

#### `interior_steps_score(has_interior_steps, interior_step_count)`

| Condicao | Pontuacao |
|---|---|
| `has_interior_steps = false` | 100 |
| `interior_step_count = 1` e altura <= 2 cm | 60 |
| `interior_step_count = 1` e altura <= 5 cm | 30 |
| `interior_step_count >= 2` e `has_elevator = true` | 50 |
| `interior_step_count >= 2` e `has_elevator = false` | 0 |

#### `elevator_score(has_elevator, elevator_door_width, elevator_cabin_width, elevator_cabin_depth)`

So aplicavel se o restaurante tem pisos multiplos. Se for espaco unico sem degraus, score = 100.

| Condicao | Pontuacao |
|---|---|
| Sem necessidade de elevador (piso unico) | 100 |
| `has_elevator` e `door_width >= 91` e `cabin_width >= 170` e `cabin_depth >= 137` | 100 |
| `has_elevator` e `door_width >= 80` e `cabin_width >= 140` e `cabin_depth >= 120` | 70 |
| `has_elevator` e dimensoes menores que acima | 40 |
| `has_elevator = false` e restaurante multipiso | 0 |

### 3.4 Mesas (Seating Score)

```
seating_score = (
  accessible_tables_score × 0.25 +
  table_height_score × 0.20 +
  under_clearance_score × 0.25 +
  spacing_score × 0.20 +
  outdoor_score × 0.10
)
```

#### `accessible_tables_score(has_accessible_tables, accessible_table_count, total_context)`

| Condicao | Pontuacao |
|---|---|
| `has_accessible_tables` e `count >= 4` | 100 |
| `has_accessible_tables` e `count >= 2` | 80 |
| `has_accessible_tables` e `count = 1` | 50 |
| `has_accessible_tables = false` | 0 |

#### `table_height_score(table_height_cm)`

| Altura (cm) | Pontuacao | Referencia |
|---|---|---|
| `71 <= height <= 86` | 100 | Faixa ADA 902.3 |
| `68 <= height < 71` ou `86 < height <= 90` | 70 | Aceitavel |
| `65 <= height < 68` ou `90 < height <= 95` | 40 | Desconfortavel |
| Fora destes limites | 10 | Inacessivel |

#### `under_clearance_score(under_table_clearance_cm)`

Espaco livre sob a mesa para joelhos e pernas de quem esta em cadeira de rodas.

| Altura livre (cm) | Pontuacao | Referencia |
|---|---|---|
| `>= 73` | 100 | Confortavel |
| `>= 68.5` | 80 | Minimo ADA 306.3 (27 pol.) |
| `>= 65` | 50 | Apertado mas possivel |
| `>= 60` | 25 | Muito apertado |
| `< 60` | 0 | Inacessivel |

#### `spacing_score(space_between_tables_cm)`

| Espaco (cm) | Pontuacao | Referencia |
|---|---|---|
| `>= 120` | 100 | Passagem confortavel para cadeira electrica |
| `>= 90` | 75 | ISO 21542: passagem minima para cadeira de rodas |
| `>= 75` | 40 | Apertado, possivel com cadeira manual |
| `>= 60` | 15 | Apenas bengala/muletas |
| `< 60` | 0 | Inacessivel para mobilidade reduzida |

#### `outdoor_score(has_outdoor_seating, outdoor_seating_accessible)`

| Condicao | Pontuacao |
|---|---|
| `has_outdoor_seating` e `outdoor_seating_accessible` | 100 |
| `has_outdoor_seating` e `outdoor_seating_accessible = false` | 30 |
| `has_outdoor_seating = false` | 50 |

Nota: Ausencia de esplanada nao e penalizada fortemente; e uma alternativa, nao um requisito.

### 3.5 Casa de Banho (Bathroom Score)

```
bathroom_score = (
  accessible_bathroom_score × 0.20 +
  bathroom_door_width_score × 0.15 +
  turning_space_score × 0.20 +
  grab_bars_score × 0.15 +
  toilet_height_score × 0.10 +
  sink_score × 0.10 +
  same_floor_score × 0.05 +
  emergency_button_score × 0.05
)
```

#### `accessible_bathroom_score(has_accessible_bathroom)`

| Condicao | Pontuacao |
|---|---|
| `has_accessible_bathroom = true` | 100 |
| `has_accessible_bathroom = false` | 0 |

#### `bathroom_door_width_score(bathroom_door_width_cm, wheelchair_width_cm)`

Mesma formula que `door_width_score` da seccao 3.1, com os mesmos limiares relativos a largura de referencia.

| Condicao | Pontuacao |
|---|---|
| `door_width >= ref_width + 15` | 100 |
| `door_width >= ref_width + 5` | 75 |
| `door_width >= ref_width` | 50 |
| `door_width >= ref_width - 5` | 25 |
| `door_width < ref_width - 5` | 0 |

Onde `ref_width` para pontuacao global = 80 cm (ISO 21542) e para pontuacao personalizada = `user.wheelchair_width`.

#### `bathroom_turning_space_score(turning_space_cm, user_turning_radius_cm)`

Mesma formula que `turning_space_score` da seccao 3.3.

| Condicao | Pontuacao |
|---|---|
| `space >= ref + 30` | 100 |
| `space >= ref + 10` | 85 |
| `space >= ref` | 70 |
| `space >= ref - 10` | 45 |
| `space >= ref - 20` | 25 |
| `space < ref - 20` | 0 |

Onde `ref` para pontuacao global = 152 cm e para pontuacao personalizada = `user.turning_radius_needed`.

#### `grab_bars_score(has_grab_bars, grab_bar_side, user_transfer_side)`

| Condicao | Pontuacao |
|---|---|
| `has_grab_bars` e `grab_bar_side = "both"` | 100 |
| `has_grab_bars` e lado corresponde ao `user_transfer_side` | 90 |
| `has_grab_bars` e lado nao corresponde | 50 |
| `has_grab_bars = false` | 0 |

Para a pontuacao global (sem perfil), `grab_bar_side = "both"` recebe 100 e qualquer lado unico recebe 70.

#### `toilet_height_score(toilet_seat_height_cm)`

| Altura (cm) | Pontuacao | Referencia |
|---|---|---|
| `43 <= height <= 48` | 100 | Faixa ADA 604.4 |
| `40 <= height < 43` ou `48 < height <= 52` | 70 | Aceitavel |
| `36 <= height < 40` ou `52 < height <= 56` | 40 | Desconfortavel |
| Fora destes limites | 10 | Transferencia muito dificil |

#### `sink_score(sink_height_cm, has_knee_space, faucet_type)`

| Componente | Condicao | Pontuacao parcial |
|---|---|---|
| Altura | `sink_height <= 86` | 40 |
| Altura | `86 < sink_height <= 91` | 25 |
| Altura | `sink_height > 91` | 5 |
| Espaco para joelhos | `has_knee_space = true` | 30 |
| Espaco para joelhos | `has_knee_space = false` | 0 |
| Torneira | `faucet_type = "sensor"` | 30 |
| Torneira | `faucet_type = "lever"` | 25 |
| Torneira | `faucet_type = "knob"` | 10 |

Score total = soma das tres componentes (maximo 100).

#### `same_floor_score(bathroom_on_same_floor)`

| Condicao | Pontuacao |
|---|---|
| `bathroom_on_same_floor = true` | 100 |
| `bathroom_on_same_floor = false` e `has_elevator = true` | 50 |
| `bathroom_on_same_floor = false` e `has_elevator = false` | 0 |

#### `emergency_button_score(has_emergency_button)`

| Condicao | Pontuacao |
|---|---|
| `has_emergency_button = true` | 100 |
| `has_emergency_button = false` | 0 |

### 3.6 Comunicacao (Communication Score)

```
communication_score = (
  menu_format_score × 0.40 +
  staff_training_score × 0.35 +
  signage_score × 0.25
)
```

#### `menu_format_score(has_digital_menu, has_qr_code_menu, has_large_print_menu, has_picture_menu, has_braille_menu)`

Cada formato acessivel contribui para a pontuacao. Os formatos sao cumulativos.

| Formato | Pontuacao |
|---|---|
| `has_digital_menu` ou `has_qr_code_menu` | +35 |
| `has_large_print_menu` | +25 |
| `has_picture_menu` | +25 |
| `has_braille_menu` | +15 |

Score = min(100, soma dos formatos disponiveis). Se nenhum formato acessivel esta disponivel, score = 0.

#### `staff_training_score(staff_trained_in_accessibility)`

| Condicao | Pontuacao |
|---|---|
| `staff_trained = true` | 100 |
| `staff_trained = false` | 0 |

#### `signage_score(has_hearing_loop, mirror_at_wheelchair_height)`

| Componente | Condicao | Pontuacao parcial |
|---|---|---|
| Anel de inducao | `has_hearing_loop = true` | 50 |
| Espelho acessivel | `has_mirror_at_wheelchair_height = true` | 50 |

Score total = soma (maximo 100). Nota: campo `has_hearing_loop` utilizado como proxy para investimento em comunicacao acessivel.

---

## 4. Pontuacao Personalizada

### 4.1 Formula geral

```
pontuacao_personalizada = Sigma(score_categoria_i x peso_personalizado_i) x multiplicador_verificacao
```

Onde:

- `score_categoria_i` = pontuacao da categoria i recalculada com as dimensoes do utilizador (ex: `door_width_score` usa `user.wheelchair_width` em vez de 80 cm)
- `peso_personalizado_i` = peso da categoria ajustado ao tipo de mobilidade do utilizador (tabela da seccao 2.2)
- `multiplicador_verificacao` = factor de confianca baseado na fonte dos dados e idade da verificacao

### 4.2 Multiplicador de verificacao

O multiplicador reflecte a confianca que o sistema tem nos dados. Dados nao verificados ou antigos sao penalizados.

| Fonte de dados | Multiplicador base |
|---|---|
| Verificacao profissional (`professionally_verified`) | 1.00 |
| Verificacao comunitaria com 3+ relatorios concordantes (`community_verified`) | 0.90 |
| Autoavaliacao pelo proprietario (`owner`) | 0.75 |
| Analise por IA a partir de fotografias (`ai_analysis`) | 0.60 |
| Dado nao verificado (reporte unico da comunidade) (`community` + `unverified`) | 0.50 |

### 4.3 Criterios eliminatorios

Antes de calcular a pontuacao, o sistema verifica condicoes eliminatorias que geram avisos criticos:

| Condicao | Aviso |
|---|---|
| `entrance_door_width < user.wheelchair_width + 4` | "Porta da entrada demasiado estreita para a sua cadeira" |
| `num_steps > 0` e `has_ramp = false` e `user.max_step_height = 0` | "Sem acesso ao nivel -- degraus sem rampa" |
| `ramp_incline > user.max_ramp_incline` | "Inclinacao da rampa superior ao seu limite" |
| `bathroom_door_width < user.wheelchair_width + 4` | "Porta da casa de banho demasiado estreita" |
| `bathroom_turning_space < user.turning_radius_needed - 20` | "Espaco de rotacao na casa de banho insuficiente" |
| `corridor_min_width < user.wheelchair_width + 10` | "Corredores demasiado estreitos" |

Os avisos criticos sao apresentados independentemente da pontuacao numrica. Um restaurante pode ter pontuacao personalizada de 70/100 mas com um aviso critico na casa de banho.

---

## 5. Sistema Semaforo

### 5.1 Limiares globais

| Cor | Pontuacao | Significado |
|---|---|---|
| Verde | >= 75 | Acessivel -- poucas ou nenhumas barreiras significativas |
| Amarelo | >= 40 e < 75 | Parcialmente acessivel -- barreiras existentes, verificar detalhes |
| Vermelho | < 40 | Barreiras significativas -- provavel dificuldade de acesso |
| Cinzento | -- | Sem dados suficientes para classificar |

### 5.2 Semaforo por categoria

Cada categoria tem o seu proprio semaforo, utilizando os mesmos limiares. Isto permite ao utilizador identificar rapidamente onde estao os problemas.

Exemplo de apresentacao:

```
Entrada:       [VERDE]   85/100
Estacionamento:[VERDE]   90/100
Interior:      [AMARELO] 62/100
Mesas:         [VERDE]   78/100
Casa de Banho: [VERMELHO] 35/100
Comunicacao:   [AMARELO] 55/100
```

### 5.3 Semaforo personalizado

O semaforo personalizado usa a pontuacao personalizada e pode diferir do semaforo global. Um restaurante pode ser VERDE globalmente mas AMARELO ou VERMELHO para um perfil especifico.

### 5.4 Condicao "Cinzento" (dados insuficientes)

Um restaurante e classificado como Cinzento quando:
- Menos de 3 subcritrios preenchidos na categoria (semaforo da categoria)
- Menos de 3 categorias com dados (semaforo global)
- Todos os dados provem de fonte unica nao verificada com mais de 12 meses

---

## 6. Sistema de Verificacao

### 6.1 Fluxo de verificacao

```
1. PROPRIETARIO SUBMETE DADOS
   Estado: "owner" + "unverified"
   Multiplicador: 0.75
   |
   v
2. MEMBRO DA COMUNIDADE VISITA E REPORTA
   Estado: "community" + "unverified"
   Multiplicador: 0.50 (primeiro reporte)
   |
   v
3. 3+ REPORTES COMUNITARIOS CONCORDANTES
   Estado: "community" + "community_verified"
   Multiplicador: 0.90
   Criterio: >= 3 reportes independentes com concordancia >= 80% nos campos
   |
   v
4. VERIFICADOR PROFISSIONAL VISITA
   Estado: "community" + "professionally_verified"
   Multiplicador: 1.00
   Nota: Visita estruturada com checklist e medicoes fisicas
   |
   v
5. IA ANALISA FOTOGRAFIAS (complementar)
   Estado: "ai_analysis" + "unverified"
   Multiplicador: 0.60
   Nota: Suplementa mas nunca substitui verificacao humana.
         Apenas actualiza campos onde nao existe dado humano verificado.
```

### 6.2 Concordancia comunitaria

Para que 3+ reportes comunitarios elevem o estado para "community_verified", e necessario:

- Minimo de 3 reportes independentes (utilizadores diferentes, datas diferentes)
- Concordancia >= 80% nos campos booleanos (ex: se 3 em 4 dizem "has_ramp = true", concordancia = 75% -- insuficiente)
- Para campos numericos (largura de porta, inclinacao), desvio padrao <= 15% da media
- Dados com mais de 12 meses de diferenca entre si nao contam como concordantes

### 6.3 Verificacao profissional

O verificador profissional segue um protocolo estruturado:

1. Utilizacao de fita metrica para medicoes de largura, altura e espaco
2. Utilizacao de nivel digital para medicao de inclinacao de rampas
3. Registo fotografico de cada elemento avaliado
4. Preenchimento de checklist completo que mapeia para os campos do `AccessibilityProfile`
5. Assinatura digital do relatorio

---

## 7. Decay e Actualizacao

### 7.1 Degradacao temporal do multiplicador

A fiabilidade dos dados degrada-se ao longo do tempo. O multiplicador de verificacao e ajustado pela idade dos dados:

| Idade dos dados | Factor de decay | Multiplicador resultante (exemplo: profissional) |
|---|---|---|
| 0 - 6 meses | 1.00 | 1.00 x 1.00 = 1.00 |
| 6 - 12 meses | 0.90 | 1.00 x 0.90 = 0.90 |
| 12 - 18 meses | 0.80 | 1.00 x 0.80 = 0.80 |
| 18 - 24 meses | 0.65 | 1.00 x 0.65 = 0.65 |
| > 24 meses | 0.50 | 1.00 x 0.50 = 0.50 |

### 7.2 Formula de decay

```
decay_factor = max(0.50, 1.0 - (months_since_verification / 48))
effective_multiplier = base_multiplier × decay_factor
```

Onde `months_since_verification` e o numero de meses desde a ultima verificacao e `base_multiplier` e o multiplicador da fonte de dados. O factor minimo e 0.50 (nunca desce abaixo de metade).

### 7.3 Eventos que activam re-verificacao

| Evento | Accao |
|---|---|
| Proprietario reporta renovacao/obras | Reset do estado para "unverified"; alerta aos verificadores |
| Utilizador sinaliza "informacao parece desactualizada" | Flag no restaurante; 3+ flags = destaque para re-verificacao |
| Decay atinge 0.65 (18+ meses) | Alerta automatico: "dados com mais de 18 meses -- verificacao recomendada" |
| Dados contraditrios entre fontes | Flag para revisao manual |

---

## 8. Matching com Perfil do Utilizador

### 8.1 Exemplo completo de calculo

**Perfil do utilizador (Joao):**
- Tipo de mobilidade: `electric_wheelchair`
- Largura da cadeira: 68 cm
- Comprimento da cadeira: 110 cm
- Raio de viragem necessario: 150 cm
- Inclinacao maxima de rampa: 8%
- Altura maxima de degrau: 0 cm (nao consegue ultrapassar degraus)
- Necessita de elevador: sim
- Necessita de WC acessivel: sim
- Lado de transferencia: esquerdo

**Dados do restaurante (Restaurante Exemplo):**
- Entrada: porta 85 cm, sem degraus, entrada ao nivel, superficie lisa, boa iluminacao
- Estacionamento: 1 lugar acessivel, 30 m de distancia, largura 300 cm, com corredor de acesso 130 cm, asfalto, sem zona de largada
- Interior: corredor 110 cm, piso em madeira anti-derrapante, espaco de rotacao 155 cm, balcao 95 cm sem balcao rebaixado, sem degraus interiores
- Mesas: 3 mesas acessiveis, altura 75 cm, espaco livre 70 cm, espaco entre mesas 100 cm, com esplanada acessivel
- Casa de banho: acessivel, porta 75 cm, espaco de rotacao 140 cm, barras de apoio do lado esquerdo, sanita 45 cm, lavatorio 84 cm com espaco para joelhos, torneira de alavanca, mesmo piso, sem botao de emergencia
- Comunicacao: menu digital, menu com fotografias, pessoal nao formado, sem anel de inducao
- Verificacao: `community_verified`, ultima verificacao ha 4 meses

### 8.2 Calculo passo a passo

**Pesos para cadeira electrica (seccao 2.2):**
Entrada=0.25, Estacionamento=0.10, Interior=0.20, Mesas=0.10, WC=0.30, Comunicacao=0.05

#### Categoria: Entrada

| Subcritrio | Calculo | Score |
|---|---|---|
| `accessible_entrance_score` | `has_accessible = true`, `has_level_entrance = true` | 100 |
| `door_width_score` | 85 >= 68 + 15 (83) => sim | 100 |
| `step_score` | `num_steps = 0` | 100 |
| `surface_score` | `smooth` | 100 |
| `ramp_quality_score` | Sem degraus (entrada ao nivel) | 100 |
| `lighting_score` | `well_lit` | 100 |

```
entrance_score = 100×0.30 + 100×0.20 + 100×0.25 + 100×0.10 + 100×0.10 + 100×0.05 = 100.0
```

#### Categoria: Estacionamento

| Subcritrio | Calculo | Score |
|---|---|---|
| `accessible_parking_score` | 1 lugar acessivel | 80 |
| `distance_score` | 30 m <= 50 | 80 |
| `space_width_score` | 300 >= 280 | 60 |
| `access_aisle_score` | `has_aisle = true`, 130 >= 120 | 70 |
| `parking_surface_score` | `asphalt` | 100 |
| `dropoff_score` | `has_dropoff = false` | 0 |

```
parking_score = 80×0.35 + 80×0.20 + 60×0.15 + 70×0.15 + 100×0.10 + 0×0.05
             = 28.0 + 16.0 + 9.0 + 10.5 + 10.0 + 0.0 = 73.5
```

#### Categoria: Interior

| Subcritrio | Calculo | Score |
|---|---|---|
| `corridor_width_score` | 110 >= 90 => 65. Personalizado: 110 >= 68+10=78 => largura OK; uso tabela: 110 >= 90 | 65 |
| `floor_score` | `wood` + `is_non_slip` = 75 + 15 = 90 | 90 |
| `turning_space_score` | 155 >= 150+0; 155 >= ref(150)+10? Nao (155 < 160). 155 >= ref(150)? Sim | 70 |
| `counter_height_score` | 95 <= 100, `has_low_counter = false` | 30 |
| `interior_steps_score` | `has_interior_steps = false` | 100 |
| `elevator_score` | Piso unico | 100 |

```
interior_score = 65×0.25 + 90×0.15 + 70×0.30 + 30×0.10 + 100×0.15 + 100×0.05
              = 16.25 + 13.5 + 21.0 + 3.0 + 15.0 + 5.0 = 73.75
```

#### Categoria: Mesas

| Subcritrio | Calculo | Score |
|---|---|---|
| `accessible_tables_score` | 3 mesas >= 2 | 80 |
| `table_height_score` | 75 cm, 71 <= 75 <= 86 | 100 |
| `under_clearance_score` | 70 >= 68.5 | 80 |
| `spacing_score` | 100 >= 90 | 75 |
| `outdoor_score` | Esplanada acessivel | 100 |

```
seating_score = 80×0.25 + 100×0.20 + 80×0.25 + 75×0.20 + 100×0.10
             = 20.0 + 20.0 + 20.0 + 15.0 + 10.0 = 85.0
```

#### Categoria: Casa de Banho

| Subcritrio | Calculo | Score |
|---|---|---|
| `accessible_bathroom_score` | `has_accessible = true` | 100 |
| `bathroom_door_width_score` | 75 >= 68+5 (73)? Sim, 75 >= 73 => 75. 75 >= 68+15 (83)? Nao | 75 |
| `turning_space_score` | 140 vs ref 150: 140 >= 150-10 (140) => sim, 140 >= 150? Nao | 45 |
| `grab_bars_score` | `has_grab_bars`, lado esquerdo = transfer_side esquerdo | 90 |
| `toilet_height_score` | 45 cm, 43 <= 45 <= 48 | 100 |
| `sink_score` | 84 <= 86 (40) + knee_space (30) + lever (25) = 95 | 95 |
| `same_floor_score` | Mesmo piso | 100 |
| `emergency_button_score` | `has_emergency = false` | 0 |

```
bathroom_score = 100×0.20 + 75×0.15 + 45×0.20 + 90×0.15 + 100×0.10 + 95×0.10 + 100×0.05 + 0×0.05
              = 20.0 + 11.25 + 9.0 + 13.5 + 10.0 + 9.5 + 5.0 + 0.0 = 78.25
```

#### Categoria: Comunicacao

| Subcritrio | Calculo | Score |
|---|---|---|
| `menu_format_score` | digital (+35) + picture (+25) = 60 | 60 |
| `staff_training_score` | `trained = false` | 0 |
| `signage_score` | Nenhum: 0 | 0 |

```
communication_score = 60×0.40 + 0×0.35 + 0×0.25 = 24.0
```

#### Pontuacao personalizada final

```
score = entrance(100.0)  × 0.25 +
        parking(73.5)    × 0.10 +
        interior(73.75)  × 0.20 +
        seating(85.0)    × 0.10 +
        bathroom(78.25)  × 0.30 +
        communication(24.0) × 0.05

     = 25.0 + 7.35 + 14.75 + 8.5 + 23.475 + 1.2
     = 80.275
```

Multiplicador de verificacao: `community_verified` = 0.90, ha 4 meses = decay 1.00.
Multiplicador efectivo = 0.90 x 1.00 = 0.90.

```
pontuacao_final = 80.275 × 0.90 = 72.25
```

**Resultado:** 72/100 -- AMARELO

**Avisos gerados:**
- Aviso: Porta da casa de banho tem 75 cm (sua cadeira: 68 cm, margem de apenas 7 cm)
- Aviso critico: Espaco de rotacao na casa de banho e 140 cm (necessario: 150 cm -- apertado!)
- OK: Entrada ao nivel sem degraus
- OK: Porta da entrada tem 85 cm (folga de 17 cm)
- OK: Barras de apoio do lado correcto (esquerdo)

---

## 9. Apresentacao Visual

### 9.1 Vista resumida (cartao na lista de resultados)

```
+------------------------------------------------------------------+
|  RESTAURANTE EXEMPLO                          [AMARELO] 72/100   |
|  Cozinha portuguesa | $$$ | 1.2 km                               |
|                                                                  |
|  Para a sua cadeira (68 cm):                                     |
|  ! Casa de banho: espaco de rotacao apertado (140 cm / 150 cm)   |
|  OK Entrada ao nivel sem barreiras                                |
+------------------------------------------------------------------+
```

Componentes:
- **Badge de pontuacao** com cor do semaforo e valor numrico
- **Indicador "Para a sua cadeira"** com 1-2 alertas ou confirmacoes mais relevantes
- **Tipo de cozinha, gama de preco e distancia** como contexto

### 9.2 Vista detalhada (pagina do restaurante)

```
+------------------------------------------------------------------+
|                    PONTUACAO DE ACESSIBILIDADE                    |
+------------------------------------------------------------------+
|                                                                  |
|  Pontuacao Global: 78/100 [VERDE]                                |
|  Pontuacao para Si: 72/100 [AMARELO]                             |
|  Confianca: Verificado pela comunidade (4 meses)                |
|                                                                  |
|  Entrada         ████████████████████░░  100/100 [VERDE]         |
|  Estacionamento  ██████████████░░░░░░░░   73/100 [AMARELO]       |
|  Interior        ██████████████░░░░░░░░   74/100 [AMARELO]       |
|  Mesas           ████████████████░░░░░░   85/100 [VERDE]         |
|  Casa de Banho   ███████████████░░░░░░░   78/100 [VERDE]         |
|  Comunicacao     █████░░░░░░░░░░░░░░░░░   24/100 [VERMELHO]      |
|                                                                  |
+------------------------------------------------------------------+
|  AVISOS PARA O SEU PERFIL                                        |
|                                                                  |
|  ! Espaco de rotacao na WC: 140 cm (precisa de 150 cm)          |
|  ! Porta da WC: 75 cm (cadeira 68 cm, margem de 7 cm)           |
|  OK Entrada ao nivel, porta 85 cm (folga 17 cm)                  |
|  OK Barras de apoio do lado correcto (esquerdo)                  |
|  OK 3 mesas acessiveis, altura 75 cm                             |
+------------------------------------------------------------------+
|  INDICADOR DE CONFIANCA                                          |
|                                                                  |
|  Fonte: Comunidade (3 reportes concordantes)                     |
|  Ultima verificacao: Novembro 2025 (4 meses)                    |
|  Proximo decay: Julho 2026 (6 meses)                            |
+------------------------------------------------------------------+
```

### 9.3 Componentes visuais

| Componente | Descricao |
|---|---|
| Badge de pontuacao global | Circulo com cor do semaforo, numero grande, texto "para si" ou "global" |
| Barras de categoria | Barras horizontais proporcionais com cor do semaforo da categoria |
| Lista de avisos | Icones de aviso (!) e confirmacao (OK) com texto conciso |
| Comparacao global vs personalizada | Dois badges lado a lado quando diferem significativamente (>10 pontos) |
| Indicador de confianca | Badge textual com fonte, data e proximo decay |

---

## 10. Tabela de Referencia de Medidas

### 10.1 Dimensoes tipicas de equipamentos de mobilidade

| Equipamento | Largura (cm) | Comprimento (cm) | Peso c/ utilizador (kg) | Raio de viragem (cm) |
|---|---|---|---|---|
| Cadeira electrica (standard) | 60 - 68 | 100 - 110 | 120 - 180 | 150 - 170 |
| Cadeira electrica (larga/bariatrica) | 68 - 80 | 105 - 120 | 180 - 250 | 170 - 200 |
| Cadeira manual (standard) | 55 - 65 | 90 - 110 | 70 - 120 | 120 - 150 |
| Cadeira manual (desportiva) | 50 - 60 | 80 - 100 | 60 - 100 | 100 - 130 |
| Scooter motorizado (3 rodas) | 55 - 65 | 120 - 140 | 130 - 200 | 180 - 220 |
| Scooter motorizado (4 rodas) | 55 - 70 | 125 - 145 | 140 - 220 | 200 - 250 |
| Andarilho / rollator | 55 - 65 | 60 - 75 | N/A | 80 - 100 |

### 10.2 Limiares normativos por criterio

| Criterio | ADA | ISO 21542 | DL 163/2006 (PT) | Recomendado | Minimo aceitavel | Inaceitavel |
|---|---|---|---|---|---|---|
| Largura da porta | >= 81.3 cm | >= 80 cm | >= 77 cm | >= 90 cm | >= 80 cm | < 75 cm |
| Inclinacao da rampa | <= 8.33% | <= 6% (ideal) | <= 6% (ideal), max 8% | <= 6% | <= 8% | > 12% |
| Largura da rampa | >= 91.4 cm | >= 120 cm | >= 120 cm | >= 120 cm | >= 90 cm | < 90 cm |
| Espaco de rotacao | >= 152 cm | >= 150 cm | >= 150 cm | >= 170 cm | >= 150 cm | < 130 cm |
| Largura do corredor | >= 91.4 cm | >= 120 cm | >= 120 cm | >= 120 cm | >= 90 cm | < 70 cm |
| Altura da mesa | 71-86 cm | 71-86 cm | -- | 73-80 cm | 68-90 cm | < 65 ou > 95 |
| Espaco livre sob mesa | >= 68.5 cm | >= 70 cm | -- | >= 73 cm | >= 68 cm | < 60 cm |
| Espaco entre mesas | -- | >= 90 cm | >= 90 cm | >= 120 cm | >= 90 cm | < 60 cm |
| Largura porta WC | >= 81.3 cm | >= 80 cm | >= 77 cm | >= 90 cm | >= 80 cm | < 75 cm |
| Espaco rotacao WC | >= 152 cm | >= 150 cm | >= 150 cm | >= 170 cm | >= 150 cm | < 130 cm |
| Altura da sanita | 43-48 cm | 43-48 cm | 45-50 cm | 45-48 cm | 40-52 cm | < 36 ou > 56 |
| Altura do lavatorio | <= 86 cm | <= 85 cm | <= 80 cm | <= 80 cm | <= 86 cm | > 91 cm |
| Lugar estacion. acessivel | >= 244 cm | >= 250 cm | >= 250 cm | >= 330 cm | >= 244 cm | < 244 cm |
| Corredor acesso estacion. | >= 152 cm | >= 120 cm | >= 120 cm | >= 152 cm | >= 120 cm | < 100 cm |

---

## 11. Implementacao TypeScript

### 11.1 Tipos e interfaces

```typescript
// src/lib/accessibility-scoring/types.ts

export type MobilityType =
  | "electric_wheelchair"
  | "manual_wheelchair"
  | "scooter"
  | "walker"
  | "crutches"
  | "cane"
  | "reduced_mobility"
  | "none"
  | "other";

export type VerificationStatus =
  | "unverified"
  | "community_verified"
  | "professionally_verified";

export type DataSource = "owner" | "community" | "import" | "ai_analysis";

export type TrafficLight = "green" | "yellow" | "red" | "grey";

export type ScoringCategory =
  | "entrance"
  | "parking"
  | "interior"
  | "seating"
  | "bathroom"
  | "communication";

export interface CategoryWeights {
  entrance: number;
  parking: number;
  interior: number;
  seating: number;
  bathroom: number;
  communication: number;
}

export interface UserProfile {
  mobilityType: MobilityType;
  wheelchairWidth?: number; // cm
  wheelchairLength?: number; // cm
  turningRadiusNeeded?: number; // cm
  maxRampIncline?: number; // percentagem
  maxStepHeight?: number; // cm
  needsElevator: boolean;
  needsAccessibleBathroom: boolean;
  bathroomTransferSide?: "left" | "right" | "both" | "not_applicable";
  maxDistanceFromParking?: number; // metros
}

export interface RestaurantAccessibilityProfile {
  // Entrada
  hasAccessibleEntrance?: boolean;
  entranceDoorWidth?: number;
  entranceType?: string;
  hasLevelEntrance?: boolean;
  hasRamp?: boolean;
  rampIncline?: number;
  rampHasHandrails?: boolean;
  numberOfSteps?: number;
  stepHeight?: number;
  hasPortableRamp?: boolean;
  exteriorSurfaceType?: string;
  entranceLighting?: string;

  // Estacionamento
  hasAccessibleParking?: boolean;
  accessibleParkingSpaces?: number;
  parkingDistanceToEntrance?: number;
  parkingSpaceWidth?: number;
  hasAdjacentAccessAisle?: boolean;
  accessAisleWidth?: number;
  parkingSurfaceType?: string;
  hasDropoffArea?: boolean;

  // Interior
  corridorMinWidth?: number;
  hasElevator?: boolean;
  elevatorDoorWidth?: number;
  elevatorCabinWidth?: number;
  elevatorCabinDepth?: number;
  floorType?: string;
  isNonSlip?: boolean;
  hasInteriorSteps?: boolean;
  interiorStepCount?: number;
  turningSpaceAvailable?: number;
  counterHeight?: number;
  hasLowCounter?: boolean;

  // Mesas
  hasAccessibleTables?: boolean;
  accessibleTableCount?: number;
  tableHeight?: number;
  underTableClearance?: number;
  spaceBetweenTables?: number;
  hasOutdoorSeating?: boolean;
  outdoorSeatingAccessible?: boolean;

  // Casa de banho
  hasAccessibleBathroom?: boolean;
  bathroomDoorWidth?: number;
  bathroomTurningSpace?: number;
  hasGrabBars?: boolean;
  grabBarSide?: string;
  toiletSeatHeight?: number;
  sinkHeight?: number;
  hasKneeSpaceUnderSink?: boolean;
  faucetType?: string;
  hasMirrorAtWheelchairHeight?: boolean;
  hasEmergencyButton?: boolean;
  bathroomOnSameFloor?: boolean;

  // Comunicacao
  hasBrailleMenu?: boolean;
  hasLargePrintMenu?: boolean;
  hasDigitalMenu?: boolean;
  hasQRCodeMenu?: boolean;
  hasPictureMenu?: boolean;
  staffTrainedInAccessibility?: boolean;
  hasHearingLoop?: boolean;

  // Metadados
  verificationStatus: VerificationStatus;
  dataSource: DataSource;
  lastVerifiedAt?: Date;
}

export interface CategoryScore {
  category: ScoringCategory;
  score: number; // 0-100
  trafficLight: TrafficLight;
  subcriteria: SubcriterionScore[];
  dataCompleteness: number; // 0-1 (percentagem de campos preenchidos)
}

export interface SubcriterionScore {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  value?: string | number | boolean; // valor original
  threshold?: string; // limiar utilizado
}

export interface OverallScore {
  globalScore: number; // 0-100
  personalizedScore?: number; // 0-100 (se perfil fornecido)
  globalTrafficLight: TrafficLight;
  personalizedTrafficLight?: TrafficLight;
  categoryScores: CategoryScore[];
  verificationMultiplier: number;
  warnings: Warning[];
  explanation: string;
}

export interface Warning {
  severity: "critical" | "warning" | "info";
  category: ScoringCategory;
  message: string;
  actualValue?: number;
  requiredValue?: number;
}
```

### 11.2 Funcoes de pontuacao

```typescript
// src/lib/accessibility-scoring/scoring.ts

import type {
  CategoryScore,
  CategoryWeights,
  DataSource,
  MobilityType,
  OverallScore,
  RestaurantAccessibilityProfile,
  ScoringCategory,
  SubcriterionScore,
  TrafficLight,
  UserProfile,
  Warning,
} from "./types";

// --- Constantes ---

const GLOBAL_REF_DOOR_WIDTH = 80; // cm (ISO 21542)
const GLOBAL_REF_TURNING_SPACE = 152; // cm (ADA 304.3.1)

const VERIFICATION_MULTIPLIERS: Record<string, number> = {
  professionally_verified: 1.0,
  community_verified: 0.9,
  owner_unverified: 0.75,
  ai_analysis: 0.6,
  community_unverified: 0.5,
};

// --- Pesos por tipo de mobilidade ---

export function getPersonalizedWeights(
  mobilityType: MobilityType,
): CategoryWeights {
  const weights: Record<MobilityType, CategoryWeights> = {
    electric_wheelchair: {
      entrance: 0.25,
      parking: 0.1,
      interior: 0.2,
      seating: 0.1,
      bathroom: 0.3,
      communication: 0.05,
    },
    manual_wheelchair: {
      entrance: 0.25,
      parking: 0.1,
      interior: 0.2,
      seating: 0.15,
      bathroom: 0.25,
      communication: 0.05,
    },
    scooter: {
      entrance: 0.2,
      parking: 0.15,
      interior: 0.3,
      seating: 0.1,
      bathroom: 0.2,
      communication: 0.05,
    },
    walker: {
      entrance: 0.2,
      parking: 0.1,
      interior: 0.25,
      seating: 0.15,
      bathroom: 0.25,
      communication: 0.05,
    },
    crutches: {
      entrance: 0.3,
      parking: 0.1,
      interior: 0.2,
      seating: 0.1,
      bathroom: 0.25,
      communication: 0.05,
    },
    cane: {
      entrance: 0.25,
      parking: 0.1,
      interior: 0.2,
      seating: 0.15,
      bathroom: 0.2,
      communication: 0.1,
    },
    reduced_mobility: {
      entrance: 0.2,
      parking: 0.15,
      interior: 0.2,
      seating: 0.15,
      bathroom: 0.2,
      communication: 0.1,
    },
    none: {
      entrance: 0.25,
      parking: 0.1,
      interior: 0.2,
      seating: 0.15,
      bathroom: 0.25,
      communication: 0.05,
    },
    other: {
      entrance: 0.25,
      parking: 0.1,
      interior: 0.2,
      seating: 0.15,
      bathroom: 0.25,
      communication: 0.05,
    },
  };
  return weights[mobilityType];
}

// --- Semaforo ---

export function getTrafficLight(score: number): TrafficLight {
  if (score >= 75) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

// --- Multiplicador de verificacao ---

export function applyVerificationMultiplier(
  score: number,
  verificationStatus: VerificationStatus,
  dataSource: DataSource,
  lastVerifiedAt?: Date,
): number {
  // Determinar multiplicador base
  let key: string;
  if (verificationStatus === "professionally_verified") {
    key = "professionally_verified";
  } else if (verificationStatus === "community_verified") {
    key = "community_verified";
  } else if (dataSource === "owner") {
    key = "owner_unverified";
  } else if (dataSource === "ai_analysis") {
    key = "ai_analysis";
  } else {
    key = "community_unverified";
  }

  const baseMultiplier = VERIFICATION_MULTIPLIERS[key];

  // Aplicar decay temporal
  const decayFactor = calculateDecayFactor(lastVerifiedAt);
  const effectiveMultiplier = baseMultiplier * decayFactor;

  return score * effectiveMultiplier;
}

function calculateDecayFactor(lastVerifiedAt?: Date): number {
  if (!lastVerifiedAt) return 0.5; // sem data = maximo decay

  const now = new Date();
  const monthsDiff =
    (now.getTime() - lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);

  return Math.max(0.5, 1.0 - monthsDiff / 48);
}

// --- Funcoes de subcritrios ---

function doorWidthScore(doorWidth: number | undefined, refWidth: number): number {
  if (doorWidth == null) return 0;
  if (doorWidth >= refWidth + 15) return 100;
  if (doorWidth >= refWidth + 5) return 75;
  if (doorWidth >= refWidth) return 50;
  if (doorWidth >= refWidth - 5) return 25;
  return 0;
}

function turningSpaceScore(
  space: number | undefined,
  refSpace: number,
): number {
  if (space == null) return 0;
  if (space >= refSpace + 30) return 100;
  if (space >= refSpace + 10) return 85;
  if (space >= refSpace) return 70;
  if (space >= refSpace - 10) return 45;
  if (space >= refSpace - 20) return 25;
  return 0;
}

// --- Calculo por categoria ---

export function calculateCategoryScore(
  category: ScoringCategory,
  restaurant: RestaurantAccessibilityProfile,
  userProfile?: UserProfile,
): CategoryScore {
  switch (category) {
    case "entrance":
      return calculateEntranceScore(restaurant, userProfile);
    case "parking":
      return calculateParkingScore(restaurant, userProfile);
    case "interior":
      return calculateInteriorScore(restaurant, userProfile);
    case "seating":
      return calculateSeatingScore(restaurant, userProfile);
    case "bathroom":
      return calculateBathroomScore(restaurant, userProfile);
    case "communication":
      return calculateCommunicationScore(restaurant);
    default:
      throw new Error(`Categoria desconhecida: ${category}`);
  }
}

function calculateEntranceScore(
  r: RestaurantAccessibilityProfile,
  user?: UserProfile,
): CategoryScore {
  const refWidth = user?.wheelchairWidth ?? GLOBAL_REF_DOOR_WIDTH;
  const subcriteria: SubcriterionScore[] = [];

  // accessible_entrance_score
  let accessibleScore = 0;
  if (r.hasAccessibleEntrance && r.hasLevelEntrance) accessibleScore = 100;
  else if (r.hasAccessibleEntrance && r.hasRamp) accessibleScore = 80;
  else if (r.hasAccessibleEntrance) accessibleScore = 60;
  else if (r.hasPortableRamp) accessibleScore = 40;
  else if (r.hasAccessibleEntrance === false) accessibleScore = 0;
  subcriteria.push({
    name: "Entrada acessivel",
    score: accessibleScore,
    weight: 0.3,
    value: r.hasAccessibleEntrance,
  });

  // door_width_score
  const doorScore = doorWidthScore(r.entranceDoorWidth, refWidth);
  subcriteria.push({
    name: "Largura da porta",
    score: doorScore,
    weight: 0.2,
    value: r.entranceDoorWidth,
    threshold: `ref: ${refWidth} cm`,
  });

  // step_score
  let stepScore = 0;
  if (!r.numberOfSteps || r.numberOfSteps === 0) stepScore = 100;
  else if (r.numberOfSteps > 0 && r.hasRamp) stepScore = 80;
  else if (r.numberOfSteps === 1 && (r.stepHeight ?? 99) <= 2) stepScore = 60;
  else if (r.numberOfSteps > 0 && r.hasPortableRamp) stepScore = 40;
  else if (r.numberOfSteps === 1 && (r.stepHeight ?? 99) <= 5) stepScore = 20;
  else if (r.numberOfSteps === 1) stepScore = 5;
  else stepScore = 0;
  subcriteria.push({
    name: "Degraus",
    score: stepScore,
    weight: 0.25,
    value: r.numberOfSteps,
  });

  // surface_score
  const surfaceScores: Record<string, number> = {
    smooth: 100,
    cobblestone: 30,
    gravel: 20,
    uneven: 15,
    grass: 10,
  };
  const surfScore = r.exteriorSurfaceType
    ? (surfaceScores[r.exteriorSurfaceType] ?? 40)
    : 0;
  subcriteria.push({
    name: "Superficie exterior",
    score: surfScore,
    weight: 0.1,
    value: r.exteriorSurfaceType,
  });

  // ramp_quality_score
  let rampScore = 100; // default: sem degraus
  if (r.numberOfSteps && r.numberOfSteps > 0) {
    if (!r.hasRamp && !r.hasPortableRamp) {
      rampScore = 0;
    } else if (r.hasRamp && r.rampIncline != null) {
      if (r.rampIncline <= 6 && r.rampHasHandrails) rampScore = 100;
      else if (r.rampIncline <= 6) rampScore = 85;
      else if (r.rampIncline <= 8 && r.rampHasHandrails) rampScore = 80;
      else if (r.rampIncline <= 8) rampScore = 65;
      else if (r.rampIncline <= 10 && r.rampHasHandrails) rampScore = 50;
      else if (r.rampIncline <= 10) rampScore = 35;
      else if (r.rampIncline <= 12) rampScore = 20;
      else rampScore = 5;
    }
  }
  subcriteria.push({
    name: "Qualidade da rampa",
    score: rampScore,
    weight: 0.1,
    value: r.rampIncline,
  });

  // lighting_score
  const lightingScores: Record<string, number> = {
    well_lit: 100,
    moderate: 60,
    poor: 20,
  };
  const lightScore = r.entranceLighting
    ? (lightingScores[r.entranceLighting] ?? 50)
    : 0;
  subcriteria.push({
    name: "Iluminacao",
    score: lightScore,
    weight: 0.05,
    value: r.entranceLighting,
  });

  const totalScore = subcriteria.reduce(
    (sum, s) => sum + s.score * s.weight,
    0,
  );
  const filledFields = [
    r.hasAccessibleEntrance,
    r.entranceDoorWidth,
    r.numberOfSteps,
    r.exteriorSurfaceType,
    r.hasRamp,
    r.entranceLighting,
  ].filter((f) => f != null).length;

  return {
    category: "entrance",
    score: Math.round(totalScore * 100) / 100,
    trafficLight: getTrafficLight(totalScore),
    subcriteria,
    dataCompleteness: filledFields / 6,
  };
}

function calculateParkingScore(
  r: RestaurantAccessibilityProfile,
  _user?: UserProfile,
): CategoryScore {
  const subcriteria: SubcriterionScore[] = [];

  // accessible_parking_score
  let parkScore = 0;
  if (r.accessibleParkingSpaces != null && r.accessibleParkingSpaces >= 2)
    parkScore = 100;
  else if (r.accessibleParkingSpaces === 1) parkScore = 80;
  else if (r.hasAccessibleParking === false) parkScore = 30;
  else parkScore = 0;
  subcriteria.push({
    name: "Lugares acessiveis",
    score: parkScore,
    weight: 0.35,
    value: r.accessibleParkingSpaces,
  });

  // distance_score
  let distScore = 0;
  if (r.parkingDistanceToEntrance != null) {
    if (r.parkingDistanceToEntrance <= 20) distScore = 100;
    else if (r.parkingDistanceToEntrance <= 50) distScore = 80;
    else if (r.parkingDistanceToEntrance <= 100) distScore = 50;
    else if (r.parkingDistanceToEntrance <= 200) distScore = 25;
    else distScore = 10;
  }
  subcriteria.push({
    name: "Distancia a entrada",
    score: distScore,
    weight: 0.2,
    value: r.parkingDistanceToEntrance,
  });

  // space_width_score
  let widthScore = 0;
  if (r.parkingSpaceWidth != null) {
    if (r.parkingSpaceWidth >= 370) widthScore = 100;
    else if (r.parkingSpaceWidth >= 330) widthScore = 80;
    else if (r.parkingSpaceWidth >= 280) widthScore = 60;
    else if (r.parkingSpaceWidth >= 244) widthScore = 40;
    else widthScore = 10;
  }
  subcriteria.push({
    name: "Largura do lugar",
    score: widthScore,
    weight: 0.15,
    value: r.parkingSpaceWidth,
  });

  // access_aisle_score
  let aisleScore = 0;
  if (r.hasAdjacentAccessAisle && r.accessAisleWidth != null) {
    if (r.accessAisleWidth >= 152) aisleScore = 100;
    else if (r.accessAisleWidth >= 120) aisleScore = 70;
    else aisleScore = 40;
  }
  subcriteria.push({
    name: "Corredor de acesso",
    score: aisleScore,
    weight: 0.15,
    value: r.accessAisleWidth,
  });

  // parking_surface_score
  const surfaceScores: Record<string, number> = {
    asphalt: 100,
    concrete: 100,
    cobblestone: 40,
    gravel: 20,
    other: 30,
  };
  const surfScore = r.parkingSurfaceType
    ? (surfaceScores[r.parkingSurfaceType] ?? 30)
    : 0;
  subcriteria.push({
    name: "Superficie do parque",
    score: surfScore,
    weight: 0.1,
    value: r.parkingSurfaceType,
  });

  // dropoff_score
  const dropScore = r.hasDropoffArea ? 100 : 0;
  subcriteria.push({
    name: "Zona de largada",
    score: dropScore,
    weight: 0.05,
    value: r.hasDropoffArea,
  });

  const totalScore = subcriteria.reduce(
    (sum, s) => sum + s.score * s.weight,
    0,
  );
  const filledFields = [
    r.hasAccessibleParking,
    r.parkingDistanceToEntrance,
    r.parkingSpaceWidth,
    r.hasAdjacentAccessAisle,
    r.parkingSurfaceType,
    r.hasDropoffArea,
  ].filter((f) => f != null).length;

  return {
    category: "parking",
    score: Math.round(totalScore * 100) / 100,
    trafficLight: getTrafficLight(totalScore),
    subcriteria,
    dataCompleteness: filledFields / 6,
  };
}

function calculateInteriorScore(
  r: RestaurantAccessibilityProfile,
  user?: UserProfile,
): CategoryScore {
  const refTurning = user?.turningRadiusNeeded ?? GLOBAL_REF_TURNING_SPACE;
  const subcriteria: SubcriterionScore[] = [];

  // corridor_width_score
  let corridorScore = 0;
  if (r.corridorMinWidth != null) {
    if (r.corridorMinWidth >= 150) corridorScore = 100;
    else if (r.corridorMinWidth >= 120) corridorScore = 85;
    else if (r.corridorMinWidth >= 90) corridorScore = 65;
    else if (r.corridorMinWidth >= 80) corridorScore = 40;
    else if (r.corridorMinWidth >= 70) corridorScore = 15;
    else corridorScore = 0;
  }
  subcriteria.push({
    name: "Largura do corredor",
    score: corridorScore,
    weight: 0.25,
    value: r.corridorMinWidth,
  });

  // floor_score
  let floorScore = 0;
  if (r.floorType) {
    const baseScores: Record<string, number> = {
      smooth_tile: 80,
      wood: 75,
      concrete: 70,
      carpet: 50,
      uneven: 15,
      other: 40,
    };
    const bonusScores: Record<string, number> = {
      smooth_tile: 20,
      wood: 15,
      concrete: 20,
      carpet: 0,
      uneven: 10,
      other: 15,
    };
    floorScore = (baseScores[r.floorType] ?? 40) +
      (r.isNonSlip ? (bonusScores[r.floorType] ?? 10) : 0);
  }
  subcriteria.push({
    name: "Tipo de piso",
    score: floorScore,
    weight: 0.15,
    value: r.floorType,
  });

  // turning_space_score
  const turnScore = turningSpaceScore(r.turningSpaceAvailable, refTurning);
  subcriteria.push({
    name: "Espaco de rotacao",
    score: turnScore,
    weight: 0.3,
    value: r.turningSpaceAvailable,
    threshold: `ref: ${refTurning} cm`,
  });

  // counter_height_score
  let counterScore = 0;
  if (r.counterHeight != null) {
    if (r.hasLowCounter && r.counterHeight <= 86) counterScore = 100;
    else if (r.hasLowCounter && r.counterHeight <= 91) counterScore = 80;
    else if (r.counterHeight <= 91) counterScore = 60;
    else if (r.counterHeight <= 100) counterScore = 30;
    else counterScore = 10;
  }
  subcriteria.push({
    name: "Altura do balcao",
    score: counterScore,
    weight: 0.1,
    value: r.counterHeight,
  });

  // interior_steps_score
  let stepsScore = 100;
  if (r.hasInteriorSteps) {
    if (r.interiorStepCount === 1 && (r.stepHeight ?? 99) <= 2) stepsScore = 60;
    else if (r.interiorStepCount === 1 && (r.stepHeight ?? 99) <= 5) stepsScore = 30;
    else if ((r.interiorStepCount ?? 0) >= 2 && r.hasElevator) stepsScore = 50;
    else stepsScore = 0;
  }
  subcriteria.push({
    name: "Degraus interiores",
    score: stepsScore,
    weight: 0.15,
    value: r.interiorStepCount,
  });

  // elevator_score
  let elevatorScore = 100; // default: piso unico
  if (r.hasInteriorSteps && (r.interiorStepCount ?? 0) >= 2) {
    if (
      r.hasElevator &&
      (r.elevatorDoorWidth ?? 0) >= 91 &&
      (r.elevatorCabinWidth ?? 0) >= 170 &&
      (r.elevatorCabinDepth ?? 0) >= 137
    ) {
      elevatorScore = 100;
    } else if (
      r.hasElevator &&
      (r.elevatorDoorWidth ?? 0) >= 80 &&
      (r.elevatorCabinWidth ?? 0) >= 140 &&
      (r.elevatorCabinDepth ?? 0) >= 120
    ) {
      elevatorScore = 70;
    } else if (r.hasElevator) {
      elevatorScore = 40;
    } else {
      elevatorScore = 0;
    }
  }
  subcriteria.push({
    name: "Elevador",
    score: elevatorScore,
    weight: 0.05,
    value: r.hasElevator,
  });

  const totalScore = subcriteria.reduce(
    (sum, s) => sum + s.score * s.weight,
    0,
  );
  const filledFields = [
    r.corridorMinWidth,
    r.floorType,
    r.turningSpaceAvailable,
    r.counterHeight,
    r.hasInteriorSteps,
    r.hasElevator,
  ].filter((f) => f != null).length;

  return {
    category: "interior",
    score: Math.round(totalScore * 100) / 100,
    trafficLight: getTrafficLight(totalScore),
    subcriteria,
    dataCompleteness: filledFields / 6,
  };
}

function calculateSeatingScore(
  r: RestaurantAccessibilityProfile,
  _user?: UserProfile,
): CategoryScore {
  const subcriteria: SubcriterionScore[] = [];

  // accessible_tables_score
  let tablesScore = 0;
  if (r.hasAccessibleTables) {
    if ((r.accessibleTableCount ?? 0) >= 4) tablesScore = 100;
    else if ((r.accessibleTableCount ?? 0) >= 2) tablesScore = 80;
    else tablesScore = 50;
  }
  subcriteria.push({
    name: "Mesas acessiveis",
    score: tablesScore,
    weight: 0.25,
    value: r.accessibleTableCount,
  });

  // table_height_score
  let heightScore = 0;
  if (r.tableHeight != null) {
    if (r.tableHeight >= 71 && r.tableHeight <= 86) heightScore = 100;
    else if (
      (r.tableHeight >= 68 && r.tableHeight < 71) ||
      (r.tableHeight > 86 && r.tableHeight <= 90)
    )
      heightScore = 70;
    else if (
      (r.tableHeight >= 65 && r.tableHeight < 68) ||
      (r.tableHeight > 90 && r.tableHeight <= 95)
    )
      heightScore = 40;
    else heightScore = 10;
  }
  subcriteria.push({
    name: "Altura da mesa",
    score: heightScore,
    weight: 0.2,
    value: r.tableHeight,
  });

  // under_clearance_score
  let clearanceScore = 0;
  if (r.underTableClearance != null) {
    if (r.underTableClearance >= 73) clearanceScore = 100;
    else if (r.underTableClearance >= 68.5) clearanceScore = 80;
    else if (r.underTableClearance >= 65) clearanceScore = 50;
    else if (r.underTableClearance >= 60) clearanceScore = 25;
    else clearanceScore = 0;
  }
  subcriteria.push({
    name: "Espaco livre sob mesa",
    score: clearanceScore,
    weight: 0.25,
    value: r.underTableClearance,
  });

  // spacing_score
  let spacingScore = 0;
  if (r.spaceBetweenTables != null) {
    if (r.spaceBetweenTables >= 120) spacingScore = 100;
    else if (r.spaceBetweenTables >= 90) spacingScore = 75;
    else if (r.spaceBetweenTables >= 75) spacingScore = 40;
    else if (r.spaceBetweenTables >= 60) spacingScore = 15;
    else spacingScore = 0;
  }
  subcriteria.push({
    name: "Espaco entre mesas",
    score: spacingScore,
    weight: 0.2,
    value: r.spaceBetweenTables,
  });

  // outdoor_score
  let outdoorScore = 50; // default: sem esplanada (nao penalizado)
  if (r.hasOutdoorSeating) {
    outdoorScore = r.outdoorSeatingAccessible ? 100 : 30;
  }
  subcriteria.push({
    name: "Esplanada",
    score: outdoorScore,
    weight: 0.1,
    value: r.hasOutdoorSeating,
  });

  const totalScore = subcriteria.reduce(
    (sum, s) => sum + s.score * s.weight,
    0,
  );
  const filledFields = [
    r.hasAccessibleTables,
    r.tableHeight,
    r.underTableClearance,
    r.spaceBetweenTables,
    r.hasOutdoorSeating,
  ].filter((f) => f != null).length;

  return {
    category: "seating",
    score: Math.round(totalScore * 100) / 100,
    trafficLight: getTrafficLight(totalScore),
    subcriteria,
    dataCompleteness: filledFields / 5,
  };
}

function calculateBathroomScore(
  r: RestaurantAccessibilityProfile,
  user?: UserProfile,
): CategoryScore {
  const refWidth = user?.wheelchairWidth ?? GLOBAL_REF_DOOR_WIDTH;
  const refTurning = user?.turningRadiusNeeded ?? GLOBAL_REF_TURNING_SPACE;
  const subcriteria: SubcriterionScore[] = [];

  // accessible_bathroom_score
  const accessibleScore = r.hasAccessibleBathroom ? 100 : 0;
  subcriteria.push({
    name: "WC acessivel",
    score: accessibleScore,
    weight: 0.2,
    value: r.hasAccessibleBathroom,
  });

  // bathroom_door_width_score
  const doorScore = doorWidthScore(r.bathroomDoorWidth, refWidth);
  subcriteria.push({
    name: "Largura da porta WC",
    score: doorScore,
    weight: 0.15,
    value: r.bathroomDoorWidth,
    threshold: `ref: ${refWidth} cm`,
  });

  // bathroom_turning_space_score
  const turnScore = turningSpaceScore(r.bathroomTurningSpace, refTurning);
  subcriteria.push({
    name: "Espaco de rotacao WC",
    score: turnScore,
    weight: 0.2,
    value: r.bathroomTurningSpace,
    threshold: `ref: ${refTurning} cm`,
  });

  // grab_bars_score
  let grabScore = 0;
  if (r.hasGrabBars) {
    if (r.grabBarSide === "both") grabScore = 100;
    else if (
      user?.bathroomTransferSide &&
      user.bathroomTransferSide !== "not_applicable" &&
      r.grabBarSide === user.bathroomTransferSide
    ) {
      grabScore = 90;
    } else if (
      user?.bathroomTransferSide &&
      user.bathroomTransferSide !== "not_applicable"
    ) {
      grabScore = 50;
    } else {
      grabScore = 70; // pontuacao global (sem perfil)
    }
  }
  subcriteria.push({
    name: "Barras de apoio",
    score: grabScore,
    weight: 0.15,
    value: r.grabBarSide,
  });

  // toilet_height_score
  let toiletScore = 0;
  if (r.toiletSeatHeight != null) {
    if (r.toiletSeatHeight >= 43 && r.toiletSeatHeight <= 48) toiletScore = 100;
    else if (
      (r.toiletSeatHeight >= 40 && r.toiletSeatHeight < 43) ||
      (r.toiletSeatHeight > 48 && r.toiletSeatHeight <= 52)
    )
      toiletScore = 70;
    else if (
      (r.toiletSeatHeight >= 36 && r.toiletSeatHeight < 40) ||
      (r.toiletSeatHeight > 52 && r.toiletSeatHeight <= 56)
    )
      toiletScore = 40;
    else toiletScore = 10;
  }
  subcriteria.push({
    name: "Altura da sanita",
    score: toiletScore,
    weight: 0.1,
    value: r.toiletSeatHeight,
  });

  // sink_score
  let sinkScore = 0;
  if (r.sinkHeight != null) {
    if (r.sinkHeight <= 86) sinkScore += 40;
    else if (r.sinkHeight <= 91) sinkScore += 25;
    else sinkScore += 5;
  }
  if (r.hasKneeSpaceUnderSink) sinkScore += 30;
  if (r.faucetType === "sensor") sinkScore += 30;
  else if (r.faucetType === "lever") sinkScore += 25;
  else if (r.faucetType === "knob") sinkScore += 10;
  subcriteria.push({
    name: "Lavatorio",
    score: Math.min(100, sinkScore),
    weight: 0.1,
    value: r.sinkHeight,
  });

  // same_floor_score
  let floorScore = 100;
  if (r.bathroomOnSameFloor === false) {
    floorScore = r.hasElevator ? 50 : 0;
  }
  subcriteria.push({
    name: "Mesmo piso",
    score: floorScore,
    weight: 0.05,
    value: r.bathroomOnSameFloor,
  });

  // emergency_button_score
  const emergencyScore = r.hasEmergencyButton ? 100 : 0;
  subcriteria.push({
    name: "Botao de emergencia",
    score: emergencyScore,
    weight: 0.05,
    value: r.hasEmergencyButton,
  });

  const totalScore = subcriteria.reduce(
    (sum, s) => sum + s.score * s.weight,
    0,
  );
  const filledFields = [
    r.hasAccessibleBathroom,
    r.bathroomDoorWidth,
    r.bathroomTurningSpace,
    r.hasGrabBars,
    r.toiletSeatHeight,
    r.sinkHeight,
    r.bathroomOnSameFloor,
    r.hasEmergencyButton,
  ].filter((f) => f != null).length;

  return {
    category: "bathroom",
    score: Math.round(totalScore * 100) / 100,
    trafficLight: getTrafficLight(totalScore),
    subcriteria,
    dataCompleteness: filledFields / 8,
  };
}

function calculateCommunicationScore(
  r: RestaurantAccessibilityProfile,
): CategoryScore {
  const subcriteria: SubcriterionScore[] = [];

  // menu_format_score
  let menuScore = 0;
  if (r.hasDigitalMenu || r.hasQRCodeMenu) menuScore += 35;
  if (r.hasLargePrintMenu) menuScore += 25;
  if (r.hasPictureMenu) menuScore += 25;
  if (r.hasBrailleMenu) menuScore += 15;
  menuScore = Math.min(100, menuScore);
  subcriteria.push({
    name: "Formatos de ementa",
    score: menuScore,
    weight: 0.4,
    value: menuScore > 0,
  });

  // staff_training_score
  const staffScore = r.staffTrainedInAccessibility ? 100 : 0;
  subcriteria.push({
    name: "Formacao do pessoal",
    score: staffScore,
    weight: 0.35,
    value: r.staffTrainedInAccessibility,
  });

  // signage_score
  let signageScore = 0;
  if (r.hasHearingLoop) signageScore += 50;
  if (r.hasMirrorAtWheelchairHeight) signageScore += 50;
  subcriteria.push({
    name: "Sinalizacao e auxilios",
    score: signageScore,
    weight: 0.25,
    value: signageScore > 0,
  });

  const totalScore = subcriteria.reduce(
    (sum, s) => sum + s.score * s.weight,
    0,
  );
  const filledFields = [
    r.hasDigitalMenu ?? r.hasQRCodeMenu,
    r.staffTrainedInAccessibility,
    r.hasHearingLoop,
  ].filter((f) => f != null).length;

  return {
    category: "communication",
    score: Math.round(totalScore * 100) / 100,
    trafficLight: getTrafficLight(totalScore),
    subcriteria,
    dataCompleteness: filledFields / 3,
  };
}

// --- Pontuacao global ---

export function calculateOverallScore(
  restaurant: RestaurantAccessibilityProfile,
  userProfile?: UserProfile,
  customWeights?: CategoryWeights,
): OverallScore {
  const categories: ScoringCategory[] = [
    "entrance",
    "parking",
    "interior",
    "seating",
    "bathroom",
    "communication",
  ];

  // Calcular score por categoria
  const categoryScores = categories.map((cat) =>
    calculateCategoryScore(cat, restaurant, userProfile),
  );

  // Pesos
  const baseWeights: CategoryWeights = {
    entrance: 0.25,
    parking: 0.1,
    interior: 0.2,
    seating: 0.15,
    bathroom: 0.25,
    communication: 0.05,
  };

  const personalizedWeights =
    customWeights ??
    (userProfile
      ? getPersonalizedWeights(userProfile.mobilityType)
      : baseWeights);

  // Pontuacao global (pesos base)
  const globalScore = categoryScores.reduce(
    (sum, cs) => sum + cs.score * baseWeights[cs.category],
    0,
  );

  // Pontuacao personalizada (pesos ajustados)
  const personalizedRawScore = userProfile
    ? categoryScores.reduce(
        (sum, cs) => sum + cs.score * personalizedWeights[cs.category],
        0,
      )
    : undefined;

  // Multiplicador de verificacao
  const verificationMultiplier = applyVerificationMultiplier(
    1, // multiplicador aplicado ao score, nao ao proprio multiplicador
    restaurant.verificationStatus,
    restaurant.dataSource,
    restaurant.lastVerifiedAt,
  );

  const finalGlobal = globalScore * verificationMultiplier;
  const finalPersonalized = personalizedRawScore != null
    ? personalizedRawScore * verificationMultiplier
    : undefined;

  // Gerar avisos
  const warnings = generateWarnings(restaurant, userProfile);

  // Gerar explicacao
  const explanation = generateScoreExplanation(
    categoryScores,
    userProfile,
    finalGlobal,
    finalPersonalized,
    verificationMultiplier,
    warnings,
  );

  return {
    globalScore: Math.round(finalGlobal * 100) / 100,
    personalizedScore:
      finalPersonalized != null
        ? Math.round(finalPersonalized * 100) / 100
        : undefined,
    globalTrafficLight: getTrafficLight(finalGlobal),
    personalizedTrafficLight: finalPersonalized != null
      ? getTrafficLight(finalPersonalized)
      : undefined,
    categoryScores,
    verificationMultiplier,
    warnings,
    explanation,
  };
}

// --- Avisos ---

function generateWarnings(
  r: RestaurantAccessibilityProfile,
  user?: UserProfile,
): Warning[] {
  const warnings: Warning[] = [];
  if (!user) return warnings;

  // Porta da entrada
  if (
    r.entranceDoorWidth != null &&
    user.wheelchairWidth != null &&
    r.entranceDoorWidth < user.wheelchairWidth + 4
  ) {
    warnings.push({
      severity: "critical",
      category: "entrance",
      message: `Porta da entrada demasiado estreita para a sua cadeira (${r.entranceDoorWidth} cm, cadeira ${user.wheelchairWidth} cm)`,
      actualValue: r.entranceDoorWidth,
      requiredValue: user.wheelchairWidth + 4,
    });
  }

  // Degraus sem rampa
  if (
    r.numberOfSteps != null &&
    r.numberOfSteps > 0 &&
    !r.hasRamp &&
    !r.hasPortableRamp &&
    user.maxStepHeight === 0
  ) {
    warnings.push({
      severity: "critical",
      category: "entrance",
      message: `Sem acesso ao nivel: ${r.numberOfSteps} degrau(s) sem rampa`,
      actualValue: r.numberOfSteps,
      requiredValue: 0,
    });
  }

  // Inclinacao da rampa
  if (
    r.rampIncline != null &&
    user.maxRampIncline != null &&
    r.rampIncline > user.maxRampIncline
  ) {
    warnings.push({
      severity: "warning",
      category: "entrance",
      message: `Inclinacao da rampa (${r.rampIncline}%) superior ao seu limite (${user.maxRampIncline}%)`,
      actualValue: r.rampIncline,
      requiredValue: user.maxRampIncline,
    });
  }

  // Porta da casa de banho
  if (
    r.bathroomDoorWidth != null &&
    user.wheelchairWidth != null &&
    r.bathroomDoorWidth < user.wheelchairWidth + 4
  ) {
    warnings.push({
      severity: "critical",
      category: "bathroom",
      message: `Porta da casa de banho demasiado estreita (${r.bathroomDoorWidth} cm, cadeira ${user.wheelchairWidth} cm)`,
      actualValue: r.bathroomDoorWidth,
      requiredValue: user.wheelchairWidth + 4,
    });
  }

  // Espaco de rotacao na WC
  if (
    r.bathroomTurningSpace != null &&
    user.turningRadiusNeeded != null &&
    r.bathroomTurningSpace < user.turningRadiusNeeded - 20
  ) {
    warnings.push({
      severity: "critical",
      category: "bathroom",
      message: `Espaco de rotacao na casa de banho insuficiente (${r.bathroomTurningSpace} cm, necessario ${user.turningRadiusNeeded} cm)`,
      actualValue: r.bathroomTurningSpace,
      requiredValue: user.turningRadiusNeeded,
    });
  } else if (
    r.bathroomTurningSpace != null &&
    user.turningRadiusNeeded != null &&
    r.bathroomTurningSpace < user.turningRadiusNeeded
  ) {
    warnings.push({
      severity: "warning",
      category: "bathroom",
      message: `Espaco de rotacao na casa de banho apertado (${r.bathroomTurningSpace} cm, ideal ${user.turningRadiusNeeded} cm)`,
      actualValue: r.bathroomTurningSpace,
      requiredValue: user.turningRadiusNeeded,
    });
  }

  // Corredores
  if (
    r.corridorMinWidth != null &&
    user.wheelchairWidth != null &&
    r.corridorMinWidth < user.wheelchairWidth + 10
  ) {
    warnings.push({
      severity: "warning",
      category: "interior",
      message: `Corredores estreitos (${r.corridorMinWidth} cm, cadeira ${user.wheelchairWidth} cm)`,
      actualValue: r.corridorMinWidth,
      requiredValue: user.wheelchairWidth + 10,
    });
  }

  return warnings;
}

// --- Explicacao textual ---

export function generateScoreExplanation(
  categoryScores: CategoryScore[],
  userProfile?: UserProfile,
  globalScore?: number,
  personalizedScore?: number,
  verificationMultiplier?: number,
  warnings?: Warning[],
): string {
  const lines: string[] = [];

  // Resumo
  if (globalScore != null) {
    lines.push(
      `Pontuacao global: ${Math.round(globalScore)}/100 (${getTrafficLightLabel(getTrafficLight(globalScore))}).`,
    );
  }
  if (personalizedScore != null && userProfile) {
    lines.push(
      `Pontuacao personalizada para ${getMobilityLabel(userProfile.mobilityType)}: ${Math.round(personalizedScore)}/100 (${getTrafficLightLabel(getTrafficLight(personalizedScore))}).`,
    );
  }

  // Detalhe por categoria
  lines.push("");
  lines.push("Detalhe por categoria:");
  for (const cs of categoryScores) {
    const label = getCategoryLabel(cs.category);
    const tl = getTrafficLightLabel(cs.trafficLight);
    lines.push(`- ${label}: ${Math.round(cs.score)}/100 (${tl})`);
    if (cs.dataCompleteness < 0.5) {
      lines.push(
        `  (!) Dados incompletos: apenas ${Math.round(cs.dataCompleteness * 100)}% dos campos preenchidos`,
      );
    }
  }

  // Avisos
  if (warnings && warnings.length > 0) {
    lines.push("");
    lines.push("Avisos:");
    for (const w of warnings) {
      const prefix = w.severity === "critical" ? "CRITICO" : "Atencao";
      lines.push(`- [${prefix}] ${w.message}`);
    }
  }

  // Verificacao
  if (verificationMultiplier != null && verificationMultiplier < 1.0) {
    lines.push("");
    lines.push(
      `Nota: Pontuacao ajustada por factor de confianca de ${(verificationMultiplier * 100).toFixed(0)}% (dados nao verificados profissionalmente ou com alguma antiguidade).`,
    );
  }

  return lines.join("\n");
}

function getTrafficLightLabel(tl: TrafficLight): string {
  const labels: Record<TrafficLight, string> = {
    green: "Acessivel",
    yellow: "Parcialmente acessivel",
    red: "Barreiras significativas",
    grey: "Sem dados",
  };
  return labels[tl];
}

function getCategoryLabel(cat: ScoringCategory): string {
  const labels: Record<ScoringCategory, string> = {
    entrance: "Entrada",
    parking: "Estacionamento",
    interior: "Interior",
    seating: "Mesas",
    bathroom: "Casa de Banho",
    communication: "Comunicacao",
  };
  return labels[cat];
}

function getMobilityLabel(mt: MobilityType): string {
  const labels: Record<MobilityType, string> = {
    electric_wheelchair: "cadeira de rodas electrica",
    manual_wheelchair: "cadeira de rodas manual",
    scooter: "scooter motorizado",
    walker: "andarilho",
    crutches: "muletas",
    cane: "bengala",
    reduced_mobility: "mobilidade reduzida",
    none: "sem restricoes",
    other: "outro",
  };
  return labels[mt];
}
```

---

## Notas Finais

Este documento define a especificacao completa do sistema de classificacao de acessibilidade do Eat Out Adviser. A implementacao deve:

1. **Manter consistencia** com o modelo de dados definido em `DATA_MODEL.md`, nomeadamente as tabelas `accessibility_profiles` e `accessibility_scores`
2. **Recalcular scores** sempre que o `AccessibilityProfile` de um restaurante e actualizado (via trigger ou job agendado)
3. **Pre-calcular scores** para os perfis de mobilidade mais comuns e armazenar no campo `weighted_score_for_profile` da tabela `accessibility_scores`
4. **Calcular scores personalizados** em tempo real para perfis com dimensoes especificas (largura de cadeira, raio de viragem)
5. **Registar no AuditLog** qualquer alteracao em dados que afecte o calculo de scores
