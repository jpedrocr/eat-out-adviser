# Eat Out Adviser - Especificacao de Funcionalidades de IA

**Data:** Marco de 2026
**Projecto:** Eat Out Adviser - Sistema de recomendacao de restaurantes com foco em acessibilidade
**Stack de IA:** Claude Sonnet 4.6 / Opus 4.5, Claude Vision, nomic-embed-text-v2 (Ollama), pgvector, RAG, MCP

---

## Indice

1. [Pesquisa em Linguagem Natural](#1-pesquisa-em-linguagem-natural)
2. [Analise de Fotografias com Claude Vision](#2-analise-de-fotografias-com-claude-vision)
3. [Sistema de Matching Personalizado](#3-sistema-de-matching-personalizado)
4. [Sumarizacao de Avaliacoes](#4-sumarizacao-de-avaliacoes)
5. [Assistente Conversacional](#5-assistente-conversacional)
6. [Analise de Ementas](#6-analise-de-ementas)
7. [Geracao de Relatorios de Acessibilidade](#7-geracao-de-relatorios-de-acessibilidade)
8. [Traducao Automatica com IA](#8-traducao-automatica-com-ia)
9. [Servidor MCP Personalizado](#9-servidor-mcp-personalizado)
10. [Pipeline de Embeddings](#10-pipeline-de-embeddings)

---

## 1. Pesquisa em Linguagem Natural

### 1.1 Descricao e Historia de Utilizador

**Como** utilizador de cadeira de rodas electrica, **quero** escrever uma frase como "restaurante italiano acessivel no centro do Porto com estacionamento" **para que** o sistema compreenda as minhas necessidades e devolva resultados relevantes ordenados por compatibilidade com o meu perfil de acessibilidade.

### 1.2 Abordagem Tecnica

O fluxo de pesquisa segue seis etapas sequenciais:

```
Utilizador escreve query em linguagem natural
       |
       v
[1] Claude interpreta a intencao e extrai entidades (tool use)
       |
       v
[2] Sistema gera embedding da query via nomic-embed-text-v2
       |
       v
[3] Busca hibrida: similaridade vectorial (pgvector) + filtros estruturados (SQL)
       |
       v
[4] Claude re-rankeia os top-20 resultados com base no perfil do utilizador
       |
       v
[5] Resposta personalizada com explicacao das recomendacoes
```

### 1.3 System Prompt para Interpretacao de Query

```
Es o modulo de interpretacao de pesquisa do Eat Out Adviser, uma aplicacao portuguesa de recomendacao de restaurantes focada em acessibilidade fisica.

A tua tarefa e analisar a query do utilizador e extrair informacao estruturada. Deves:

1. Identificar a INTENCAO: search_restaurant, get_info, compare, ask_accessibility
2. Extrair ENTIDADES com os campos:
   - cuisine: tipo de cozinha (italiana, portuguesa, japonesa, etc.)
   - location: zona geografica (centro do Porto, Matosinhos, Gaia, etc.)
   - accessibility_required: se o utilizador menciona acessibilidade (booleano)
   - specific_accessibility: necessidades especificas (rampa, casa de banho adaptada, estacionamento, etc.)
   - price_range: faixa de preco (economico, moderado, premium)
   - features: outras caracteristicas (esplanada, vista mar, wifi, etc.)
   - group_size: numero de pessoas
   - meal_type: almoco, jantar, brunch, etc.
   - date_time: quando pretende ir (se mencionado)

3. Gerar uma REFORMULACAO da query optimizada para busca semantica

Responde SEMPRE com uma chamada a ferramenta parse_search_query. Nao respondas em texto livre.

Contexto: A aplicacao serve a area metropolitana do Porto, Portugal. Os utilizadores tem frequentemente necessidades de mobilidade reduzida. Trata "acessivel" como referente a acessibilidade fisica (cadeira de rodas, mobilidade reduzida) salvo indicacao em contrario.
```

### 1.4 Definicoes de Ferramentas (tRPC Procedures)

```typescript
// Ferramenta 1: Interpretacao da query pelo Claude
const parseSearchQueryTool = {
  name: "parse_search_query",
  description: "Analisa a query do utilizador e extrai intencao e entidades estruturadas para pesquisa de restaurantes.",
  input_schema: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        enum: ["search_restaurant", "get_info", "compare", "ask_accessibility"],
        description: "Intencao principal do utilizador"
      },
      entities: {
        type: "object",
        properties: {
          cuisine: { type: "string", description: "Tipo de cozinha" },
          location: { type: "string", description: "Zona geografica" },
          accessibility_required: { type: "boolean" },
          specific_accessibility: {
            type: "array",
            items: { type: "string" },
            description: "Lista de requisitos de acessibilidade especificos"
          },
          price_range: {
            type: "string",
            enum: ["economico", "moderado", "premium", "qualquer"]
          },
          features: { type: "array", items: { type: "string" } },
          group_size: { type: "number" },
          meal_type: { type: "string" },
          date_time: { type: "string" }
        },
        required: ["accessibility_required"]
      },
      semantic_query: {
        type: "string",
        description: "Reformulacao optimizada para busca semantica"
      },
      structured_filters: {
        type: "object",
        description: "Filtros SQL directos derivados da query",
        properties: {
          cuisine_filter: { type: "string" },
          location_filter: { type: "string" },
          has_ramp: { type: "boolean" },
          has_accessible_bathroom: { type: "boolean" },
          has_parking: { type: "boolean" },
          min_door_width_cm: { type: "number" },
          max_price_level: { type: "number" }
        }
      }
    },
    required: ["intent", "entities", "semantic_query"]
  }
};

// Ferramenta 2: Busca hibrida na base de dados
const hybridSearchTool = {
  name: "hybrid_search_restaurants",
  description: "Executa busca hibrida combinando similaridade vectorial com filtros estruturados.",
  input_schema: {
    type: "object",
    properties: {
      query_embedding: {
        type: "array",
        items: { type: "number" },
        description: "Vector embedding da query (768 dimensoes)"
      },
      structured_filters: { type: "object" },
      limit: { type: "number", default: 20 },
      similarity_threshold: { type: "number", default: 0.7 }
    },
    required: ["query_embedding"]
  }
};

// Ferramenta 3: Re-ranking com contexto de acessibilidade
const rerankResultsTool = {
  name: "rerank_with_accessibility",
  description: "Re-ordena resultados considerando o perfil de acessibilidade do utilizador.",
  input_schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            restaurant_id: { type: "string" },
            name: { type: "string" },
            accessibility_score: { type: "number" },
            similarity_score: { type: "number" },
            accessibility_features: { type: "object" }
          }
        }
      },
      user_profile: {
        type: "object",
        description: "Perfil de acessibilidade do utilizador"
      }
    },
    required: ["results", "user_profile"]
  }
};
```

### 1.5 Exemplo de Fluxo Completo

**Input do utilizador:** "restaurante italiano acessivel no centro do Porto com estacionamento"

**Etapa 1 - Interpretacao pelo Claude:**

```json
{
  "intent": "search_restaurant",
  "entities": {
    "cuisine": "italiana",
    "location": "centro do Porto",
    "accessibility_required": true,
    "specific_accessibility": ["estacionamento"],
    "price_range": "qualquer",
    "features": [],
    "group_size": null,
    "meal_type": null
  },
  "semantic_query": "restaurante cozinha italiana centro historico Porto acessivel cadeira rodas estacionamento adaptado",
  "structured_filters": {
    "cuisine_filter": "italiana",
    "location_filter": "porto_centro",
    "has_parking": true
  }
}
```

**Etapa 2 - Geracao do embedding:**

```typescript
const embedding = await ollama.embeddings({
  model: "nomic-embed-text-v2",
  prompt: "search_query: restaurante cozinha italiana centro historico Porto acessivel cadeira rodas estacionamento adaptado"
});
// Resultado: vector de 768 dimensoes
```

**Etapa 3 - Busca hibrida em PostgreSQL:**

```sql
WITH vector_results AS (
  SELECT r.id, r.name, r.description,
         1 - (r.embedding <=> $1::vector) AS similarity_score
  FROM restaurants r
  WHERE r.cuisine = 'italiana'
    AND r.location_area = 'porto_centro'
    AND r.has_parking = true
  ORDER BY r.embedding <=> $1::vector
  LIMIT 20
),
text_results AS (
  SELECT r.id, r.name, r.description,
         ts_rank(r.search_vector, plainto_tsquery('portuguese', $2)) AS text_score
  FROM restaurants r
  WHERE r.search_vector @@ plainto_tsquery('portuguese', $2)
    AND r.cuisine = 'italiana'
    AND r.location_area = 'porto_centro'
    AND r.has_parking = true
  LIMIT 20
)
SELECT COALESCE(v.id, t.id) AS id,
       COALESCE(v.name, t.name) AS name,
       (COALESCE(v.similarity_score, 0) * 0.6 + COALESCE(t.text_score, 0) * 0.4) AS hybrid_score
FROM vector_results v
FULL OUTER JOIN text_results t ON v.id = t.id
ORDER BY hybrid_score DESC
LIMIT 20;
```

**Etapa 4 - Re-ranking pelo Claude:**

O Claude recebe os 20 resultados com dados de acessibilidade detalhados e o perfil do utilizador (cadeira de rodas electrica, largura 68cm) e reordena, produzindo:

```json
{
  "ranked_results": [
    {
      "restaurant_id": "r_042",
      "name": "Trattoria da Maria",
      "match_score": 0.94,
      "explanation": "Entrada ao nivel da rua sem degraus, porta com 90cm de largura, estacionamento proprio com lugar reservado. Distancia de 200m da Avenida dos Aliados."
    },
    {
      "restaurant_id": "r_118",
      "name": "Il Postino Porto",
      "match_score": 0.87,
      "explanation": "Rampa de acesso com inclinacao de 6%, porta com 85cm. Estacionamento publico acessivel a 50m. Interior amplo entre mesas."
    }
  ]
}
```

### 1.6 Tratamento de Erros

| Cenario | Estrategia |
|---|---|
| Claude nao consegue interpretar a query | Devolver mensagem: "Nao consegui compreender a sua pesquisa. Pode reformular? Exemplo: restaurante acessivel no Porto" |
| Nenhum resultado na busca hibrida | Relaxar filtros progressivamente: primeiro remover filtros de cozinha, depois de localizacao, manter sempre acessibilidade |
| Ollama indisponivel para embeddings | Fallback para full-text search apenas (PostgreSQL tsvector) com aviso ao utilizador |
| Timeout da API Claude (>10s) | Cache de interpretacoes frequentes em Redis/memoria. Retry com exponential backoff (max 3 tentativas) |
| Query ambigua (ex.: "sitio bom para comer") | Claude pede esclarecimento: "Procura um restaurante na zona do Porto? Tem preferencia de tipo de cozinha?" |

### 1.7 Consideracoes de Performance (N5105 16GB)

- Embedding via Ollama (nomic-embed-text-v2): ~50-100ms por query no N5105
- Busca vectorial pgvector com indice HNSW (<100k registos): <10ms
- Full-text search PostgreSQL: <5ms
- Chamada Claude API (interpretacao): ~500-1500ms (dependente de rede)
- Chamada Claude API (re-ranking): ~1000-3000ms
- **Tempo total estimado:** 2-5 segundos por pesquisa

**Optimizacoes:**
- Cache de embeddings para queries frequentes (LRU cache com TTL de 24h)
- Pre-computacao de embeddings de restaurantes em batch (offline)
- Streaming da resposta do Claude para feedback imediato ao utilizador

### 1.8 Estimativa de Custos (API Claude)

- Interpretacao de query: ~500 tokens input + 200 tokens output = ~$0.002 por pesquisa (Sonnet 4.6)
- Re-ranking de 20 resultados: ~3000 tokens input + 500 tokens output = ~$0.012 por pesquisa
- **Custo total por pesquisa:** ~$0.014
- **1000 pesquisas/mes:** ~$14

---

## 2. Analise de Fotografias com Claude Vision

### 2.1 Descricao e Historia de Utilizador

**Como** utilizador que avalia restaurantes, **quero** tirar fotografias da entrada, interior e casa de banho de um restaurante **para que** o sistema analise automaticamente as condicoes de acessibilidade e preencha os dados estruturados sem esforco manual.

**Como** dono de restaurante, **quero** submeter fotografias do meu espaco **para que** o sistema gere um perfil de acessibilidade inicial automaticamente.

### 2.2 Abordagem Tecnica

```
Utilizador submete fotografias (1-10 por restaurante)
       |
       v
Pre-processamento: redimensionar para max 1568px, validar formato
       |
       v
Claude Vision analisa cada foto com system prompt especifico
       |
       v
Respostas estruturadas em JSON com pontuacoes de confianca
       |
       v
Agregacao: combinar analises de multiplas fotos num perfil unico
       |
       v
Revisao humana para itens com confianca < 0.7
       |
       v
Dados inseridos/actualizados no AccessibilityProfile do restaurante
```

### 2.3 System Prompt para Analise Visual

```
Es o modulo de analise visual de acessibilidade do Eat Out Adviser. A tua tarefa e analisar fotografias de restaurantes para avaliar condicoes de acessibilidade fisica.

Para cada fotografia, deves:

1. IDENTIFICAR o tipo de espaco fotografado:
   - entrance (entrada principal)
   - interior (sala de refeicoes)
   - bathroom (casa de banho)
   - parking (estacionamento)
   - menu (ementa/carta)
   - exterior (fachada/exterior)
   - other (outro)

2. AVALIAR caracteristicas de acessibilidade visiveis, usando a escala:
   - score: 0.0 a 1.0 (confianca da observacao)
   - finding: descricao objectiva do que e visivel
   - assessment: accessible / partially_accessible / not_accessible / unknown

3. ESTIMAR medidas fisicas quando possivel:
   - Largura de portas (usando objectos de referencia como macanetas standard ~7cm)
   - Altura de degraus
   - Inclinacao de rampas (angulo visual estimado)
   - Largura de corredores entre mesas

REGRAS CRITICAS:
- Indica SEMPRE o nivel de confianca. Se nao consegues ver algo claramente, marca confianca < 0.5
- Nao assumes o que nao e visivel. Se a foto nao mostra a casa de banho, nao comentes sobre ela
- Usa medidas em centimetros com margem de erro (ex.: "~85cm +-10cm")
- Diferencia entre o que OBSERVAS e o que INFERES
- Lembra-te que uma cadeira de rodas electrica standard tem ~65-70cm de largura
- Uma porta deve ter no minimo 80cm de largura util para passagem de cadeira de rodas (ideal: 90cm+)
- Rampas devem ter inclinacao maxima de 8% (1:12) segundo a norma ISO 21542:2021
```

### 2.4 Formato JSON de Saida Esperado

```json
{
  "photo_analysis": {
    "photo_id": "img_001",
    "space_type": "entrance",
    "overall_assessment": "partially_accessible",
    "overall_confidence": 0.82,
    "findings": [
      {
        "feature": "door_width",
        "observation": "Porta de vidro dupla, aparenta ter aproximadamente 85cm de largura util com ambas as folhas abertas",
        "estimated_measurement": {
          "value_cm": 85,
          "margin_error_cm": 10,
          "reference_used": "macaneta de porta standard (~12cm)"
        },
        "assessment": "accessible",
        "confidence": 0.75,
        "notes": "Apenas uma folha visivel aberta na foto. Se ambas abrirem, largura aumenta para ~170cm estimados"
      },
      {
        "feature": "entrance_level",
        "observation": "Existe um degrau de aproximadamente 5cm na entrada principal",
        "estimated_measurement": {
          "value_cm": 5,
          "margin_error_cm": 3
        },
        "assessment": "partially_accessible",
        "confidence": 0.85,
        "notes": "Degrau pequeno mas pode ser obstaculo para cadeiras de rodas electricas. Nao e visivel rampa alternativa nesta foto"
      },
      {
        "feature": "ramp",
        "observation": "Nao visivel nesta fotografia",
        "assessment": "unknown",
        "confidence": 0.0,
        "notes": "Pode existir acesso alternativo nao captado na fotografia"
      },
      {
        "feature": "automatic_door",
        "observation": "Porta manual sem mecanismo automatico visivel",
        "assessment": "not_accessible",
        "confidence": 0.9,
        "notes": "Porta requer forca manual para abrir"
      },
      {
        "feature": "surface_type",
        "observation": "Piso em calcada portuguesa irregular na entrada",
        "assessment": "partially_accessible",
        "confidence": 0.88,
        "notes": "Calcada portuguesa pode dificultar circulacao de cadeiras de rodas"
      }
    ],
    "recommendations": [
      "Confirmar presencialmente se existe rampa alternativa",
      "Verificar se ambas as folhas da porta abrem",
      "Perguntar ao restaurante sobre rampa portatil"
    ],
    "disclaimer": "Analise automatica baseada em fotografia. Medidas sao estimativas com margem de erro indicada. Recomenda-se verificacao presencial para confirmacao."
  }
}
```

### 2.5 Metodologia de Pontuacao de Confianca

| Nivel de Confianca | Valor | Criterio |
|---|---|---|
| Muito alta | 0.9 - 1.0 | Caracteristica claramente visivel, sem obstrucao, boa iluminacao, angulo directo |
| Alta | 0.7 - 0.89 | Caracteristica visivel mas com alguma obstrucao parcial ou angulo lateral |
| Moderada | 0.5 - 0.69 | Caracteristica parcialmente visivel, estimativa com incerteza significativa |
| Baixa | 0.3 - 0.49 | Inferencia baseada em contexto, nao observacao directa |
| Muito baixa / Desconhecido | 0.0 - 0.29 | Nao visivel na fotografia, pura especulacao |

**Regras de agregacao multi-foto:**
- Se multiplas fotos mostram a mesma caracteristica, usar a analise com maior confianca
- Se analises contradizem, marcar para revisao humana e usar a mais conservadora (pior cenario de acessibilidade)
- Confianca agregada = max(confianca_foto1, confianca_foto2, ...) * 0.95 (penalizacao ligeira por possivel inconsistencia)

### 2.6 Integracao com AccessibilityProfile

Os resultados da analise visual alimentam directamente a tabela `accessibility_profiles`:

```typescript
// Mapeamento de findings para campos estruturados
const visionToProfile = {
  "door_width": "entrance_door_width_cm",
  "entrance_level": "entrance_has_steps",
  "ramp": "entrance_has_ramp",
  "automatic_door": "entrance_automatic_door",
  "interior_spacing": "interior_table_spacing_cm",
  "corridor_width": "interior_corridor_width_cm",
  "bathroom_grab_bars": "bathroom_has_grab_bars",
  "bathroom_door_width": "bathroom_door_width_cm",
  "parking_accessible": "parking_has_accessible_spots"
};

// Actualizacao condicional: so actualizar se confianca > threshold
// e se nao existe dado verificado por humano
async function updateProfileFromVision(
  restaurantId: string,
  findings: VisionFinding[]
) {
  for (const finding of findings) {
    if (finding.confidence >= 0.7) {
      // Actualizar com flag source = 'ai_vision'
      await db.update(accessibilityProfiles)
        .set({
          [visionToProfile[finding.feature]]: finding.estimated_measurement?.value_cm,
          [`${visionToProfile[finding.feature]}_source`]: 'ai_vision',
          [`${visionToProfile[finding.feature]}_confidence`]: finding.confidence,
          updated_at: new Date()
        })
        .where(
          and(
            eq(accessibilityProfiles.restaurant_id, restaurantId),
            // Nao sobrescrever dados verificados por humano
            ne(accessibilityProfiles[`${visionToProfile[finding.feature]}_source`], 'human_verified')
          )
        );
    }
  }
}
```

### 2.7 Limitacoes e Disclaimers

- Estimativas de medidas tem margem de erro de 10-20% dependendo da qualidade e angulo da fotografia
- Nao consegue avaliar: peso de portas, forca necessaria para abrir, textura do piso ao toque, iluminacao real (vs. flash da foto)
- Fotografias com pouca luz, desfocadas ou com obstrucoes significativas produzem resultados de baixa confianca
- A analise nao substitui verificacao presencial -- serve como triagem inicial
- Claude Vision pode nao identificar correctamente rampas portateis ou equipamentos de acessibilidade nao standard
- **Sempre apresentar disclaimer ao utilizador:** "Esta analise e automatica e baseada em fotografias. Recomendamos contactar o restaurante para confirmar condicoes de acessibilidade."

### 2.8 Consideracoes de Performance (N5105 16GB)

- Processamento de imagem e feito inteiramente via API Claude (sem carga local)
- Pre-processamento local (redimensionamento): <100ms por imagem
- Chamada Claude Vision por foto: ~2000-5000ms (dependente de rede e tamanho)
- Para 5 fotos de um restaurante: ~10-25 segundos total
- **Optimizacao:** processar fotos em paralelo (max 3 em simultaneo para nao exceder rate limits)

### 2.9 Estimativa de Custos

- Analise de 1 foto (Sonnet 4.6): ~1500 tokens input (imagem + prompt) + 500 tokens output = ~$0.008
- Analise completa de restaurante (5 fotos): ~$0.04
- **100 restaurantes/mes:** ~$4

---

## 3. Sistema de Matching Personalizado

### 3.1 Descricao e Historia de Utilizador

**Como** utilizador com cadeira de rodas electrica, **quero** que o sistema ordene restaurantes pela compatibilidade com as minhas necessidades especificas **para que** veja primeiro os restaurantes onde tenho garantia de conseguir entrar, sentar-me e usar a casa de banho.

### 3.2 Abordagem Tecnica - Algoritmo de Scoring

O score de compatibilidade e calculado como soma ponderada:

```
Score = Sigma(weight_i x criterion_score_i) para cada criterio de acessibilidade

Onde:
- weight_i depende do tipo de mobilidade do utilizador
- criterion_score_i varia entre 0.0 (inacessivel) e 1.0 (totalmente acessivel)
- Score final normalizado para 0-100
```

### 3.3 Tabela de Pesos por Tipo de Mobilidade

| Criterio | Cadeira Electrica | Cadeira Manual | Andarilho | Muletas | Mobilidade Reduzida |
|---|---|---|---|---|---|
| Entrada (rampa/nivel) | 0.30 | 0.28 | 0.20 | 0.15 | 0.15 |
| Casa de banho | 0.25 | 0.22 | 0.15 | 0.10 | 0.10 |
| Espaco interior | 0.20 | 0.20 | 0.25 | 0.20 | 0.15 |
| Estacionamento | 0.15 | 0.15 | 0.10 | 0.10 | 0.10 |
| Mesas adaptadas | 0.10 | 0.15 | 0.10 | 0.10 | 0.05 |
| Piso/superficie | - | - | 0.15 | 0.25 | 0.15 |
| Iluminacao | - | - | 0.05 | 0.10 | 0.10 |
| Apoios/corrimaos | - | - | - | - | 0.20 |
| **Total** | **1.00** | **1.00** | **1.00** | **1.00** | **1.00** |

### 3.4 Calculo do criterion_score por Criterio

**Entrada (entrance_score):**

```typescript
function calculateEntranceScore(
  restaurant: AccessibilityProfile,
  user: UserProfile
): number {
  let score = 0;

  // Nivel da rua (sem degraus) = melhor cenario
  if (restaurant.entrance_level_access) {
    score = 1.0;
  }
  // Rampa com inclinacao adequada
  else if (restaurant.entrance_has_ramp) {
    const rampSlope = restaurant.entrance_ramp_slope_percent;
    if (rampSlope <= 6) score = 0.95;       // Excelente
    else if (rampSlope <= 8) score = 0.85;   // Aceitavel (norma ISO)
    else if (rampSlope <= 10) score = 0.6;   // Dificil para electrica
    else if (rampSlope <= 12) score = 0.3;   // Perigoso
    else score = 0.1;                         // Praticamente inacessivel
  }
  // Degraus com rampa portatil disponivel
  else if (restaurant.entrance_has_portable_ramp) {
    score = 0.5; // Depende de assistencia
  }
  // Degraus apenas
  else if (restaurant.entrance_step_count > 0) {
    const stepHeight = restaurant.entrance_total_step_height_cm;
    if (stepHeight <= 2) score = 0.4;        // Micro-degrau, talvez transponivel
    else score = 0.0;                         // Barreira total para cadeira electrica
  }

  // Penalizacao por largura de porta insuficiente
  if (restaurant.entrance_door_width_cm) {
    const userWidth = user.wheelchair_width_cm || 68; // default cadeira electrica
    const clearance = restaurant.entrance_door_width_cm - userWidth;
    if (clearance < 5) score *= 0.3;          // Muito justo, risco de nao passar
    else if (clearance < 12) score *= 0.7;    // Passa mas com dificuldade
    else if (clearance < 20) score *= 0.9;    // Confortavel
    // >= 20cm de folga: sem penalizacao
  }

  // Bonus por porta automatica
  if (restaurant.entrance_automatic_door) {
    score = Math.min(1.0, score * 1.1);
  }

  return score;
}
```

**Casa de banho (bathroom_score):**

```typescript
function calculateBathroomScore(
  restaurant: AccessibilityProfile,
  user: UserProfile
): number {
  // Sem informacao = score neutro mas com penalizacao de incerteza
  if (!restaurant.bathroom_data_available) return 0.4;

  let score = 0;
  let factors = 0;

  // Casa de banho adaptada designada
  if (restaurant.bathroom_is_adapted) {
    score += 0.4;
    factors++;
  }

  // Largura da porta
  if (restaurant.bathroom_door_width_cm) {
    const userWidth = user.wheelchair_width_cm || 68;
    if (restaurant.bathroom_door_width_cm >= userWidth + 20) {
      score += 0.2;
    } else if (restaurant.bathroom_door_width_cm >= userWidth + 5) {
      score += 0.1;
    }
    factors++;
  }

  // Barras de apoio
  if (restaurant.bathroom_has_grab_bars) {
    score += 0.2;
    factors++;
  }

  // Espaco de manobra (raio de rotacao cadeira electrica ~150cm)
  if (restaurant.bathroom_turning_radius_cm) {
    if (restaurant.bathroom_turning_radius_cm >= 150) score += 0.2;
    else if (restaurant.bathroom_turning_radius_cm >= 120) score += 0.1;
    factors++;
  }

  return factors > 0 ? score : 0.4; // Se nenhum dado, valor neutro
}
```

### 3.5 Definicao de Limiares

| Classificacao | Score | Icone | Descricao |
|---|---|---|---|
| Totalmente acessivel | >= 80 | Verde | O utilizador pode entrar, circular, comer e usar a casa de banho sem barreiras significativas |
| Parcialmente acessivel | 50 - 79 | Amarelo | O utilizador consegue aceder mas com algumas limitacoes ou necessidade de assistencia pontual |
| Acessibilidade limitada | 25 - 49 | Laranja | Barreiras significativas. Possivel com assistencia consideravel |
| Nao acessivel | < 25 | Vermelho | Barreiras que impedem o acesso seguro e autonomo |
| Dados insuficientes | N/A | Cinzento | Menos de 3 criterios com dados. Score nao fiavel |

### 3.6 Ajuste com Feedback do Utilizador

O sistema aprende com o feedback implicito e explicito do utilizador:

```typescript
interface UserFeedback {
  restaurant_id: string;
  user_id: string;
  // Feedback explicito
  actual_entrance_accessible: boolean | null;
  actual_bathroom_accessible: boolean | null;
  actual_interior_spacious: boolean | null;
  overall_accessibility_rating: 1 | 2 | 3 | 4 | 5;
  comments: string;
  // Feedback implicito (recolhido automaticamente)
  visit_completed: boolean;  // Se o utilizador marcou como visitado
  time_on_page_seconds: number;
  saved_to_favorites: boolean;
}

// Ajuste de pesos personalizado
function adjustUserWeights(
  userId: string,
  feedbackHistory: UserFeedback[]
): UserWeights {
  const baseWeights = getBaseWeightsForMobilityType(user.mobility_type);

  // Se o utilizador consistentemente ignora score de casa de banho
  // (visita restaurantes com bathroom_score baixo e da rating alto)
  // -> reduzir peso da casa de banho para este utilizador
  const bathroomCorrelation = calculateCorrelation(
    feedbackHistory.map(f => f.restaurant.bathroom_score),
    feedbackHistory.map(f => f.overall_accessibility_rating)
  );

  // Ajuste incremental: max +-20% dos pesos base
  const adjustedWeights = { ...baseWeights };
  adjustedWeights.bathroom *= (1 + bathroomCorrelation * 0.2);

  // Renormalizar para soma = 1.0
  const total = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  for (const key in adjustedWeights) {
    adjustedWeights[key] /= total;
  }

  return adjustedWeights;
}
```

### 3.7 Personalizacao ao Longo do Tempo

O sistema implementa aprendizagem incremental em tres fases:

1. **Fase inicial (0-5 avaliacoes):** Usar pesos base do tipo de mobilidade
2. **Fase de aprendizagem (5-20 avaliacoes):** Misturar pesos base (70%) com pesos aprendidos (30%)
3. **Fase personalizada (20+ avaliacoes):** Misturar pesos base (40%) com pesos aprendidos (60%)

Os pesos base nunca sao completamente ignorados para evitar overfitting a comportamentos pontuais.

### 3.8 Consideracoes de Performance

- O calculo de matching e puramente computacional (sem chamadas de IA)
- Score de um restaurante para um utilizador: <1ms
- Score de 1000 restaurantes: <100ms
- Pre-computacao diaria dos top-50 restaurantes para cada utilizador activo
- Cache do score com invalidacao quando o perfil do restaurante ou utilizador muda

### 3.9 Estimativa de Custos

- Zero custos de API (calculo puramente local)
- Custo computacional negligivel no N5105

---

## 4. Sumarizacao de Avaliacoes

### 4.1 Descricao e Historia de Utilizador

**Como** utilizador que pesquisa restaurantes, **quero** ver um resumo claro de multiplas avaliacoes **para que** compreenda rapidamente a experiencia geral de acessibilidade sem ler dezenas de reviews individuais.

### 4.2 Abordagem Tecnica

```
Novas avaliacoes submetidas
       |
       v
Acumulacao ate threshold (5 novas reviews ou 7 dias)
       |
       v
Claude sumariza por categoria: comida, servico, acessibilidade
       |
       v
Deteccao de sentimento por categoria
       |
       v
Sumario guardado em cache, actualizado incrementalmente
```

### 4.3 System Prompt para Sumarizacao

```
Es o modulo de sumarizacao de avaliacoes do Eat Out Adviser, uma aplicacao portuguesa focada em acessibilidade de restaurantes.

Recebes um conjunto de avaliacoes de utilizadores sobre um restaurante. Deves produzir tres sumarios distintos:

1. COMIDA: Qualidade da comida, variedade, relacao qualidade/preco
2. SERVICO: Atendimento, rapidez, simpatia do staff
3. ACESSIBILIDADE: Experiencia de acessibilidade fisica (entrada, interior, casa de banho, estacionamento)

Para cada categoria:
- Resume em 2-3 frases os pontos mais mencionados
- Indica o sentimento geral: muito_positivo, positivo, neutro, negativo, muito_negativo
- Destaca citacoes relevantes (max 2 por categoria)
- Para ACESSIBILIDADE, menciona explicitamente: tipo de mobilidade do avaliador (se indicado), barreiras encontradas, e pontos positivos

REGRAS:
- Escreve em portugues de Portugal (pt-PT)
- Sê objectivo e factual
- Se apenas 1-2 avaliacoes mencionam acessibilidade, indica "Poucos dados de acessibilidade disponiveis"
- Nao inventes informacao nao presente nas avaliacoes
- Identifica contradicoes entre avaliacoes (ex.: "Alguns utilizadores referem espaco amplo, outros consideram apertado")
```

### 4.4 Exemplo de Input e Output

**Input (5 avaliacoes):**

```json
{
  "restaurant": "Trattoria da Maria",
  "reviews": [
    {
      "user": "Ana M.",
      "mobility_type": "cadeira_manual",
      "rating": 4,
      "text": "Comida excelente, pasta fresca feita no momento. Consegui entrar sem problemas pela rampa lateral. Casa de banho um pouco apertada para a minha cadeira mas consegui usar. Staff muito prestavel, ajudaram-me com a porta.",
      "date": "2026-02-15"
    },
    {
      "user": "Carlos R.",
      "mobility_type": null,
      "rating": 5,
      "text": "Melhor carbonara do Porto! Preco justo para a qualidade. Ambiente acolhedor e servico rapido.",
      "date": "2026-02-20"
    },
    {
      "user": "Marta S.",
      "mobility_type": "cadeira_electrica",
      "rating": 3,
      "text": "Comida boa mas a entrada principal tem um degrau que nao consegui ultrapassar sozinha. Tive de ir pela entrada lateral que e acessivel. A casa de banho adaptada estava ocupada por material de limpeza. Decepcionante para um sitio que diz ser acessivel.",
      "date": "2026-03-01"
    },
    {
      "user": "Joao P.",
      "mobility_type": "cadeira_electrica",
      "rating": 4,
      "text": "Voltei depois de lerem a minha avaliacao anterior e melhoraram bastante. Rampa na entrada principal agora, e a casa de banho estava livre e limpa. Pizza muito boa. Estacionamento no parque publico a 50m.",
      "date": "2026-03-10"
    },
    {
      "user": "Sofia L.",
      "mobility_type": "andarilho",
      "rating": 4,
      "text": "Gostei muito da vitela alla milanese. Piso nao escorregadio, o que e optimo. Mesas com boa distancia entre si. So peco que ponham um corrimao na entrada.",
      "date": "2026-03-12"
    }
  ]
}
```

**Output esperado:**

```json
{
  "restaurant_id": "r_042",
  "summary_version": 3,
  "generated_at": "2026-03-15T10:30:00Z",
  "review_count": 5,
  "categories": {
    "food": {
      "summary": "A comida e consistentemente elogiada, com destaque para a pasta fresca feita no momento e a carbonara. A pizza tambem recebe avaliacoes positivas. A relacao qualidade/preco e considerada justa.",
      "sentiment": "muito_positivo",
      "sentiment_score": 0.88,
      "highlights": [
        "\"Melhor carbonara do Porto!\" - Carlos R.",
        "\"Pasta fresca feita no momento\" - Ana M."
      ]
    },
    "service": {
      "summary": "O servico e descrito como rapido e prestavel. O staff demonstra boa vontade em ajudar clientes com mobilidade reduzida. O restaurante mostrou capacidade de resposta a feedback, melhorando condicoes de acessibilidade apos criticas.",
      "sentiment": "positivo",
      "sentiment_score": 0.78,
      "highlights": [
        "\"Staff muito prestavel, ajudaram-me com a porta\" - Ana M.",
        "\"Voltei depois de lerem a minha avaliacao anterior e melhoraram bastante\" - Joao P."
      ]
    },
    "accessibility": {
      "summary": "A acessibilidade melhorou recentemente: a entrada principal tem agora rampa, embora anteriormente so existisse acesso lateral. A casa de banho adaptada existe mas houve relato de estar ocupada com material de limpeza. O interior tem bom espacamento entre mesas e piso antiderrapante. Falta corrimao na entrada.",
      "sentiment": "positivo",
      "sentiment_score": 0.65,
      "highlights": [
        "\"Rampa na entrada principal agora\" - Joao P.",
        "\"A casa de banho adaptada estava ocupada por material de limpeza\" - Marta S."
      ],
      "by_mobility_type": {
        "cadeira_electrica": {
          "review_count": 2,
          "trend": "a_melhorar",
          "key_issues": ["entrada principal tinha degrau (corrigido)", "casa de banho por vezes indisponivel"]
        },
        "cadeira_manual": {
          "review_count": 1,
          "trend": "estavel",
          "key_issues": ["casa de banho ligeiramente apertada"]
        },
        "andarilho": {
          "review_count": 1,
          "trend": "estavel",
          "key_issues": ["falta corrimao na entrada"]
        }
      },
      "contradictions": [
        "A experiencia de entrada variou: utilizadores anteriores (antes de Marco 2026) reportaram degrau, enquanto avaliacoes recentes confirmam presenca de rampa"
      ]
    }
  }
}
```

### 4.5 Actualizacao Incremental

Quando chegam novas avaliacoes, o sistema nao reprocessa todas desde o inicio:

```typescript
async function updateSummaryIncrementally(
  restaurantId: string,
  newReviews: Review[]
): Promise<void> {
  const existingSummary = await db.query.reviewSummaries.findFirst({
    where: eq(reviewSummaries.restaurant_id, restaurantId)
  });

  if (!existingSummary || newReviews.length >= 10) {
    // Regenerar sumario completo se nao existe ou muitas reviews novas
    await generateFullSummary(restaurantId);
    return;
  }

  // Actualizacao incremental: enviar sumario existente + novas reviews ao Claude
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20260315",
    max_tokens: 1500,
    system: SUMMARIZATION_SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `Sumario existente (baseado em ${existingSummary.review_count} avaliacoes):\n${JSON.stringify(existingSummary.categories)}\n\nNovas avaliacoes para integrar:\n${JSON.stringify(newReviews)}\n\nActualiza o sumario integrando as novas avaliacoes. Mantem a estrutura JSON.`
    }]
  });

  // Guardar sumario actualizado
  await db.update(reviewSummaries).set({
    categories: JSON.parse(response.content[0].text),
    review_count: existingSummary.review_count + newReviews.length,
    summary_version: existingSummary.summary_version + 1,
    updated_at: new Date()
  }).where(eq(reviewSummaries.restaurant_id, restaurantId));
}
```

### 4.6 Tratamento de Erros

| Cenario | Estrategia |
|---|---|
| Menos de 3 avaliacoes | Nao gerar sumario, mostrar avaliacoes individuais |
| Avaliacoes em linguas diferentes | Traduzir para portugues antes de sumarizar |
| Avaliacoes suspeitas (spam) | Filtrar antes de sumarizar (deteccao de duplicados, padroes anormais) |
| Claude produz JSON invalido | Retry com instrucao mais explicita; fallback para sumario em texto simples |

### 4.7 Consideracoes de Performance e Custos

- Sumarizacao de 5 reviews: ~2000 tokens input + 800 tokens output = ~$0.010 (Sonnet 4.6)
- Actualizacao incremental: ~1500 tokens input + 600 tokens output = ~$0.007
- Cache de sumarios com TTL de 7 dias ou ate nova avaliacao
- **100 restaurantes com media de 2 actualizacoes/mes:** ~$1.4/mes

---

## 5. Assistente Conversacional

### 5.1 Descricao e Historia de Utilizador

**Como** utilizador com cadeira de rodas electrica, **quero** perguntar ao assistente "Consigo entrar no restaurante X com a minha cadeira?" **para que** receba uma resposta personalizada baseada nas dimensoes da minha cadeira e nos dados reais do restaurante.

### 5.2 Abordagem Tecnica

O assistente usa RAG com tool use para responder a perguntas contextualizadas:

```
Utilizador faz pergunta no chat
       |
       v
Claude analisa a pergunta e decide que ferramentas invocar
       |
       v
Tool calls: buscar perfil do restaurante, perfil do utilizador, avaliacoes
       |
       v
Claude sintetiza informacao e responde com base nos dados reais
       |
       v
Se incerteza > threshold: indicar explicitamente e sugerir contacto directo
```

### 5.3 System Prompt do Assistente

```
Es o assistente de acessibilidade do Eat Out Adviser, uma aplicacao portuguesa de recomendacao de restaurantes focada em acessibilidade fisica.

O teu objectivo e ajudar utilizadores com mobilidade reduzida a tomar decisoes informadas sobre restaurantes. Tens acesso a ferramentas para consultar a base de dados da aplicacao.

PERFIL DO UTILIZADOR ACTUAL:
{user_profile_json}

REGRAS FUNDAMENTAIS:

1. SEGURANCA EM PRIMEIRO LUGAR: Nunca digas que um restaurante e acessivel se nao tens dados suficientes. E melhor dizer "nao temos dados suficientes" do que arriscar a seguranca do utilizador.

2. TRANSPARENCIA: Indica sempre a fonte dos dados (avaliacao de utilizador, analise de foto, informacao do restaurante, estimativa IA) e a data da ultima actualizacao.

3. PERSONALIZACAO: Considera sempre as dimensoes especificas da cadeira/equipamento do utilizador. Uma porta de 80cm pode ser acessivel para cadeira manual (60cm largura) mas justa para cadeira electrica (68cm largura).

4. LINGUAGEM: Responde em portugues de Portugal (pt-PT). Se amigavel e util mas objectivo. Nao uses linguagem condescendente.

5. INCERTEZA: Quando nao tens dados suficientes, diz claramente:
   - "Nao temos dados sobre a casa de banho deste restaurante. Sugerimos ligar directamente: [telefone]"
   - "A ultima avaliacao de acessibilidade e de ha 6 meses. As condicoes podem ter mudado."

6. CONTEXTO GEOGRAFICO: Estas familiarizado com a area metropolitana do Porto, Portugal. Conheces zonas como Ribeira (calcada portuguesa, ruas estreitas), Boavista (mais plano, passeios largos), Matosinhos (zona costeira, acessibilidade variavel).

7. PROACTIVIDADE: Se o utilizador pergunta sobre um restaurante, oferece informacao adicional relevante que ele nao pediu mas que e util (ex.: "Este restaurante tem estacionamento, mas o lugar acessivel fica a 30m da entrada").
```

### 5.4 Definicoes de Ferramentas do Assistente

```typescript
const assistantTools = [
  {
    name: "get_restaurant_profile",
    description: "Obtem o perfil completo de um restaurante incluindo dados de acessibilidade, localizacao, horarios e contactos.",
    input_schema: {
      type: "object",
      properties: {
        restaurant_id: { type: "string" },
        restaurant_name: { type: "string", description: "Nome para busca se ID nao disponivel" }
      }
    }
  },
  {
    name: "get_accessibility_details",
    description: "Obtem dados detalhados de acessibilidade de um restaurante: entrada, interior, casa de banho, estacionamento.",
    input_schema: {
      type: "object",
      properties: {
        restaurant_id: { type: "string" },
        categories: {
          type: "array",
          items: { type: "string", enum: ["entrance", "interior", "bathroom", "parking", "all"] }
        }
      },
      required: ["restaurant_id"]
    }
  },
  {
    name: "get_user_reviews",
    description: "Obtem avaliacoes de utilizadores sobre um restaurante, opcionalmente filtradas por tipo de mobilidade.",
    input_schema: {
      type: "object",
      properties: {
        restaurant_id: { type: "string" },
        mobility_type_filter: { type: "string" },
        limit: { type: "number", default: 5 }
      },
      required: ["restaurant_id"]
    }
  },
  {
    name: "search_restaurants_nearby",
    description: "Pesquisa restaurantes acessiveis perto de um local ou de outro restaurante.",
    input_schema: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        radius_meters: { type: "number", default: 500 },
        min_accessibility_score: { type: "number", default: 50 },
        cuisine: { type: "string" }
      },
      required: ["latitude", "longitude"]
    }
  },
  {
    name: "calculate_matching_score",
    description: "Calcula o score de compatibilidade entre o perfil do utilizador actual e um restaurante especifico.",
    input_schema: {
      type: "object",
      properties: {
        restaurant_id: { type: "string" }
      },
      required: ["restaurant_id"]
    }
  },
  {
    name: "get_route_accessibility",
    description: "Avalia a acessibilidade do percurso entre o utilizador e o restaurante (passeios, declives, transportes).",
    input_schema: {
      type: "object",
      properties: {
        destination_restaurant_id: { type: "string" },
        origin_latitude: { type: "number" },
        origin_longitude: { type: "number" }
      },
      required: ["destination_restaurant_id"]
    }
  }
];
```

### 5.5 Exemplos de Fluxo Conversacional

**Exemplo 1 - Pergunta directa sobre acessibilidade:**

```
Utilizador: Consigo entrar no restaurante Trattoria da Maria com a minha cadeira?

[Claude invoca get_restaurant_profile e get_accessibility_details]
[Claude invoca calculate_matching_score com o perfil do utilizador]

Assistente: Sim, o restaurante Trattoria da Maria e acessivel para a sua cadeira de rodas electrica. Aqui estao os detalhes:

- Entrada: Rampa na entrada principal com inclinacao de 6% (dentro da norma). Porta com 90cm de largura, suficiente para a sua cadeira (68cm).
- Interior: Espaco entre mesas de aproximadamente 120cm, permite circulacao confortavel.
- Casa de banho: Existe casa de banho adaptada com barras de apoio e espaco de manobra de 160cm.
- Estacionamento: Parque publico a 50m com lugares reservados.

Score de compatibilidade: 87/100

Nota: A ultima avaliacao de acessibilidade por um utilizador de cadeira electrica foi a 10 de Marco de 2026. Dois utilizadores de cadeira electrica avaliaram positivamente.

Quer que procure alternativas na mesma zona ou que o ajude com mais alguma coisa?
```

**Exemplo 2 - Gestao de incerteza:**

```
Utilizador: O restaurante O Cantinho do Porto e acessivel?

[Claude invoca get_restaurant_profile -- restaurante existe mas com poucos dados]
[Claude invoca get_accessibility_details -- dados incompletos]

Assistente: Temos informacao limitada sobre a acessibilidade do Cantinho do Porto. Eis o que sabemos:

- Entrada: Uma fotografia analisada sugere que existe um degrau de ~8cm na entrada (confianca moderada: 65%). Nao temos informacao sobre rampa.
- Interior: Sem dados.
- Casa de banho: Sem dados.
- Estacionamento: Nao parece ter estacionamento proprio.

Nao temos dados suficientes para garantir acessibilidade para a sua cadeira electrica. Recomendo:
1. Ligar directamente para o restaurante: 222 XXX XXX
2. Se conhece o restaurante, pode submeter uma avaliacao para ajudar outros utilizadores

Quer que procure restaurantes acessiveis proximos do Cantinho do Porto?
```

### 5.6 Tratamento de Erros

| Cenario | Resposta do Assistente |
|---|---|
| Restaurante nao encontrado | "Nao encontrei esse restaurante na nossa base de dados. Pode verificar o nome? Ou pode adiciona-lo para ajudar a comunidade." |
| Dados desactualizados (>6 meses) | "Aviso: Os dados de acessibilidade deste restaurante foram actualizados pela ultima vez ha [X] meses. Recomendamos confirmacao directa." |
| Utilizador sem perfil configurado | "Para dar recomendacoes personalizadas, preciso de saber o tipo de cadeira/equipamento que usa. Quer configurar o seu perfil agora?" |
| Erro na API Claude | Fallback para dados estruturados sem sumarizacao: mostrar dados brutos de acessibilidade em formato legivel |

### 5.7 Consideracoes de Performance e Custos

- Resposta conversacional tipica: ~1500 tokens input + 400 tokens output = ~$0.006 (Sonnet 4.6)
- Sessao media (5 mensagens): ~$0.03
- Rate limit recomendado: max 20 mensagens por sessao, 100 sessoes/dia
- **1000 sessoes/mes:** ~$30

---

## 6. Analise de Ementas

### 6.1 Descricao e Historia de Utilizador

**Como** utilizador com alergias alimentares e mobilidade reduzida, **quero** que o sistema analise a ementa de um restaurante a partir de uma foto ou ficheiro digital **para que** identifique alergenos, opcoes dieteticas e avalie a acessibilidade do formato da ementa.

### 6.2 Abordagem Tecnica

```
Ementa submetida (foto, PDF, URL ou texto)
       |
       v
Claude Vision extrai texto e estrutura da ementa
       |
       v
Identificacao de pratos, precos, descricoes
       |
       v
Deteccao de alergenos e informacao dietetica (IA + base de dados de ingredientes)
       |
       v
Avaliacao do formato de acessibilidade da ementa
       |
       v
Dados estruturados guardados no perfil do restaurante
```

### 6.3 System Prompt para Analise de Ementas

```
Es o modulo de analise de ementas do Eat Out Adviser. Recebes uma ementa de restaurante (imagem, texto ou PDF) e deves:

1. EXTRAIR todos os pratos com:
   - nome do prato
   - descricao (se disponivel)
   - preco (se visivel)
   - categoria (entrada, prato principal, sobremesa, bebida, etc.)

2. IDENTIFICAR para cada prato:
   - alergenos provaveis baseados nos ingredientes visiveis (gluten, lactose, frutos secos, marisco, ovos, soja, etc.)
   - adequacao dietetica (vegetariano, vegano, sem gluten, low-carb, etc.)
   - NOTA: Marca como "inferido" quando deduzido dos ingredientes, vs "declarado" quando explicitamente indicado na ementa

3. AVALIAR A ACESSIBILIDADE DO FORMATO da ementa:
   - Tamanho da letra (estimado): legivel / pequena / muito pequena
   - Contraste: bom / insuficiente
   - Organizacao: clara / confusa
   - Lingua: portugues / ingles / bilingue / outra
   - Formato digital disponivel: sim / nao / desconhecido
   - Alergenos declarados: sim / parcialmente / nao
   - QR code para versao digital: visivel / nao visivel

Escreve em portugues de Portugal. Se uma secao nao e visivel/legivel, indica "nao legivel na fotografia".
```

### 6.4 Formato de Saida

```json
{
  "menu_analysis": {
    "restaurant_id": "r_042",
    "extraction_date": "2026-03-15",
    "source_type": "photo",
    "dishes": [
      {
        "name": "Carbonara alla Romana",
        "description": "Esparguete com guanciale, pecorino, ovo e pimenta preta",
        "price_eur": 14.50,
        "category": "prato_principal",
        "allergens": {
          "declared": [],
          "inferred": ["gluten", "lactose", "ovos"],
          "confidence": 0.9
        },
        "dietary": {
          "vegetarian": false,
          "vegan": false,
          "gluten_free": false
        }
      }
    ],
    "menu_accessibility": {
      "font_size": "legivel",
      "contrast": "bom",
      "organization": "clara",
      "languages": ["portugues", "italiano"],
      "allergen_info_declared": "parcialmente",
      "digital_version_available": "desconhecido",
      "qr_code_visible": false,
      "overall_readability_score": 0.75,
      "recommendations": [
        "Adicionar declaracao completa de alergenos segundo regulamento UE 1169/2011",
        "Disponibilizar versao digital via QR code para leitores de ecra"
      ]
    }
  }
}
```

### 6.5 Tratamento de Erros

| Cenario | Estrategia |
|---|---|
| Foto desfocada/ilegivel | Informar utilizador e pedir nova foto com melhor qualidade |
| Ementa em lingua nao identificada | Identificar lingua e traduzir antes de analisar |
| Precos nao visiveis | Extrair pratos sem precos, marcar como "preco nao disponivel" |
| Alergenos nao declarados | Inferir dos ingredientes com aviso claro: "Alergenos inferidos pela IA, nao declarados pelo restaurante. Confirme com o staff." |

### 6.6 Consideracoes de Performance e Custos

- Analise de ementa (1 pagina foto): ~2000 tokens input + 1000 tokens output = ~$0.012 (Sonnet 4.6 com vision)
- Ementa completa (3-4 paginas): ~$0.048
- **50 ementas/mes:** ~$2.4

---

## 7. Geracao de Relatorios de Acessibilidade

### 7.1 Descricao e Historia de Utilizador

**Como** dono de restaurante, **quero** receber um relatorio detalhado de acessibilidade do meu espaco **para que** compreenda o que esta bem, o que precisa de melhorar e qual o custo estimado das melhorias.

### 7.2 Abordagem Tecnica

```
Dados do restaurante agregados (perfil, fotos, avaliacoes, ementa)
       |
       v
Claude gera relatorio estruturado com 5 seccoes
       |
       v
Inclusao de estimativas de custo baseadas em tabela de precos de referencia
       |
       v
Relatorio em formato HTML/PDF partilhavel
```

### 7.3 System Prompt para Geracao de Relatorio

```
Es o modulo de geracao de relatorios de acessibilidade do Eat Out Adviser. Geras relatorios profissionais e accionaveis para donos de restaurantes.

O relatorio deve conter:

1. RESUMO EXECUTIVO: Classificacao geral (A a D) e principais conclusoes em 3-4 frases

2. ANALISE DETALHADA por area:
   a) Entrada e acesso exterior
   b) Interior e area de refeicoes
   c) Casa(s) de banho
   d) Estacionamento
   e) Ementa e comunicacao
   Para cada area: situacao actual, conformidade com normas (ISO 21542:2021, DL 163/2006), e classificacao (Conforme / Parcialmente conforme / Nao conforme)

3. PONTOS FORTES: O que o restaurante ja faz bem

4. RECOMENDACOES DE MELHORIA: Ordenadas por impacto e custo
   Para cada recomendacao:
   - Descricao da melhoria
   - Prioridade: critica / alta / media / baixa
   - Custo estimado: intervalo em euros
   - Impacto esperado no score de acessibilidade
   - Norma/legislacao aplicavel

5. CLASSIFICACAO FINAL:
   - A (Excelente): Score >= 85, acessivel a todos os tipos de mobilidade
   - B (Bom): Score 70-84, acessivel com pequenas limitacoes
   - C (Suficiente): Score 50-69, acessivel com assistencia
   - D (Insuficiente): Score < 50, barreiras significativas

Escreve em portugues de Portugal. Tom profissional mas acessivel. Usa legislacao portuguesa quando aplicavel (DL 163/2006 - Normas tecnicas de acessibilidade).
```

### 7.4 Tabela de Custos de Referencia para Melhorias

```typescript
const improvementCosts: Record<string, { min: number; max: number; unit: string }> = {
  "rampa_fixa_curta": { min: 500, max: 2000, unit: "EUR" },
  "rampa_fixa_longa": { min: 2000, max: 8000, unit: "EUR" },
  "rampa_portatil": { min: 150, max: 500, unit: "EUR" },
  "alargamento_porta": { min: 800, max: 3000, unit: "EUR" },
  "porta_automatica": { min: 2000, max: 5000, unit: "EUR" },
  "casa_banho_adaptacao_completa": { min: 5000, max: 15000, unit: "EUR" },
  "barras_apoio_casa_banho": { min: 100, max: 400, unit: "EUR" },
  "rebaixamento_balcao": { min: 500, max: 2000, unit: "EUR" },
  "sinaletica_acessibilidade": { min: 50, max: 300, unit: "EUR" },
  "menu_braille": { min: 200, max: 500, unit: "EUR" },
  "menu_digital_qrcode": { min: 100, max: 500, unit: "EUR" },
  "lugar_estacionamento_reservado": { min: 200, max: 800, unit: "EUR" },
  "piso_antiderrapante": { min: 20, max: 60, unit: "EUR/m2" },
  "iluminacao_melhorada": { min: 300, max: 1500, unit: "EUR" },
  "corrimao": { min: 150, max: 600, unit: "EUR/metro" }
};
```

### 7.5 Exemplo de Output (Excerto)

```
RELATORIO DE ACESSIBILIDADE
Restaurante: Trattoria da Maria
Data: 15 de Marco de 2026
Classificacao: B (Bom)

RESUMO EXECUTIVO
O restaurante apresenta boas condicoes gerais de acessibilidade, com entrada
acessivel por rampa e espaco interior amplo. A principal area de melhoria e
a casa de banho, que cumpre requisitos minimos mas beneficiaria de mais espaco
de manobra. Score global: 74/100.

RECOMENDACOES PRIORITARIAS:

1. [ALTA] Instalar porta automatica na entrada
   Custo estimado: 2.000-5.000 EUR
   Impacto: +5 pontos no score
   Norma: DL 163/2006, Seccao 2.5

2. [MEDIA] Ampliar casa de banho adaptada para raio de manobra de 150cm
   Custo estimado: 5.000-10.000 EUR
   Impacto: +8 pontos no score
   Norma: ISO 21542:2021, Seccao 40

3. [BAIXA] Disponibilizar ementa em formato digital acessivel
   Custo estimado: 100-500 EUR
   Impacto: +3 pontos no score
```

### 7.6 Consideracoes de Performance e Custos

- Geracao de relatorio completo: ~5000 tokens input + 2000 tokens output = ~$0.025 (Sonnet 4.6)
- Pode usar Opus 4.5 para relatorios mais detalhados: ~$0.15
- **20 relatorios/mes (Sonnet):** ~$0.50

---

## 8. Traducao Automatica com IA

### 8.1 Descricao e Historia de Utilizador

**Como** turista estrangeiro com mobilidade reduzida a visitar o Porto, **quero** ler avaliacoes de acessibilidade na minha lingua **para que** consiga planear refeicoes em restaurantes acessiveis sem barreira linguistica.

### 8.2 Abordagem Tecnica

```
Conteudo original (avaliacao, descricao, relatorio)
       |
       v
Deteccao de lingua de origem (Claude ou heuristica)
       |
       v
Traducao via Claude com preservacao de terminologia de acessibilidade
       |
       v
Cache da traducao (chave: hash do conteudo + lingua destino)
       |
       v
Conteudo traduzido servido ao utilizador
```

### 8.3 System Prompt para Traducao

```
Es o modulo de traducao do Eat Out Adviser, uma aplicacao de acessibilidade para restaurantes. Traduz o conteudo fornecido de {lingua_origem} para {lingua_destino}.

REGRAS CRITICAS:

1. TERMINOLOGIA DE ACESSIBILIDADE: Usa sempre os termos correctos na lingua destino. Exemplos:
   - PT: "cadeira de rodas" -> EN: "wheelchair" (nunca "wheel chair")
   - PT: "rampa de acesso" -> EN: "access ramp"
   - PT: "casa de banho adaptada" -> EN: "accessible restroom" (nao "adapted bathroom")
   - PT: "lugar de estacionamento reservado" -> EN: "accessible parking space"
   - PT: "mobilidade reduzida" -> EN: "reduced mobility" ou "mobility impairment"
   - PT: "piso tactil" -> EN: "tactile paving"

2. ADAPTACAO CULTURAL:
   - Unidades de medida: manter centimetros (padrao europeu) com nota em polegadas se destino for EN-US
   - Legislacao: manter referencia original e adicionar equivalente local se relevante
   - Nomes de pratos: manter nome original em italico com descricao traduzida

3. PRESERVAR ESTRUTURA: Manter formatacao, paragrafos, listas e JSON se aplicavel

4. NOMES PROPRIOS: Nao traduzir nomes de restaurantes, ruas, zonas geograficas

5. Tom: Manter o tom original (formal se relatorio, informal se avaliacao)
```

### 8.4 Linguas Suportadas (MVP)

| Lingua | Codigo | Prioridade |
|---|---|---|
| Portugues (Portugal) | pt-PT | Lingua base |
| Ingles | en | Alta - turismo |
| Espanhol | es | Alta - proximidade |
| Frances | fr | Media - turismo |
| Alemao | de | Media - turismo |

### 8.5 Estrategia de Cache

```typescript
async function getTranslation(
  contentHash: string,
  targetLang: string,
  originalContent: string
): Promise<string> {
  // 1. Verificar cache
  const cached = await db.query.translations.findFirst({
    where: and(
      eq(translations.content_hash, contentHash),
      eq(translations.target_lang, targetLang)
    )
  });

  if (cached && cached.created_at > subDays(new Date(), 90)) {
    return cached.translated_content;
  }

  // 2. Traduzir via Claude
  const translated = await translateWithClaude(originalContent, targetLang);

  // 3. Guardar em cache
  await db.insert(translations).values({
    content_hash: contentHash,
    source_lang: detectLanguage(originalContent),
    target_lang: targetLang,
    original_content: originalContent,
    translated_content: translated,
    created_at: new Date()
  }).onConflictDoUpdate({
    target: [translations.content_hash, translations.target_lang],
    set: { translated_content: translated, created_at: new Date() }
  });

  return translated;
}
```

### 8.6 Tratamento de Erros

| Cenario | Estrategia |
|---|---|
| Lingua nao suportada | Fallback para ingles com aviso |
| Conteudo misto (varias linguas) | Traduzir cada segmento individualmente |
| Termos tecnicos sem traducao | Manter termo original entre aspas com explicacao |
| Erro na API | Mostrar conteudo original com botao "Tentar traduzir novamente" |

### 8.7 Consideracoes de Performance e Custos

- Traducao de avaliacao media (~200 palavras): ~400 tokens input + 400 tokens output = ~$0.003
- Cache elimina traducoes repetidas (eficacia estimada: 70% de cache hits apos primeiro mes)
- **500 traducoes/mes (sem cache):** ~$1.50
- **Com cache (30% novas):** ~$0.45/mes

---

## 9. Servidor MCP Personalizado

### 9.1 Descricao e Historia de Utilizador

**Como** developer a trabalhar no ecossistema Eat Out Adviser, **quero** um servidor MCP que exponha as funcionalidades da aplicacao **para que** ferramentas de IA (Claude Code, Claude Desktop, outros agentes) possam interagir directamente com os dados de acessibilidade.

### 9.2 Abordagem Tecnica

O servidor MCP segue a especificacao MCP 2025-11-25 e comunica via JSON-RPC 2.0 sobre stdio ou SSE.

```
Agente IA (Claude Code, Claude Desktop, etc.)
       |
       v (MCP Protocol - JSON-RPC 2.0)
       |
Servidor MCP Eat Out Adviser
       |
       +-- Tools (ferramentas executaveis)
       +-- Resources (dados leiveis)
       +-- Prompts (templates reutilizaveis)
       |
       v
Base de Dados PostgreSQL + APIs da aplicacao
```

### 9.3 Definicoes de Ferramentas MCP

```json
{
  "tools": [
    {
      "name": "search_restaurants",
      "description": "Pesquisa restaurantes na base de dados do Eat Out Adviser com filtros de acessibilidade, localizacao e cozinha.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Pesquisa em linguagem natural"
          },
          "location": {
            "type": "object",
            "properties": {
              "latitude": { "type": "number" },
              "longitude": { "type": "number" },
              "radius_km": { "type": "number", "default": 5 }
            }
          },
          "accessibility_filters": {
            "type": "object",
            "properties": {
              "wheelchair_accessible": { "type": "boolean" },
              "has_ramp": { "type": "boolean" },
              "has_accessible_bathroom": { "type": "boolean" },
              "has_parking": { "type": "boolean" },
              "min_door_width_cm": { "type": "number" },
              "min_accessibility_score": { "type": "number" }
            }
          },
          "cuisine": { "type": "string" },
          "price_range": {
            "type": "string",
            "enum": ["economico", "moderado", "premium"]
          },
          "limit": { "type": "number", "default": 10 }
        }
      }
    },
    {
      "name": "get_accessibility_report",
      "description": "Obtem o relatorio de acessibilidade detalhado de um restaurante especifico.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "restaurant_id": { "type": "string" },
          "include_photos": { "type": "boolean", "default": false },
          "include_reviews": { "type": "boolean", "default": true }
        },
        "required": ["restaurant_id"]
      }
    },
    {
      "name": "submit_review",
      "description": "Submete uma avaliacao de acessibilidade para um restaurante.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "restaurant_id": { "type": "string" },
          "user_id": { "type": "string" },
          "overall_rating": { "type": "number", "minimum": 1, "maximum": 5 },
          "accessibility_rating": { "type": "number", "minimum": 1, "maximum": 5 },
          "text": { "type": "string" },
          "accessibility_details": {
            "type": "object",
            "properties": {
              "entrance_accessible": { "type": "boolean" },
              "bathroom_accessible": { "type": "boolean" },
              "interior_spacious": { "type": "boolean" },
              "staff_helpful": { "type": "boolean" }
            }
          }
        },
        "required": ["restaurant_id", "user_id", "overall_rating", "text"]
      }
    },
    {
      "name": "get_user_profile",
      "description": "Obtem o perfil de acessibilidade de um utilizador.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "user_id": { "type": "string" }
        },
        "required": ["user_id"]
      }
    },
    {
      "name": "update_user_profile",
      "description": "Actualiza o perfil de acessibilidade de um utilizador.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "user_id": { "type": "string" },
          "mobility_type": {
            "type": "string",
            "enum": ["cadeira_electrica", "cadeira_manual", "andarilho", "muletas", "mobilidade_reduzida"]
          },
          "wheelchair_width_cm": { "type": "number" },
          "wheelchair_length_cm": { "type": "number" },
          "needs_accessible_bathroom": { "type": "boolean" },
          "needs_parking": { "type": "boolean" },
          "dietary_restrictions": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["user_id"]
      }
    },
    {
      "name": "analyze_photo",
      "description": "Analisa uma fotografia de restaurante para avaliacao de acessibilidade.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "restaurant_id": { "type": "string" },
          "photo_url": { "type": "string" },
          "space_type": {
            "type": "string",
            "enum": ["entrance", "interior", "bathroom", "parking", "menu", "exterior"]
          }
        },
        "required": ["restaurant_id", "photo_url"]
      }
    }
  ]
}
```

### 9.4 Definicoes de Recursos MCP

```json
{
  "resources": [
    {
      "uri": "eatout://restaurants/{restaurant_id}",
      "name": "Perfil de Restaurante",
      "description": "Dados completos de um restaurante incluindo acessibilidade, localizacao e avaliacoes.",
      "mimeType": "application/json"
    },
    {
      "uri": "eatout://restaurants/{restaurant_id}/accessibility",
      "name": "Dados de Acessibilidade",
      "description": "Perfil detalhado de acessibilidade de um restaurante.",
      "mimeType": "application/json"
    },
    {
      "uri": "eatout://restaurants/{restaurant_id}/reviews",
      "name": "Avaliacoes do Restaurante",
      "description": "Lista de avaliacoes de utilizadores com foco em acessibilidade.",
      "mimeType": "application/json"
    },
    {
      "uri": "eatout://users/{user_id}/profile",
      "name": "Perfil do Utilizador",
      "description": "Perfil de acessibilidade e preferencias do utilizador.",
      "mimeType": "application/json"
    },
    {
      "uri": "eatout://stats/overview",
      "name": "Estatisticas Gerais",
      "description": "Estatisticas agregadas: total de restaurantes, avaliacoes, cobertura por zona.",
      "mimeType": "application/json"
    }
  ]
}
```

### 9.5 Exemplos de Interaccao MCP

**Exemplo: Claude Code pesquisa restaurantes acessiveis**

```json
// Request (agente -> servidor MCP)
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_restaurants",
    "arguments": {
      "query": "italiano com estacionamento",
      "location": {
        "latitude": 41.1496,
        "longitude": -8.6109,
        "radius_km": 3
      },
      "accessibility_filters": {
        "wheelchair_accessible": true,
        "has_parking": true,
        "min_accessibility_score": 70
      },
      "limit": 5
    }
  }
}

// Response (servidor MCP -> agente)
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"results\":[{\"id\":\"r_042\",\"name\":\"Trattoria da Maria\",\"accessibility_score\":87,\"cuisine\":\"italiana\",\"distance_km\":1.2,\"has_parking\":true,\"address\":\"Rua de Santa Catarina 342, Porto\"}],\"total\":1}"
      }
    ]
  }
}
```

**Exemplo: Leitura de recurso**

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "eatout://restaurants/r_042/accessibility"
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "contents": [
      {
        "uri": "eatout://restaurants/r_042/accessibility",
        "mimeType": "application/json",
        "text": "{\"entrance\":{\"level_access\":false,\"has_ramp\":true,\"ramp_slope_percent\":6,\"door_width_cm\":90,\"automatic_door\":false},\"interior\":{\"table_spacing_cm\":120,\"accessible_tables\":4},\"bathroom\":{\"is_adapted\":true,\"door_width_cm\":85,\"grab_bars\":true,\"turning_radius_cm\":160},\"parking\":{\"has_accessible_spots\":true,\"distance_to_entrance_m\":50}}"
      }
    ]
  }
}
```

### 9.6 Implementacao Tecnica

```typescript
// src/mcp-server/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "eat-out-adviser",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {},
    resources: { subscribe: true },
    prompts: {}
  }
});

// Registar handlers para cada ferramenta
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "search_restaurants":
      return await handleSearchRestaurants(request.params.arguments);
    case "get_accessibility_report":
      return await handleGetAccessibilityReport(request.params.arguments);
    case "submit_review":
      return await handleSubmitReview(request.params.arguments);
    // ... outros handlers
  }
});

// Iniciar servidor
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 9.7 Consideracoes de Performance

- Servidor MCP corre localmente como processo Node.js
- Comunicacao stdio: latencia <1ms
- Comunicacao SSE: latencia <10ms
- Memoria estimada: ~50-100MB
- Sem custos de API (acesso directo a base de dados local)

---

## 10. Pipeline de Embeddings

### 10.1 Descricao e Historia de Utilizador

**Como** sistema de backend, **preciso** de um pipeline robusto para gerar, armazenar e actualizar embeddings de restaurantes, perfis de utilizador e avaliacoes **para que** a busca semantica e o sistema de matching funcionem com alta qualidade.

### 10.2 Abordagem Tecnica

```
Dados fonte (restaurante, avaliacao, perfil)
       |
       v
Pre-processamento: construir texto representativo para embedding
       |
       v
Geracao de embedding via nomic-embed-text-v2 (Ollama)
       |
       v
Armazenamento em PostgreSQL pgvector (coluna vector(768))
       |
       v
Indexacao HNSW para busca rapida
       |
       v
Actualizacao incremental quando dados mudam
```

### 10.3 Estrategia de Embedding por Tipo de Dado

**Restaurantes:**

```typescript
function buildRestaurantEmbeddingText(restaurant: Restaurant): string {
  // Prefixo especifico para busca (recomendado pelo nomic-embed-text-v2)
  return `search_document: ${restaurant.name}. ${restaurant.description}. ` +
    `Cozinha ${restaurant.cuisine}. ` +
    `Localizado em ${restaurant.address}, ${restaurant.area}. ` +
    `Acessibilidade: ${restaurant.accessibility_summary}. ` +
    `Caracteristicas: ${restaurant.features.join(', ')}. ` +
    `Preco: ${restaurant.price_range}. ` +
    (restaurant.specialties ? `Especialidades: ${restaurant.specialties.join(', ')}.` : '');
}
```

**Avaliacoes de utilizador:**

```typescript
function buildReviewEmbeddingText(review: Review): string {
  return `search_document: Avaliacao de ${review.restaurant_name}. ` +
    `${review.text}. ` +
    `Classificacao: ${review.rating}/5. ` +
    (review.mobility_type ? `Avaliador com ${review.mobility_type}.` : '');
}
```

**Perfis de utilizador (para matching):**

```typescript
function buildUserProfileEmbeddingText(user: UserProfile): string {
  return `search_document: Utilizador com ${user.mobility_type}. ` +
    `Necessita: ${user.accessibility_needs.join(', ')}. ` +
    `Preferencias: cozinha ${user.preferred_cuisines.join(', ')}. ` +
    `Zona: ${user.preferred_area}. ` +
    `Restricoes alimentares: ${user.dietary_restrictions.join(', ') || 'nenhuma'}.`;
}
```

### 10.4 Escolha do Modelo e Dimensionalidade

| Modelo | Dimensoes | Tamanho | RAM (inferencia) | Velocidade (N5105) | Multilingue |
|---|---|---|---|---|---|
| **nomic-embed-text-v2** | 768 | ~950MB | ~2GB | ~50-100ms/query | Sim (100+ linguas) |
| all-MiniLM-L12-v2 | 384 | ~134MB | ~500MB | ~20-30ms/query | Limitado |
| mxbai-embed-large | 1024 | ~670MB | ~1.5GB | ~80-120ms/query | Sim |

**Justificacao da escolha (nomic-embed-text-v2):**
- Arquitectura MoE activa apenas 305M de 475M parametros -- eficiente para N5105
- 768 dimensoes oferecem bom equilibrio entre qualidade e armazenamento
- Suporte nativo a portugues (treinado em 100+ linguas)
- Prefixos `search_query:` e `search_document:` melhoram relevancia em 5-10%
- Matryoshka Representation Learning permite reduzir para 256 dimensoes com perda minima (~2-3%) se necessario

### 10.5 Armazenamento e Indexacao em pgvector

```sql
-- Tabela de embeddings de restaurantes
CREATE TABLE restaurant_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  embedding_text TEXT NOT NULL,  -- texto usado para gerar o embedding (para debug)
  model_version VARCHAR(50) NOT NULL DEFAULT 'nomic-embed-text-v2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id)
);

-- Indice HNSW para busca rapida por similaridade coseno
CREATE INDEX idx_restaurant_embeddings_hnsw
  ON restaurant_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Tabela de embeddings de avaliacoes
CREATE TABLE review_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  model_version VARCHAR(50) NOT NULL DEFAULT 'nomic-embed-text-v2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id)
);

CREATE INDEX idx_review_embeddings_hnsw
  ON review_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Tabela de embeddings de perfis de utilizador
CREATE TABLE user_profile_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  model_version VARCHAR(50) NOT NULL DEFAULT 'nomic-embed-text-v2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_profile_embeddings_hnsw
  ON user_profile_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 10.6 Estrategia de Actualizacao de Embeddings

```typescript
// Estrategia de actualizacao baseada em eventos
const embeddingUpdateStrategy = {
  restaurant: {
    // Re-gerar embedding quando:
    triggers: [
      "restaurant_profile_updated",   // Dados do restaurante alterados
      "accessibility_profile_updated", // Dados de acessibilidade alterados
      "new_review_milestone",          // A cada 5 novas avaliacoes
      "photo_analysis_completed",      // Nova analise de foto concluida
    ],
    // Batch update nocturno para consistencia
    batch_schedule: "0 3 * * *", // 3:00 AM diariamente
    // Prioridade: restaurantes com dados alterados nas ultimas 24h
    batch_priority: "updated_at DESC"
  },

  review: {
    // Embedding gerado imediatamente apos submissao
    triggers: ["review_submitted", "review_edited"],
    // Sem batch (avaliacoes nao mudam frequentemente)
  },

  user_profile: {
    // Re-gerar quando perfil muda
    triggers: ["profile_updated", "preferences_changed"],
    // Batch semanal para capturar mudancas implicitas
    batch_schedule: "0 4 * * 0", // Domingos as 4:00 AM
  }
};

// Funcao de geracao de embedding via Ollama
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text-v2",
      prompt: text
    })
  });

  const data = await response.json();
  return data.embedding; // vector de 768 dimensoes
}

// Pipeline de actualizacao em batch
async function batchUpdateRestaurantEmbeddings(): Promise<void> {
  const outdatedRestaurants = await db.query.restaurants.findMany({
    where: or(
      // Restaurantes sem embedding
      isNull(restaurants.last_embedding_at),
      // Restaurantes actualizados desde ultimo embedding
      gt(restaurants.updated_at, restaurants.last_embedding_at)
    ),
    orderBy: desc(restaurants.updated_at),
    limit: 100 // Processar 100 de cada vez para nao sobrecarregar N5105
  });

  for (const restaurant of outdatedRestaurants) {
    const text = buildRestaurantEmbeddingText(restaurant);
    const embedding = await generateEmbedding(text);

    await db.insert(restaurantEmbeddings)
      .values({
        restaurant_id: restaurant.id,
        embedding: embedding,
        embedding_text: text,
        model_version: "nomic-embed-text-v2",
        updated_at: new Date()
      })
      .onConflictDoUpdate({
        target: restaurantEmbeddings.restaurant_id,
        set: {
          embedding: embedding,
          embedding_text: text,
          updated_at: new Date()
        }
      });

    // Delay entre embeddings para nao saturar o N5105
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}
```

### 10.7 Consideracoes de Performance (N5105 16GB)

| Operacao | Tempo Estimado | RAM |
|---|---|---|
| Gerar 1 embedding | 50-100ms | ~2GB (modelo carregado) |
| Batch de 100 embeddings | 10-15s | ~2GB |
| Batch de 1000 embeddings | 2-3 min | ~2GB |
| Busca vectorial (10k registos) | <5ms | Depende do indice |
| Busca vectorial (100k registos) | <15ms | Depende do indice |

**Armazenamento por embedding:**
- 768 dimensoes x 4 bytes (float32) = 3072 bytes = ~3KB por embedding
- 10.000 restaurantes = ~30MB de embeddings
- 100.000 avaliacoes = ~300MB de embeddings
- Com indice HNSW: ~2x o tamanho dos dados base

**Optimizacoes para N5105:**
- Manter o modelo Ollama carregado em memoria (evitar cold start de ~5s)
- Processar batches durante horas de baixo trafego (noite)
- Se memoria for limitada, usar dimensionalidade Matryoshka reduzida (256 dim = ~1KB por embedding)
- Monitorizar temperatura da CPU durante batches longos (N5105 e passivamente arrefecido)

### 10.8 Estimativa de Custos

- Embeddings locais via Ollama: **zero custo de API**
- Custo computacional: electricidade (~5W adicionais durante processamento)
- Armazenamento PostgreSQL: incluido na infraestrutura existente
- Se fallback para API (Anthropic/OpenAI embeddings): ~$0.00002 por embedding = $0.20 por 10.000 embeddings

---

## Resumo de Custos Mensais Estimados (API Claude)

| Funcionalidade | Custo/Unidade | Volume Estimado/Mes | Custo Mensal |
|---|---|---|---|
| Pesquisa em linguagem natural | $0.014/pesquisa | 1000 pesquisas | $14.00 |
| Analise de fotografias | $0.04/restaurante | 100 restaurantes | $4.00 |
| Sumarizacao de avaliacoes | $0.01/sumario | 200 actualizacoes | $2.00 |
| Assistente conversacional | $0.03/sessao | 1000 sessoes | $30.00 |
| Analise de ementas | $0.048/ementa | 50 ementas | $2.40 |
| Relatorios de acessibilidade | $0.025/relatorio | 20 relatorios | $0.50 |
| Traducao | $0.003/traducao | 150 traducoes | $0.45 |
| Matching personalizado | $0 (local) | - | $0.00 |
| Servidor MCP | $0 (local) | - | $0.00 |
| Pipeline de embeddings | $0 (Ollama local) | - | $0.00 |
| **Total estimado** | | | **~$53.35/mes** |

**Nota:** Estes valores assumem utilizacao do Claude Sonnet 4.6 para a maioria das tarefas. Utilizacao de Opus 4.5 para tarefas criticas (relatorios detalhados, analise complexa) pode aumentar os custos em 3-5x para essas funcionalidades especificas. Com optimizacoes de cache e rate limiting, o custo real pode ser 30-50% inferior ao estimado.

---

## Consideracoes Transversais

### Privacidade e RGPD

- Perfis de utilizador e dados de saude/mobilidade sao dados sensiveis segundo o RGPD
- Embeddings de perfis de utilizador devem ser gerados e armazenados localmente (nunca enviados para APIs externas)
- Conteudo enviado para API Claude nao deve incluir dados pessoais identificaveis quando possivel
- Consentimento explicito para analise de fotografias que contenham pessoas
- Direito ao esquecimento: eliminar embeddings quando utilizador apaga conta

### Disponibilidade e Fallbacks

| Servico | Fallback |
|---|---|
| Claude API indisponivel | Cache de respostas frequentes + busca estruturada apenas (sem IA) |
| Ollama indisponivel | Full-text search PostgreSQL (sem busca semantica) |
| pgvector lento | Busca estruturada SQL com filtros + cache |
| Internet indisponivel | PWA com dados em cache local (Service Worker) |

### Monitorizacao de Qualidade da IA

```typescript
// Metricas a recolher para cada funcionalidade de IA
interface AIQualityMetrics {
  feature: string;
  // Latencia
  response_time_ms: number;
  // Custo
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  // Qualidade (feedback implicito e explicito)
  user_clicked_result: boolean;        // Para pesquisa
  user_visited_restaurant: boolean;    // Para recomendacoes
  user_rated_helpful: boolean | null;  // Feedback explicito
  // Erros
  error_type: string | null;
  fallback_used: boolean;
}
```
