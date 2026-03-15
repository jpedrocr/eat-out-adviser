# Eat Out Adviser - Especificacao da Aplicacao

**Versao:** 1.0 **Data:** 15 de Marco de 2026 **Autor:** Joao Pedro **Estado:** Rascunho para validacao

---

## Indice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Analise de Mercado](#2-analise-de-mercado)
3. [Personas de Utilizador](#3-personas-de-utilizador)
4. [Requisitos Funcionais](#4-requisitos-funcionais)
5. [Requisitos Nao-Funcionais](#5-requisitos-nao-funcionais)
6. [Sistema de Classificacao de Acessibilidade](#6-sistema-de-classificacao-de-acessibilidade)
7. [Funcionalidades de IA](#7-funcionalidades-de-ia)
8. [Modelo de Dados](#8-modelo-de-dados)
9. [Arquitectura do Sistema](#9-arquitectura-do-sistema)
10. [Internacionalizacao](#10-internacionalizacao)
11. [Modelo de Negocio](#11-modelo-de-negocio)
12. [Roadmap](#12-roadmap)
13. [Metricas de Sucesso](#13-metricas-de-sucesso)
14. [Riscos e Mitigacoes](#14-riscos-e-mitigacoes)

---

## 1. Resumo Executivo

### 1.1 Visao

O Eat Out Adviser e uma plataforma open source centrada em acessibilidade fisica que permite a pessoas com mobilidade reduzida encontrar, avaliar e reservar restaurantes com confianca. A aplicacao combina dados estruturados de acessibilidade, verificacao comunitaria e inteligencia artificial para oferecer recomendacoes verdadeiramente personalizadas ao perfil de cada utilizador.

### 1.2 Missao

Eliminar a incerteza e a ansiedade que uma pessoa com mobilidade reduzida sente ao escolher um restaurante, transformando informacao fragmentada e inconsistente numa experiencia de decisao simples, fiavel e dignificante.

### 1.3 Declaracao do Problema

**Problema pessoal:** Escolher um restaurante para almoco ou jantar -- uma actividade social trivial para a maioria das pessoas -- e um exercicio de frustracao e risco para quem utiliza cadeira de rodas electrica. A pergunta fundamental nao e "a comida e boa?" mas sim "consigo entrar?". E quando se consegue entrar, surgem dezenas de outras questoes: ha espaco para a cadeira entre as mesas? A casa de banho e acessivel? A mesa tem altura compativel?

**Problema de mercado:** Apesar de existirem 15+ plataformas internacionais com dados de acessibilidade (AccessNow, Wheelmap, AXS Map, Euan's Guide, entre outras), nenhuma oferece cobertura forte em Portugal. Os dados estao fragmentados entre multiplas plataformas, a verificacao e inconsistente, e nenhuma integra inteligencia artificial com dados estruturados de acessibilidade para oferecer recomendacoes personalizadas ao perfil especifico de cada utilizador.

**Problema regulamentar:** O European Accessibility Act (EAA), em vigor desde Junho de 2025, obriga prestadores de servicos na UE a cumprir requisitos de acessibilidade. Apesar disso, nao existe uma ferramenta que ajude restaurantes em Portugal a compreender, medir e comunicar o seu nivel de acessibilidade de forma estruturada.

### 1.4 Porque Este Projecto Importa

**Dimensao pessoal:** O Eat Out Adviser nasce de uma necessidade real e quotidiana. O seu criador, utilizador de cadeira de rodas electrica na area do Grande Porto, vive diariamente o problema que a aplicacao pretende resolver. Cada refeicao fora de casa envolve telefonemas prvios, pesquisas no Google sem resultados fiveis, e a aceitacao de que muitos restaurantes simplesmente nao sao uma opcao.

**Dimensao de mercado:** O turismo acessivel representa um mercado de 58 mil milhoes de dolares por ano a nivel global. Em Portugal, o turismo e um pilar da economia, mas a oferta de informacao de acessibilidade e praticamente inexistente. O Eat Out Adviser posiciona-se como a primeira plataforma dedicada com forte cobertura no territorio portugues.

**Dimensao social:** Uma em cada seis pessoas na UE vive com alguma forma de deficiencia. A acessibilidade nao e uma funcionalidade de nicho -- e um requisito basico de cidadania e inclusao social.

---

## 2. Analise de Mercado

### 2.1 Plataformas Internacionais Analisadas

Foram analisadas 15 plataformas que abordam acessibilidade fisica, divididas em duas categorias:

**Plataformas dedicadas a acessibilidade (11):**

| Plataforma          | Sede        | Cobertura               | Modelo                      | Diferencial                                       |
| ------------------- | ----------- | ----------------------- | --------------------------- | ------------------------------------------------- |
| AccessNow           | Canada      | 200k locais, 35 paises  | Hibrido (dados + parcerias) | IA para resumos de acessibilidade                 |
| Wheelmap            | Alemanha    | 3M locais, global       | Sem fins lucrativos         | OpenStreetMap, dados abertos, A11yJSON            |
| AXS Map             | EUA         | 600k locais             | Sem fins lucrativos         | Perguntas sim/nao objectivas                      |
| Jaccede             | Franca      | 28k locais              | Sem fins lucrativos         | Detalhe fino (largura de portas, rampas)          |
| Euan's Guide        | Reino Unido | Milhares de avaliacoes  | Charity                     | Avaliacoes narrativas por pessoas com deficiencia |
| AccessibleGO        | EUA         | 6k hoteis, 180+ cidades | Comercial (comissoes)       | Verificacao humana activa                         |
| Wheel the World     | EUA         | Global                  | Comercial (comissoes)       | Mappers verificados, garantia de reembolso        |
| Handiscover         | Suecia      | 40+ paises europeus     | Comercial (comissoes)       | 3 niveis de mobilidade, apoio UE H2020            |
| Mobility Mojo       | Irlanda     | Global                  | SaaS B2B                    | Autoavaliacao guiada para empresas                |
| Access Earth        | Irlanda     | 110k locais             | Hibrido (app + B2B)         | IA + analise de satelite                          |
| accessibility.cloud | Alemanha    | Global (agregador)      | Dados abertos               | Hub de dados, formato A11yJSON                    |

**Plataformas generalistas com funcionalidades de acessibilidade (4):**

| Plataforma  | Funcionalidades de Acessibilidade                                             | Limitacoes                                    |
| ----------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| Google Maps | Melhor generalista: "Accessible Places", rotas acessiveis, 50M+ contribuicoes | Dados nao verificados, pouca granularidade    |
| Apple Maps  | VoiceOver, feedback haptil                                                    | Sem rotas acessiveis, sem mapeamento dedicado |
| TripAdvisor | Filtro "wheelchair", Accessible Travel Hub (2025)                             | Filtros insuficientes, informacao diluida     |
| Yelp        | 8 atributos de acessibilidade pesquisaveis                                    | Focado nos EUA, atributos limitados           |

### 2.2 Lacunas de Mercado Identificadas

1. **Fragmentacao de dados:** Cada plataforma mantem a sua propria base de dados isolada; nao existe fonte unica e fiavel
2. **Cobertura fraca em Portugal:** Nenhuma plataforma dedicada tem cobertura significativa do territorio portugues
3. **Verificacao inconsistente:** A maioria depende exclusivamente de crowdsourcing sem verificacao profissional
4. **Foco predominante em cadeiras de rodas manuais:** Cadeiras de rodas electricas (mais largas, mais pesadas, raio de viragem maior) sao sub-representadas
5. **Ausencia de personalizacao:** Nenhuma plataforma adapta a classificacao ao perfil especifico do utilizador (largura da cadeira, tolerancia a degraus, raio de viragem)
6. **Sem integracao de IA avancada:** Apenas a AccessNow utiliza IA, e limitada a resumos -- nenhuma plataforma usa IA para matching personalizado, analise de fotografias ou recomendacoes contextuais

### 2.3 Vantagens Competitivas do Eat Out Adviser

1. **Personalizacao real:** Classificacao adaptada ao perfil fisico especifico de cada utilizador
2. **IA integrada desde o inicio:** Pesquisa em linguagem natural, analise de fotografias, recomendacoes contextuais
3. **Foco geografico:** Cobertura profunda do Grande Porto (piloto) com expansao para Portugal
4. **Verificacao hibrida:** Dados da comunidade + verificacao estruturada + analise por IA
5. **Open source:** Transparencia, confianca e possibilidade de contribuicao da comunidade
6. **Dados estruturados por normas internacionais:** Baseado em ISO 21542, ADA Standards e A11yJSON
7. **Conformidade regulamentar:** Alinhado com o EAA e WCAG 2.1 AA/AAA

### 2.4 Oportunidade de Mercado

- **Turismo acessivel global:** 58 mil milhoes USD/ano
- **Populacao com deficiencia na UE:** 87 milhoes de pessoas (1 em 6)
- **Turismo em Portugal:** 24,6 mil milhoes EUR em receitas (2025), sector estrategico nacional
- **Regulamentacao:** EAA em vigor desde Junho 2025 cria pressao para restaurantes se adaptarem
- **Lacuna geografica:** Zero plataformas dedicadas com cobertura forte em Portugal

---

## 3. Personas de Utilizador

### 3.1 Persona Primaria: Joao (Utilizador de Cadeira de Rodas Electrica)

```plaintext
Nome:        Joao, 35 anos
Localizacao: Grande Porto, Portugal
Mobilidade:  Cadeira de rodas electrica (largura 68 cm, raio de viragem 150 cm)
Tecnologia:  Muito elevada (developer, usa smartphone e computador diariamente)
Contexto:    Come fora 3-4x por semana, sozinho ou com amigos/familia
```

**Objectivos:**

- Encontrar restaurantes onde tenha a certeza de que consegue entrar, sentar-se e usar a casa de banho
- Nao precisar de telefonar com antecedencia para confirmar acessibilidade
- Partilhar experiencias para ajudar outros utilizadores de cadeira de rodas
- Planear saidas com amigos sem que a acessibilidade seja um "problema" a resolver

**Frustracao:**

- "Ja perdi a conta ao numero de vezes que cheguei a um restaurante e tive de ir embora porque nao conseguia entrar."
- "O Google Maps diz que e 'acessivel a cadeiras de rodas' mas nao me diz se a porta tem 70 cm ou 90 cm de largura."
- "Quando saio com amigos, sinto que estou a limitar as opcoes de toda a gente."

**Cenarios de uso:**

- Sexta-feira, 18h: "Quero um restaurante italiano acessivel perto da Ribeira do Porto para jantar com 4 amigos"
- Domingo, 12h: "Onde posso almocar sozinho com mesa acessivel e boa internet?"
- Situacao nova: "Vou a Braga pela primeira vez -- quais sao os restaurantes acessiveis?"

**Requisitos criticos:**

- Largura da entrada >= 75 cm (cadeira + espaco lateral)
- Espaco entre mesas para passagem da cadeira
- Casa de banho com porta >= 85 cm e espaco de rotacao >= 150 cm
- Sem degrau na entrada ou rampa com inclinacao <= 8%
- Informacao sobre tipo de pavimento (paralelepipedo e problematico)

---

### 3.2 Persona Secundaria: Maria (Idosa com Andarilho)

```plaintext
Nome:        Maria, 72 anos
Localizacao: Matosinhos, Porto
Mobilidade:  Andarilho/andador; dificuldade com degraus e pavimentos irregulares
Tecnologia:  Basica (usa WhatsApp e pouco mais; precisa de interface simples)
Contexto:    Almoca fora ao domingo com a familia; vai a cafes com amigas
```

**Objectivos:**

- Encontrar restaurantes sem degraus na entrada (ou com rampa)
- Saber se ha casas de banho com barras de apoio
- Interface facil de usar com texto grande e poucos passos
- Receber sugestoes da filha ou do neto via partilha

**Frustracao:**

- "O meu neto mostra-me no telemovel mas eu nao sei usar aquelas coisas"
- "Precisava de saber se tem corrimao antes de ir la"
- "Nao quero dar trabalho a ninguem, so quero saber se consigo ir"

**Cenarios de uso:**

- "A filha envia-lhe um link com 3 opcoes de restaurantes acessiveis para o almoco de domingo"
- "No cafe, pergunta a uma amiga: consegues ver naquela app se aquele restaurante novo tem degraus?"

**Requisitos criticos:**

- Interface com opcao de texto grande e alto contraste
- Partilha facil por WhatsApp/SMS
- Informacao de semaforo visual (verde/amarelo/vermelho) sem necessidade de ler detalhes
- Compatibilidade com leitores de ecra

---

### 3.3 Persona Terciaria: Antonio (Dono de Restaurante)

```plaintext
Nome:        Antonio, 48 anos
Localizacao: Porto, Portugal
Negocio:     Restaurante de cozinha portuguesa tradicional, 60 lugares
Tecnologia:  Media (usa redes sociais para o restaurante, plataformas de reservas)
Motivacao:   Quer atrair mais clientes e cumprir regulamentacao
```

**Objectivos:**

- Mostrar que o restaurante fez investimento em acessibilidade
- Atrair o segmento de clientes com mobilidade reduzida (e os seus acompanhantes)
- Compreender o que pode melhorar para ser mais acessivel
- Cumprir os requisitos do EAA

**Frustracao:**

- "Fiz obras para ter uma rampa e uma casa de banho adaptada mas ninguem sabe"
- "Nao sei o que mais e preciso para ser considerado acessivel"
- "As plataformas de reservas nao perguntam sobre acessibilidade"

**Cenarios de uso:**

- Regista o restaurante na plataforma e preenche o formulario de acessibilidade
- Recebe um relatorio com sugestoes de melhoria priorizadas
- Publica o selo de acessibilidade no website e redes sociais do restaurante

**Requisitos criticos:**

- Formulario de autoavaliacao guiado e claro
- Relatorio de acessibilidade com recomendacoes praticas
- Badge/selo para usar em marketing
- Dashboard com metricas (visualizacoes, reservas via plataforma)

---

### 3.4 Persona Quaternaria: Sofia (Amiga/Familiar que Planeia Saida)

```plaintext
Nome:        Sofia, 30 anos
Localizacao: Porto, Portugal
Relacao:     Amiga do Joao; organiza jantares de grupo regularmente
Tecnologia:  Elevada (usa apps de delivery, reservas, redes sociais)
Contexto:    Organiza saidas para grupos de 4-8 pessoas, incluindo o Joao
```

**Objectivos:**

- Encontrar rapidamente um restaurante que funcione para todos, incluindo o Joao
- Nao ter de perguntar ao Joao "isto serve?" repetidamente
- Fazer reserva e confirmar acessibilidade num so passo
- Partilhar opcoes com o grupo para votacao

**Frustracao:**

- "Passo horas a procurar restaurantes e depois metade nao serve porque o Joao nao entra"
- "Sinto-me mal a perguntar-lhe sempre se consegue ir a certo sitio"
- "As apps de reserva nao me deixam filtrar por acessibilidade"

**Cenarios de uso:**

- "Preciso de um restaurante para 6 pessoas no sabado, que tenha comida japonesa e onde o Joao consiga entrar e usar a casa de banho"
- Filtra por acessibilidade para cadeira de rodas electrica, selecciona 3 opcoes, partilha no grupo de WhatsApp

**Requisitos criticos:**

- Filtro por perfil de acessibilidade de outra pessoa (do Joao)
- Reserva com indicacao de que ha uma pessoa em cadeira de rodas no grupo
- Partilha de opcoes com link descritivo (nao apenas um URL)
- Informacao clara e rapida sem necessidade de expertise em acessibilidade

---

### 3.5 Persona Quinaria: Carla (Auditora/Verificadora de Acessibilidade)

```plaintext
Nome:        Carla, 40 anos
Localizacao: Porto, Portugal
Profissao:   Terapeuta ocupacional; voluntaria em associacao de mobilidade reduzida
Tecnologia:  Media-alta
Contexto:    Avalia acessibilidade de espacos como voluntaria; quer contribuir com dados fiveis
```

**Objectivos:**

- Contribuir com avaliacoes profissionais e detalhadas de acessibilidade
- Validar ou corrigir dados submetidos por restaurantes ou utilizadores
- Ajudar a comunidade a ter informacao fiavel
- Utilizar um sistema de avaliacao baseado em normas internacionais

**Frustracao:**

- "Muitas plataformas permitem que qualquer pessoa diga que um local e acessivel, sem qualquer verificacao"
- "Nao ha um padrao consistente para avaliar acessibilidade em Portugal"
- "O meu trabalho de avaliacao nao e reconhecido nem tem impacto visivel"

**Cenarios de uso:**

- Visita um restaurante, usa a app para fazer uma avaliacao detalhada com fotografias e medicoes
- Valida uma avaliacao submetida por um restaurante, confirmando ou corrigindo dados
- Recebe notificacoes de novos restaurantes na sua area que precisam de verificacao

**Requisitos criticos:**

- Formulario de avaliacao detalhado baseado em normas (ISO 21542, ADA)
- Possibilidade de tirar e anotar fotografias durante a avaliacao
- Campos para medicoes precisas (largura de porta em cm, inclinacao de rampa)
- Distincao clara entre dados verificados e nao verificados
- Reconhecimento como verificador certificado na plataforma

---

## 4. Requisitos Funcionais

### 4.1 Fase 1 -- MVP (Minimo Produto Viavel)

#### RF-01: Registo e Perfil de Utilizador

**Descricao:** O utilizador pode criar conta e definir o seu perfil de acessibilidade detalhado.

**Campos do perfil de acessibilidade:**

| Campo                            | Tipo           | Exemplo                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------ |
| Tipo de mobilidade               | Seleccao       | Cadeira de rodas electrica, manual, andarilho, bengala, muletas, nenhum auxiliar     |
| Largura da cadeira/auxiliar      | Numerico (cm)  | 68 cm                                                                                |
| Raio de viragem necessario       | Numerico (cm)  | 150 cm                                                                               |
| Tolerancia a degraus             | Seleccao       | 0 degraus, 1 degrau (< 5 cm), 2-3 degraus com ajuda                                  |
| Tolerancia a inclinacao de rampa | Seleccao       | <= 6%, <= 8%, <= 10%, qualquer                                                       |
| Necessidades na casa de banho    | Multi-seleccao | Barras de apoio, espaco de rotacao, altura de sanita adaptada, transferencia lateral |
| Necessidades visuais             | Multi-seleccao | Alto contraste, texto grande, leitor de ecra                                         |
| Necessidades auditivas           | Multi-seleccao | Bucle de inducao, linguagem gestual                                                  |
| Restricoes alimentares           | Multi-seleccao | Sem gluten, vegetariano, alergias especificas                                        |
| Raio de pesquisa preferido       | Numerico (km)  | 5 km                                                                                 |
| Lingua preferida                 | Seleccao       | PT, EN, ES, FR                                                                       |

**Autenticacao:**

- Registo com email/password
- OAuth com Google e Apple
- Autenticacao de dois factores (opcional)

**Criterios de aceitacao:**

- O utilizador consegue registar-se em menos de 2 minutos
- O perfil de acessibilidade pode ser preenchido de forma progressiva (nao obrigatorio no registo)
- O perfil pode ser editado a qualquer momento
- Os dados de acessibilidade sao usados automaticamente para filtrar resultados de pesquisa

---

#### RF-02: Perfis de Restaurante

**Descricao:** Cada restaurante tem um perfil publico com informacao basica e de acessibilidade.

**Informacao basica:**

| Campo                    | Tipo                   | Obrigatorio    |
| ------------------------ | ---------------------- | -------------- |
| Nome                     | Texto                  | Sim            |
| Morada                   | Texto + geocodificacao | Sim            |
| Coordenadas GPS          | Lat/Long               | Sim (auto)     |
| Telefone                 | Texto                  | Sim            |
| Email                    | Texto                  | Nao            |
| Website                  | URL                    | Nao            |
| Horario de funcionamento | Estruturado (por dia)  | Sim            |
| Tipo de cozinha          | Multi-seleccao         | Sim            |
| Gama de precos           | Seleccao (1-4)         | Sim            |
| Fotografias              | Imagens                | Sim (minimo 3) |
| Descricao                | Texto                  | Nao            |
| Capacidade total         | Numerico               | Nao            |

**Criterios de aceitacao:**

- Qualquer utilizador registado pode sugerir a adicao de um restaurante
- O restaurante pode ser criado a partir de dados minimos (nome + morada) e enriquecido progressivamente
- Fotografias sao armazenadas com compressao automatica e alt text

---

#### RF-03: Dados de Acessibilidade Estruturados

**Descricao:** Cada restaurante tem um perfil de acessibilidade detalhado baseado em normas internacionais.

**Categorias de dados:**

**A. Entrada e Acesso Exterior:**

| Campo                                       | Tipo                                     | Norma de Referencia |
| ------------------------------------------- | ---------------------------------------- | ------------------- |
| Entrada acessivel (sem degrau ou com rampa) | Sim/Nao/Parcial                          | ISO 21542           |
| Largura da porta de entrada (cm)            | Numerico                                 | ADA: >= 81 cm       |
| Numero de degraus na entrada                | Numerico                                 | ISO 21542           |
| Altura do degrau mais alto (cm)             | Numerico                                 | ISO 21542           |
| Rampa disponivel                            | Sim/Nao                                  | ISO 21542           |
| Inclinacao da rampa (%)                     | Numerico                                 | ADA: <= 8,33%       |
| Corrimao na rampa                           | Sim/Nao                                  | ISO 21542           |
| Tipo de porta                               | Seleccao (automatica, manual, giratoria) | --                  |
| Campainha/intercomunicador acessivel        | Sim/Nao                                  | --                  |
| Tipo de pavimento exterior                  | Seleccao                                 | --                  |
| Iluminacao da entrada                       | Seleccao (boa, media, fraca)             | --                  |

**B. Estacionamento:**

| Campo                             | Tipo     | Norma de Referencia |
| --------------------------------- | -------- | ------------------- |
| Lugar de estacionamento acessivel | Sim/Nao  | ADA                 |
| Distancia ate a entrada (m)       | Numerico | ADA: proximo        |
| Largura do lugar (cm)             | Numerico | ADA: >= 244 cm      |
| Corredor adjacente (cm)           | Numerico | ADA: >= 152 cm      |
| Sinalizacao adequada              | Sim/Nao  | ADA                 |
| Tipo de pavimento                 | Seleccao | --                  |

**C. Interior e Circulacao:**

| Campo                                    | Tipo                                    | Norma de Referencia |
| ---------------------------------------- | --------------------------------------- | ------------------- |
| Largura dos corredores (cm)              | Numerico                                | ISO 21542           |
| Espaco entre mesas para cadeira de rodas | Sim/Nao                                 | --                  |
| Mesas com altura acessivel               | Sim/Nao/Algumas                         | --                  |
| Altura das mesas (cm)                    | Numerico                                | ADA: 71-86 cm       |
| Espaco para joelhos sob a mesa (cm)      | Numerico                                | ADA: >= 68 cm       |
| Piso unico (sem degraus interiores)      | Sim/Nao                                 | --                  |
| Elevador (se multiplos pisos)            | Sim/Nao                                 | ISO 21542           |
| Dimensoes do elevador (cm)               | Numerico                                | ISO 21542           |
| Tipo de pavimento interior               | Seleccao (antiderrapante, tapete, etc.) | --                  |
| Espaco de manobra para cadeira (cm)      | Numerico                                | ISO 21542           |
| Balcao acessivel                         | Sim/Nao                                 | ADA                 |

**D. Casa de Banho:**

| Campo                                    | Tipo                                  | Norma de Referencia |
| ---------------------------------------- | ------------------------------------- | ------------------- |
| Casa de banho acessivel existente        | Sim/Nao                               | ISO 21542           |
| Largura da porta da casa de banho (cm)   | Numerico                              | ADA: >= 81 cm       |
| Espaco de rotacao interior (cm)          | Numerico                              | ADA: >= 152 cm      |
| Barras de apoio                          | Sim/Nao                               | ISO 21542           |
| Altura do assento da sanita (cm)         | Numerico                              | ADA: 43-48 cm       |
| Altura do lavatorio (cm)                 | Numerico                              | ADA: <= 86 cm       |
| Espaco para joelhos sob lavatorio        | Sim/Nao                               | ADA                 |
| Tipo de torneira                         | Seleccao (alavanca, sensor, rotativa) | --                  |
| Espelho inclinavel ou a altura acessivel | Sim/Nao                               | ADA                 |
| Dispensadores a altura acessivel         | Sim/Nao                               | ADA: <= 122 cm      |
| Alarme de emergencia                     | Sim/Nao                               | ISO 21542           |

**E. Comunicacao e Menu:**

| Campo                                  | Tipo    |
| -------------------------------------- | ------- |
| Menu em formato digital (QR code)      | Sim/Nao |
| Menu em letra grande                   | Sim/Nao |
| Menu em braille                        | Sim/Nao |
| Menu com fotografias                   | Sim/Nao |
| Pessoal com formacao em acessibilidade | Sim/Nao |
| Sinalizacao com alto contraste         | Sim/Nao |
| Bucle de inducao magnetica             | Sim/Nao |

**Regras de negocio:**

- Dados podem ser submetidos pelo restaurante (autoavaliacao), por utilizadores (crowdsourcing) ou por verificadores
- Cada dado tem um estado: nao verificado, verificado pela comunidade, verificado por auditor
- Dados verificados tem prioridade sobre dados nao verificados
- Dados com mais de 12 meses sem actualizacao sao sinalizados como "possivelmente desactualizados"

---

#### RF-04: Pesquisa e Matching com IA

**Descricao:** O utilizador pode pesquisar restaurantes usando linguagem natural ou filtros estruturados. A IA personaliza os resultados com base no perfil de acessibilidade do utilizador.

**Tipos de pesquisa:**

1. **Linguagem natural:** "Restaurante italiano acessivel perto da Ribeira do Porto para 4 pessoas"
2. **Filtros estruturados:** Tipo de cozinha + localizacao + gama de precos + filtros de acessibilidade
3. **Pesquisa por mapa:** Explorar restaurantes numa area geografica com marcadores de acessibilidade

**Comportamento da pesquisa:**

- Resultados sao automaticamente filtrados e ordenados pelo perfil de acessibilidade do utilizador
- Cada resultado mostra: pontuacao de acessibilidade personalizada, distancia, tipo de cozinha, gama de precos
- Sistema de semaforo visual (verde/amarelo/vermelho) para indicacao rapida
- Resultados incluem avisos especificos: "A porta de entrada tem 72 cm, a sua cadeira tem 68 cm -- passagem apertada"

**Criterios de aceitacao:**

- Pesquisa por linguagem natural retorna resultados relevantes em menos de 3 segundos
- Filtros estruturados retornam resultados em menos de 1 segundo
- Resultados incluem sempre a pontuacao de acessibilidade personalizada
- Pesquisa funciona offline com dados previamente carregados (resultados limitados)

---

#### RF-05: Sistema de Avaliacoes e Classificacoes

**Descricao:** Os utilizadores podem avaliar restaurantes em duas dimensoes independentes: acessibilidade e experiencia gastronomica.

**Avaliacao de acessibilidade:**

- Pontuacao global (1-5 estrelas)
- Pontuacao por categoria: Entrada, Interior, Casa de Banho, Comunicacao
- Comentario textual focado em acessibilidade
- Fotografias com anotacoes opcionais (ex: "porta de entrada", "rampa", "casa de banho")
- Tipo de mobilidade do avaliador (para contextualizacao)

**Avaliacao gastronomica:**

- Pontuacao global (1-5 estrelas)
- Comentario textual sobre comida, servico, ambiente
- Fotografias de pratos

**Regras de negocio:**

- As duas avaliacoes sao independentes e apresentadas separadamente
- Avaliacoes de acessibilidade por utilizadores com perfil de mobilidade reduzida tem peso superior
- Avaliacoes podem ser sinalizadas como uteis ou incorrectas
- O restaurante pode responder a avaliacoes

---

#### RF-06: Visualizacao em Mapa

**Descricao:** Mapa interactivo com marcadores de restaurantes coloridos pelo nivel de acessibilidade.

**Funcionalidades:**

- Marcadores com sistema de semaforo (verde/amarelo/vermelho/cinzento)
- Filtragem por tipo de cozinha, gama de precos e nivel de acessibilidade
- Cluster de marcadores em zoom afastado
- Geolocalizacao do utilizador para pesquisa por proximidade
- Rota ate ao restaurante (link para Google Maps/Apple Maps com opcao de rota acessivel)

**Criterios de aceitacao:**

- Mapa carrega em menos de 2 segundos
- Marcadores reflectem a pontuacao personalizada para o perfil do utilizador
- Funciona em dispositivos moveis com interaccao touch

---

#### RF-07: Integracao Basica de Reservas

**Descricao:** O utilizador pode iniciar uma reserva atraves da plataforma.

**Funcionalidades MVP:**

- Formulario de reserva simples (data, hora, numero de pessoas)
- Campo para indicar necessidades de acessibilidade (pre-preenchido do perfil)
- Envio do pedido de reserva por email ao restaurante
- Confirmacao manual pelo restaurante
- Historico de reservas do utilizador

**Evolucao futura (Fase 2+):**

- Integracao com sistemas de reserva existentes (TheFork/Zomato)
- Confirmacao automatica em tempo real
- Gestao de disponibilidade pelo restaurante

---

#### RF-08: Multilingue

**Descricao:** A aplicacao suporta multiplos idiomas desde o lancamento.

**Idiomas MVP:**

- Portugues de Portugal (pt-PT) -- idioma principal
- Ingles (en) -- idioma secundario

**Comportamento:**

- Deteccao automatica do idioma do browser
- Seleccao manual de idioma
- Conteudo da interface totalmente traduzido
- Conteudo gerado por utilizadores (avaliacoes, descricoes) no idioma original com opcao de traducao por IA
- URLs com prefixo de idioma (`/pt/`, `/en/`)

---

### 4.2 Fase 2 -- Pos-MVP

#### RF-09: Analise de Fotografias por IA (Claude Vision)

**Descricao:** A IA analisa fotografias submetidas para extrair informacao de acessibilidade automaticamente.

**Capacidades:**

- Detectar presenca ou ausencia de rampa na entrada
- Estimar largura de porta a partir de fotografia (com margem de erro indicada)
- Identificar degraus e estimar altura
- Avaliar espaco entre mesas
- Identificar elementos de acessibilidade na casa de banho (barras de apoio, espaco)
- Ler sinalizacao de acessibilidade
- Avaliar tipo e condicao de pavimento

**Comportamento:**

- Analise e sugerida ao utilizador como "estimativa por IA" com pedido de confirmacao
- Resultados da analise sao marcados como "dados estimados por IA" ate confirmacao humana
- Nivel de confianca apresentado para cada estimativa

---

#### RF-10: Sistema de Verificacao Comunitaria

**Descricao:** Mecanismo de verificacao em multiplas camadas para garantir fiabilidade dos dados.

**Niveis de verificacao:**

```plaintext
Nivel 0: Nao verificado
  |-- Dado submetido pelo restaurante (autoavaliacao) ou por IA
  v
Nivel 1: Verificado pela comunidade
  |-- 3+ utilizadores com perfil de mobilidade reduzida confirmaram o dado
  v
Nivel 2: Verificado por auditor
  |-- Auditor certificado avaliou presencialmente com fotografias e medicoes
```

**Regras:**

- Dados de Nivel 2 substituem dados de Nivel 0 e 1
- Dados de Nivel 1 substituem dados de Nivel 0
- Conflitos entre dados do mesmo nivel sao resolvidos por votacao (maioria)
- Dados podem ser contestados por qualquer utilizador com justificacao

---

#### RF-11: Portal de Self-Service para Restaurantes

**Descricao:** Dashboard dedicado para restaurantes gerirem a sua presenca na plataforma.

**Funcionalidades:**

- Gestao do perfil do restaurante (informacao basica + fotografias)
- Preenchimento guiado do formulario de acessibilidade
- Visualizacao da pontuacao de acessibilidade e relatorio de melhorias
- Gestao de reservas recebidas via plataforma
- Resposta a avaliacoes
- Metricas: visualizacoes do perfil, pesquisas em que apareceu, reservas
- Pedido de verificacao por auditor

---

#### RF-12: Recomendacoes Avancadas com IA

**Descricao:** Sistema de recomendacao que aprende com o historico e preferencias do utilizador.

**Funcionalidades:**

- "Restaurantes que outros utilizadores com perfil semelhante ao seu gostaram"
- "Novos restaurantes acessiveis na sua area"
- "Baseado nas suas ultimas visitas, pode gostar de..."
- Recomendacoes contextuais (hora do dia, dia da semana, meteorologia)

---

#### RF-13: Importacao de Dados OpenStreetMap/Wheelmap

**Descricao:** Importacao de dados de acessibilidade existentes no OpenStreetMap e Wheelmap/accessibility.cloud.

**Funcionalidades:**

- Importacao inicial de restaurantes com dados de acessibilidade do OSM na area do Grande Porto
- Mapeamento de dados A11yJSON para o modelo de dados do Eat Out Adviser
- Importacao periodica (semanal) de actualizacoes
- Dados importados sao marcados como "origem: OpenStreetMap" com nivel de verificacao 0
- Exportacao de dados verificados de volta para o OSM (contribuicao para a comunidade)

---

#### RF-14: Notificacoes Push

**Descricao:** Notificacoes relevantes e nao intrusivas.

**Tipos de notificacao:**

- Novo restaurante acessivel na area do utilizador
- Actualizacao de acessibilidade num restaurante favorito
- Confirmacao/alteracao de reserva
- Resposta do restaurante a uma avaliacao
- Pedido de verificacao de dados (para utilizadores activos)

---

### 4.3 Fase 3 -- Expansao e Comercializacao

#### RF-15: Extensibilidade a Outros Tipos de Espacos

**Descricao:** Arquitectura extensivel para suportar hoteis, museus e espacos de actividades.

**Principio:** O modelo de dados de acessibilidade e generico, com extensoes especificas por tipo de espaco.

---

#### RF-16: Funcionalidades Comerciais para Restaurantes

**Descricao:** Funcionalidades premium pagas para restaurantes.

**Funcionalidades:**

- Perfil destacado nos resultados de pesquisa
- Relatorio detalhado de acessibilidade com recomendacoes de melhoria
- Selo de acessibilidade verificada para uso em marketing
- Estatisticas avancadas (demographics dos visitantes, comparacao com concorrentes)
- Integracao com sistema de reservas do restaurante

---

#### RF-17: Sistema de Certificacao de Acessibilidade

**Descricao:** Programa formal de certificacao de acessibilidade para restaurantes.

**Niveis de certificacao:**

- Bronze: Entrada acessivel + informacao basica completa
- Prata: Bronze + casa de banho acessivel + menu acessivel
- Ouro: Prata + verificacao por auditor + formacao do pessoal

---

#### RF-18: API Publica

**Descricao:** API RESTful publica para integracao por terceiros.

**Casos de uso:**

- Guias turisticos que queiram incluir informacao de acessibilidade
- Plataformas de reserva que queiram filtrar por acessibilidade
- Aplicacoes de navegacao que queiram mostrar destinos acessiveis
- Municipios que queiram monitorizar acessibilidade na sua area

---

## 5. Requisitos Nao-Funcionais

### 5.1 Performance

| Metrica                             | Objectivo      | Metodo de Medicao      |
| ----------------------------------- | -------------- | ---------------------- |
| Tempo de carregamento inicial (LCP) | < 2,5 segundos | Lighthouse, Web Vitals |
| Interactividade (INP)               | < 200 ms       | Web Vitals             |
| Deslocamento de layout (CLS)        | < 0,1          | Web Vitals             |
| Resposta de pesquisa por filtros    | < 1 segundo    | Metricas do servidor   |
| Resposta de pesquisa por IA         | < 3 segundos   | Metricas do servidor   |
| Carregamento do mapa                | < 2 segundos   | Metricas do cliente    |
| Tempo de resposta da API (p95)      | < 500 ms       | Metricas do servidor   |
| Disponibilidade                     | >= 99,5%       | Uptime Kuma            |

### 5.2 Acessibilidade Digital

**Nivel minimo:** WCAG 2.1 AA **Nivel objectivo:** WCAG 2.2 AAA (progressivo)

**Requisitos especificos:**

| Requisito                                                        | Norma             | Prioridade |
| ---------------------------------------------------------------- | ----------------- | ---------- |
| Navegacao completa por teclado                                   | WCAG 2.1.1        | Critica    |
| Compatibilidade com leitores de ecra (NVDA, VoiceOver, JAWS)     | WCAG 4.1.2        | Critica    |
| Contraste de cor minimo 4,5:1 (texto) e 3:1 (elementos graficos) | WCAG 1.4.3/1.4.11 | Critica    |
| Texto redimensionavel ate 200% sem perda de conteudo             | WCAG 1.4.4        | Alta       |
| Alternativas textuais para todas as imagens                      | WCAG 1.1.1        | Critica    |
| Touch targets minimos de 44x44px                                 | WCAG 2.5.5        | Alta       |
| Modo de alto contraste                                           | WCAG 1.4.6        | Alta       |
| Sem conteudo que pisca mais de 3x por segundo                    | WCAG 2.3.1        | Critica    |
| Linguagem simples e clara                                        | WCAG 3.1.5        | Media      |
| Prevencao de erros em formularios                                | WCAG 3.3.4        | Alta       |
| Skip navigation links                                            | WCAG 2.4.1        | Alta       |
| Focus visible em todos os elementos interactivos                 | WCAG 2.4.7        | Critica    |
| Titulos de pagina descritivos                                    | WCAG 2.4.2        | Alta       |
| Ordem de leitura logica                                          | WCAG 1.3.2        | Alta       |

**Testes de acessibilidade:**

- axe-core integrado em testes E2E (Playwright) executados em cada CI/CD
- Testes manuais com leitores de ecra (trimestral)
- Testes com utilizadores reais com mobilidade reduzida (antes de cada release major)
- Auditoria de acessibilidade WCAG completa (semestral)

### 5.3 Seguranca e Privacidade (RGPD)

**Principios:**

- Dados pessoais minimos: recolher apenas o estritamente necessario
- Consentimento explicito para dados de acessibilidade (dados de saude, categoria especial RGPD)
- Encriptacao de dados em transito (TLS 1.3) e em repouso (AES-256)
- Hashing de passwords com Argon2id
- Sessoes com token JWT + refresh token
- Rate limiting em todos os endpoints

**Direitos do utilizador (RGPD):**

- Direito de acesso: exportar todos os dados pessoais em JSON
- Direito de rectificacao: editar qualquer dado pessoal
- Direito ao apagamento: eliminar conta e todos os dados associados
- Direito a portabilidade: exportar dados em formato standard
- Direito de oposicao: opt-out de recomendacoes por IA

**Dados senssiveis:**

- Dados de acessibilidade (tipo de deficiencia, dimensoes de cadeira de rodas) sao dados de saude sob o RGPD
- Requerem consentimento explicito e informado
- Armazenados com encriptacao adicional
- Acesso restrito e auditado
- Nao sao partilhados com terceiros sem consentimento

**Seguranca da aplicacao:**

- OWASP Top 10 como referencia
- Content Security Policy (CSP) rigorosa
- Proteccao contra CSRF, XSS, SQL Injection
- Auditoria de dependencias (npm audit, Snyk)
- Logs de seguranca para acessos e alteracoes a dados sensiveis

### 5.4 Escalabilidade

**Fase 1 (MVP):** Optimizado para ate 1.000 utilizadores concorrentes e 5.000 restaurantes

**Limites do hardware de producao (Intel N5105 16GB):**

- PostgreSQL: confortavel ate 500k registos com pgvector
- Next.js: 200-500 pedidos/segundo (dependendo da complexidade)
- Ollama (embeddings): processamento sequencial, 50-100 embeddings/minuto

**Estrategia de escalabilidade:**

- Arquitectura stateless (Next.js) permite escalar horizontalmente
- Cache agressivo (ISR, Redis/Valkey se necessario)
- CDN para assets estaticos (Cloudflare free tier)
- Migrar para VPS cloud (Hetzner ARM64) quando o N5105 atingir limites
- Migrar embeddings para API cloud quando volume justificar

### 5.5 Capacidade Offline (PWA)

**Funcionalidades offline:**

- Consultar restaurantes previamente visualizados (cache)
- Consultar favoritos e perfil pessoal
- Visualizar mapa com dados em cache
- Iniciar escrita de avaliacao (sincronizada quando online)
- Consultar informacao de acessibilidade de restaurantes em cache

**Funcionalidades que requerem conectividade:**

- Pesquisa por IA
- Reservas
- Submissao de avaliacoes
- Carregamento de novos dados
- Sincronizacao de perfil

### 5.6 Internacionalizacao (i18n)

- Framework: next-intl ou next-international
- Chaves de traducao em ficheiros JSON por idioma
- Suporte a pluralizacao e formatacao regional (datas, moeda, numeros)
- Direccionalidade LTR (futuro: RTL para arabe)
- URLs com prefixo de locale (`/pt/restaurantes`, `/en/restaurants`)
- Conteudo gerado por utilizadores mantido no idioma original, com opcao de traducao por IA

### 5.7 Restricoes de Hardware

**Ambiente de desenvolvimento (MacBook Air M1 16GB):**

| Componente                     | Consumo Estimado |
| ------------------------------ | ---------------- |
| Next.js dev server (Turbopack) | 1-2 GB RAM       |
| PostgreSQL local               | 256 MB RAM       |
| Docker Desktop                 | 2-4 GB RAM       |
| Ollama (embeddings)            | 2-4 GB RAM       |
| **Total**                      | **~8-10 GB RAM** |

**Ambiente de producao (Proxmox Intel N5105 16GB):**

| Componente                         | Consumo Estimado  |
| ---------------------------------- | ----------------- |
| VM Debian 12 (base)                | 512 MB RAM        |
| PostgreSQL 17 + pgvector           | 1-2 GB RAM        |
| Next.js (Node.js producao)         | 512 MB - 1 GB RAM |
| Ollama (embedding, modelo pequeno) | 2-4 GB RAM        |
| Coolify + Traefik                  | 512 MB RAM        |
| **Total**                          | **~5-8 GB RAM**   |

**Conclusao:** Ambos os ambientes suportam confortavelmente a stack escolhida. O N5105 e o bottleneck e sera monitorizado; migracao para cloud e um plano de contingencia documentado.

---

## 6. Sistema de Classificacao de Acessibilidade

### 6.1 Arquitectura da Pontuacao

O sistema de classificacao combina uma pontuacao global numerica (0-100) com um sistema de semaforo visual e uma pontuacao personalizada por utilizador.

```plaintext
+------------------------------------------------------------------+
|                    PONTUACAO DO RESTAURANTE                       |
+------------------------------------------------------------------+
|                                                                  |
|  Pontuacao Global: 74/100       Semaforo: AMARELO                |
|                                                                  |
|  +------------------+  +------------------+  +----------------+  |
|  | Entrada: 85/100  |  | Interior: 70/100 |  | WC: 65/100    |  |
|  | [VERDE]          |  | [AMARELO]        |  | [AMARELO]     |  |
|  +------------------+  +------------------+  +----------------+  |
|  +------------------+  +------------------+  +----------------+  |
|  | Estacion.: 90/100|  | Comunic.: 60/100 |  | Menu: 80/100  |  |
|  | [VERDE]          |  | [AMARELO]        |  | [VERDE]       |  |
|  +------------------+  +------------------+  +----------------+  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  PARA O SEU PERFIL (cadeira electrica, 68 cm):                   |
|  Pontuacao Personalizada: 62/100  [AMARELO]                      |
|                                                                  |
|  ! Atencao: porta da entrada tem 72 cm (sua cadeira: 68 cm)     |
|  ! Atencao: casa de banho sem espaco de rotacao para 150 cm     |
|  OK: Rampa com inclinacao de 7% (seu limite: 8%)                 |
|  OK: Mesas com espaco para cadeira de rodas                      |
|                                                                  |
+------------------------------------------------------------------+
```

### 6.2 Categorias e Pesos

As categorias tem pesos diferenciados, reflectindo a importancia relativa para utilizadores de mobilidade reduzida.

| Categoria             | Peso Base | Justificacao                                    |
| --------------------- | --------- | ----------------------------------------------- |
| Entrada e Acesso      | 30%       | Sem entrada acessivel, o resto e irrelevante    |
| Interior e Circulacao | 20%       | Espaco para se movimentar dentro do restaurante |
| Casa de Banho         | 20%       | Necessidade basica frequentemente esquecida     |
| Estacionamento        | 10%       | Importante mas nem todos conduzem               |
| Comunicacao           | 10%       | Sinalizacao, formacao do pessoal                |
| Menu                  | 10%       | Formato acessivel do menu                       |

**Peso dinamico por perfil:** Os pesos sao ajustados com base no perfil do utilizador. Exemplos:

- Utilizador em cadeira de rodas electrica: Entrada sobe para 35%, Casa de Banho sobe para 25%, Estacionamento desce para 5%
- Utilizador idoso com andarilho: Entrada 25%, Interior 25%, Casa de Banho 20%, Estacionamento 15%
- Utilizador com deficiencia visual: Comunicacao sobe para 30%, Menu sobe para 25%

### 6.3 Calculo da Pontuacao por Categoria

Cada categoria e composta por sub-criterios com pontuacoes individuais.

#### Exemplo: Categoria "Entrada e Acesso" (peso base 30%)

| Sub-criterio               | Pontuacao   | Logica                                          |
| -------------------------- | ----------- | ----------------------------------------------- |
| Sem degrau na entrada      | 30 pts      | Sim=30, Nao=0                                   |
| Largura da porta >= 90 cm  | 25 pts      | >=90=25, 81-89=15, 75-80=5, <75=0               |
| Rampa (se degraus)         | 20 pts      | Sim com <=8%=20, Sim com >8%=10, Nao=0          |
| Porta automatica ou facil  | 10 pts      | Automatica=10, Manual leve=7, Manual pesada=2   |
| Pavimento exterior regular | 10 pts      | Regular=10, Irregular suave=5, Paralelepipedo=2 |
| Iluminacao adequada        | 5 pts       | Boa=5, Media=3, Fraca=0                         |
| **Total possivel**         | **100 pts** |                                                 |

### 6.4 Sistema de Semaforo

| Cor      | Pontuacao | Significado                                                     |
| -------- | --------- | --------------------------------------------------------------- |
| Verde    | 75-100    | Acessivel -- poucas ou nenhumas barreiras significativas        |
| Amarelo  | 40-74     | Parcialmente acessivel -- algumas barreiras, verificar detalhes |
| Vermelho | 0-39      | Barreiras significativas -- provavel dificuldade de acesso      |
| Cinzento | --        | Sem dados suficientes para classificar                          |

### 6.5 Pontuacao Personalizada

A pontuacao personalizada e o diferenciador principal do Eat Out Adviser. Para cada utilizador, a pontuacao e recalculada com base no seu perfil especifico.

**Algoritmo simplificado:**

```plaintext
Para cada restaurante R e utilizador U:

1. Verificar eliminatorios:
   - Se largura_porta_entrada < largura_cadeira_U + 4 cm:
       aviso_critico("porta demasiado estreita")
   - Se degraus > 0 AND sem_rampa AND tolerancia_degraus_U = 0:
       aviso_critico("sem acesso sem degraus")

2. Calcular pontuacao por categoria com pesos ajustados ao perfil U

3. Aplicar penalizacoes especificas:
   - Se espaco_rotacao_wc < raio_viragem_U: penalizar WC em 50%
   - Se inclinacao_rampa > tolerancia_rampa_U: penalizar Entrada em 30%

4. Gerar lista de avisos especificos para o utilizador

5. Pontuacao_personalizada = sum(pontuacao_categoria * peso_ajustado)
```

### 6.6 Verificacao e Fiabilidade

Cada dado de acessibilidade tem um indicador de fiabilidade que afecta a pontuacao:

| Fonte                                                    | Multiplicador de Confianca  |
| -------------------------------------------------------- | --------------------------- |
| Verificado por auditor (Nivel 2)                         | 1,0                         |
| Verificado pela comunidade -- 5+ confirmacoes (Nivel 1+) | 0,9                         |
| Verificado pela comunidade -- 3-4 confirmacoes (Nivel 1) | 0,8                         |
| Autoavaliacao pelo restaurante (Nivel 0)                 | 0,6                         |
| Estimativa por IA (Nivel 0)                              | 0,5                         |
| Dado com mais de 12 meses                                | Multiplicador actual \* 0,8 |

A pontuacao final e: `Pontuacao_raw * Multiplicador_confianca_medio`

### 6.7 Apresentacao ao Utilizador

**Vista resumida (lista de resultados):**

- Nome do restaurante
- Semaforo (verde/amarelo/vermelho)
- Pontuacao personalizada (ex: "72/100 para si")
- 1-2 avisos criticos se existirem
- Distancia

**Vista detalhada (pagina do restaurante):**

- Pontuacao global e personalizada
- Semaforo por categoria
- Lista completa de dados de acessibilidade com estado de verificacao
- Avisos especificos para o perfil do utilizador
- Fotografias com anotacoes de acessibilidade
- Avaliacoes de outros utilizadores de mobilidade reduzida

---

## 7. Funcionalidades de IA

### 7.1 Pesquisa em Linguagem Natural

**Descricao:** O utilizador pode pesquisar restaurantes usando frases naturais em portugues ou ingles. A IA interpreta a intencao, extrai filtros implicitos e combina com o perfil de acessibilidade do utilizador.

**Exemplos:**

| Pesquisa do Utilizador                                                 | Interpretacao pela IA                                                                   |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| "Restaurante italiano acessivel no centro do Porto"                    | Cozinha: italiana; Zona: centro Porto; Filtro: acessivel ao perfil do utilizador        |
| "Sitio para almocar sozinho com boa internet"                          | Refeicao: almoco; Grupo: 1 pessoa; Requisito: wifi; Filtro: acessivel                   |
| "Jantar romantico para dois, sem degraus"                              | Ambiente: romantico; Grupo: 2; Requisito: zero degraus; Refeicao: jantar                |
| "Melhor restaurante de peixe perto de mim com casa de banho acessivel" | Cozinha: peixe; Localizacao: proxima; Requisito: WC acessivel; Ordenacao: classificacao |

**Implementacao tecnica:**

- Pipeline RAG: query do utilizador -> embedding -> busca vectorial em pgvector -> contexto enriquecido com dados estruturados -> Claude API -> resposta natural
- Busca hibrida: semantica (pgvector) + lexica (tsvector/tsquery do PostgreSQL)
- Re-ranking com Claude dos top-20 resultados com base no contexto conversacional

### 7.2 Analise de Fotografias (Claude Vision)

**Descricao:** A IA analisa fotografias submetidas por utilizadores ou restaurantes para extrair dados de acessibilidade automaticamente.

**Capacidades de analise:**

| Elemento      | O que a IA detecta                                   | Nivel de Confianca Esperado |
| ------------- | ---------------------------------------------------- | --------------------------- |
| Entrada       | Presenca de degraus, rampa, tipo de porta            | Alto                        |
| Porta         | Estimativa de largura (com referencia visual)        | Medio                       |
| Interior      | Espaco entre mesas, tipo de pavimento                | Medio                       |
| Casa de banho | Barras de apoio, espaco visivel, altura de elementos | Medio                       |
| Sinalizacao   | Simbolos de acessibilidade, contraste                | Alto                        |
| Pavimento     | Tipo (liso, paralelepipedo, tapete)                  | Alto                        |

**Fluxo de analise:**

```plaintext
Utilizador submete fotografia(s)
         |
         v
Claude Vision analisa cada fotografia
         |
         v
Extraccao de dados estruturados com nivel de confianca
         |
         v
Sugestao ao utilizador: "Detectamos: rampa na entrada (confianca: 85%),
  espaco entre mesas adequado (confianca: 70%).
  Confirma estes dados?"
         |
         v
Utilizador confirma/corrige -> dados guardados como
"verificado por IA + confirmacao humana"
```

### 7.3 Sumarizacao de Avaliacoes

**Descricao:** A IA gera resumos automaticos das avaliacoes de um restaurante, separando aspectos de acessibilidade e aspectos gastronomicos.

**Exemplo de resumo gerado:**

> **Acessibilidade (baseado em 12 avaliacoes):** A maioria dos utilizadores de cadeira de rodas reporta boa experiencia. A entrada tem rampa suave e porta larga. O interior tem espaco suficiente entre mesas. Ponto negativo: a casa de banho acessivel fica no piso -1 e o elevador e pequeno.
>
> **Experiencia gastronomica (baseado em 47 avaliacoes):** Elogiada a qualidade do peixe fresco e o servico atencioso. Preco considerado justo para a qualidade. Tempo de espera pode ser longo ao fim-de-semana.

### 7.4 Recomendacoes Personalizadas

**Descricao:** Sistema de recomendacao que combina perfil de acessibilidade, historico de visitas, preferencias gastronomicas e contexto temporal.

**Sinais utilizados:**

- Perfil de acessibilidade do utilizador
- Restaurantes previamente visitados e avaliados
- Tipos de cozinha preferidos
- Hora do dia e dia da semana
- Localizacao actual (se autorizada)
- Avaliadores com perfil de acessibilidade semelhante ("collaborative filtering")

### 7.5 Analise de Menu

**Descricao:** A IA analisa menus (texto ou imagem) para extrair informacao de pratos, alergenos e formato do menu.

**Capacidades:**

- Extraccao de pratos, precos e descricoes a partir de menu em imagem
- Identificacao de alergenos e opcoes dieteticas
- Avaliacao do formato do menu: tamanho do texto, contraste, disponibilidade digital
- Traducao automatica de menus

### 7.6 Geracao de Relatorio de Acessibilidade

**Descricao:** Para restaurantes, a IA gera um relatorio completo de acessibilidade com recomendacoes de melhoria priorizadas por impacto e custo.

**Estrutura do relatorio:**

1. Pontuacao actual por categoria
2. Pontos fortes de acessibilidade
3. Barreiras identificadas (ordenadas por gravidade)
4. Recomendacoes de melhoria com estimativa de custo e impacto
5. Normas e regulamentacoes aplicaveis
6. Comparacao com restaurantes semelhantes na area

---

## 8. Modelo de Dados

### 8.1 Diagrama de Entidades

```plaintext
+------------------+       +----------------------+       +------------------+
|      User        |       |     Restaurant       |       | Accessibility    |
|------------------|       |----------------------|       | Profile          |
| id (PK)          |       | id (PK)              |       |------------------|
| email            |       | name                 |       | id (PK)          |
| password_hash    |       | address              |       | restaurant_id(FK)|
| name             |       | lat/long             |       | entrance_*       |
| avatar_url       |       | phone                |       | parking_*        |
| locale           |       | email                |       | interior_*       |
| role             |       | website              |       | bathroom_*       |
| created_at       |<------| cuisine_types        |------>| communication_*  |
| updated_at       |  1:N  | price_range          |  1:1  | menu_*           |
+--------+---------+  owns | capacity             |       | overall_score    |
         |              or  | description          |       | verification_lvl |
         |            rates | status               |       | last_verified_at |
         |                  | owner_id (FK)        |       | created_at       |
         |                  | created_at           |       | updated_at       |
         |                  +----------+-----------+       +------------------+
         |                             |
+--------+---------+       +-----------+-----------+
| UserAccessibility |       |     OperatingHours   |
| Profile           |       |-----------------------|
|-------------------|       | id (PK)               |
| id (PK)           |       | restaurant_id (FK)    |
| user_id (FK)      |       | day_of_week           |
| mobility_type     |       | open_time             |
| chair_width       |       | close_time            |
| turning_radius    |       | is_closed             |
| step_tolerance    |       +-----------------------+
| ramp_tolerance    |
| bathroom_needs    |       +----------------------+
| visual_needs      |       |       Review         |
| hearing_needs     |       |----------------------|
| dietary_needs     |       | id (PK)              |
| search_radius     |       | user_id (FK)         |
+-------------------+       | restaurant_id (FK)   |
                            | accessibility_rating |
+-------------------+       | food_rating          |
|   Reservation     |       | accessibility_text   |
|-------------------|       | food_text            |
| id (PK)           |       | mobility_type_at_    |
| user_id (FK)      |       |   review_time        |
| restaurant_id(FK) |       | verification_status  |
| date              |       | created_at           |
| time              |       +----------+-----------+
| party_size        |                  |
| accessibility_    |       +----------+-----------+
|   notes           |       |    ReviewPhoto       |
| status            |       |----------------------|
| created_at        |       | id (PK)              |
+-------------------+       | review_id (FK)       |
                            | url                  |
+-------------------+       | alt_text             |
| Verification      |       | ai_analysis          |
| Report            |       | annotation           |
|-------------------|       +----------------------+
| id (PK)           |
| restaurant_id(FK) |       +----------------------+
| verifier_id (FK)  |       |  RestaurantPhoto     |
| report_data       |       |----------------------|
| photos            |       | id (PK)              |
| measurements      |       | restaurant_id (FK)   |
| verification_lvl  |       | url                  |
| created_at        |       | alt_text             |
+-------------------+       | category             |
                            | ai_analysis          |
+-------------------+       +----------------------+
|     Menu          |
|-------------------|       +----------------------+
| id (PK)           |       |     Embedding        |
| restaurant_id(FK) |       |----------------------|
| name              |       | id (PK)              |
| description       |       | entity_type          |
| format_type       |       | entity_id            |
| url               |       | vector (pgvector)    |
+--------+----------+       | model_version        |
         |                  | created_at           |
+--------+----------+       +----------------------+
|      Dish         |
|-------------------|
| id (PK)           |
| menu_id (FK)      |
| name              |
| description       |
| price             |
| allergens         |
| dietary_tags      |
| photo_url         |
+-------------------+
```

### 8.2 Entidades Principais

#### User

| Atributo      | Tipo         | Descricao                               |
| ------------- | ------------ | --------------------------------------- |
| id            | UUID         | Identificador unico                     |
| email         | VARCHAR(255) | Email unico, usado para autenticacao    |
| password_hash | VARCHAR(255) | Hash Argon2id da password               |
| name          | VARCHAR(100) | Nome de exibicao                        |
| avatar_url    | TEXT         | URL do avatar                           |
| locale        | VARCHAR(5)   | Lingua preferida (pt-PT, en, etc.)      |
| role          | ENUM         | user, restaurant_owner, verifier, admin |
| is_active     | BOOLEAN      | Conta activa                            |
| created_at    | TIMESTAMP    | Data de criacao                         |
| updated_at    | TIMESTAMP    | Ultima actualizacao                     |

#### UserAccessibilityProfile

| Atributo           | Tipo      | Descricao                                                            |
| ------------------ | --------- | -------------------------------------------------------------------- |
| id                 | UUID      | Identificador unico                                                  |
| user_id            | UUID (FK) | Referencia ao utilizador                                             |
| mobility_type      | ENUM      | electric_wheelchair, manual_wheelchair, walker, crutches, cane, none |
| chair_width_cm     | SMALLINT  | Largura da cadeira/auxiliar em cm                                    |
| turning_radius_cm  | SMALLINT  | Raio de viragem necessario em cm                                     |
| step_tolerance     | ENUM      | none, one_small, two_three_with_help                                 |
| ramp_tolerance_pct | SMALLINT  | Inclinacao maxima toleravel (%)                                      |
| bathroom_needs     | JSONB     | Array de necessidades (barras apoio, espaco rotacao, etc.)           |
| visual_needs       | JSONB     | Array de necessidades visuais                                        |
| hearing_needs      | JSONB     | Array de necessidades auditivas                                      |
| dietary_needs      | JSONB     | Array de restricoes alimentares                                      |
| search_radius_km   | SMALLINT  | Raio de pesquisa preferido                                           |

#### Restaurant

| Atributo      | Tipo          | Descricao                                   |
| ------------- | ------------- | ------------------------------------------- |
| id            | UUID          | Identificador unico                         |
| name          | VARCHAR(200)  | Nome do restaurante                         |
| slug          | VARCHAR(200)  | Slug para URL                               |
| address       | TEXT          | Morada completa                             |
| city          | VARCHAR(100)  | Cidade                                      |
| postal_code   | VARCHAR(20)   | Codigo postal                               |
| country       | VARCHAR(2)    | Codigo ISO do pais                          |
| latitude      | DECIMAL(10,7) | Coordenada GPS                              |
| longitude     | DECIMAL(10,7) | Coordenada GPS                              |
| phone         | VARCHAR(20)   | Telefone                                    |
| email         | VARCHAR(255)  | Email                                       |
| website       | TEXT          | URL do website                              |
| cuisine_types | JSONB         | Array de tipos de cozinha                   |
| price_range   | SMALLINT      | 1-4 (1=barato, 4=premium)                   |
| capacity      | SMALLINT      | Capacidade total de lugares                 |
| description   | TEXT          | Descricao do restaurante                    |
| owner_id      | UUID (FK)     | Utilizador proprietario (se registado)      |
| status        | ENUM          | pending, active, inactive, closed           |
| osm_id        | BIGINT        | ID no OpenStreetMap (se importado)          |
| source        | ENUM          | user_submitted, osm_import, restaurant_self |
| created_at    | TIMESTAMP     | Data de criacao                             |
| updated_at    | TIMESTAMP     | Ultima actualizacao                         |

#### AccessibilityProfile

| Atributo                     | Tipo         | Descricao                                 |
| ---------------------------- | ------------ | ----------------------------------------- |
| id                           | UUID         | Identificador unico                       |
| restaurant_id                | UUID (FK)    | Referencia ao restaurante                 |
| entrance_accessible          | ENUM         | yes, no, partial, unknown                 |
| entrance_door_width_cm       | SMALLINT     | Largura da porta de entrada               |
| entrance_steps_count         | SMALLINT     | Numero de degraus                         |
| entrance_step_height_cm      | SMALLINT     | Altura do degrau mais alto                |
| entrance_ramp                | BOOLEAN      | Tem rampa                                 |
| entrance_ramp_slope_pct      | DECIMAL(4,1) | Inclinacao da rampa (%)                   |
| entrance_ramp_handrail       | BOOLEAN      | Rampa tem corrimao                        |
| entrance_door_type           | ENUM         | automatic, manual, revolving              |
| entrance_doorbell_accessible | BOOLEAN      | Campainha acessivel                       |
| entrance_surface             | ENUM         | smooth, cobblestone, gravel, mixed        |
| entrance_lighting            | ENUM         | good, medium, poor                        |
| parking_accessible_spots     | BOOLEAN      | Lugares acessiveis                        |
| parking_distance_m           | SMALLINT     | Distancia ate a entrada                   |
| parking_spot_width_cm        | SMALLINT     | Largura do lugar                          |
| parking_signage              | BOOLEAN      | Sinalizacao adequada                      |
| interior_corridor_width_cm   | SMALLINT     | Largura dos corredores                    |
| interior_table_spacing       | ENUM         | yes, no, partial                          |
| interior_table_height_cm     | SMALLINT     | Altura das mesas                          |
| interior_knee_space_cm       | SMALLINT     | Espaco sob a mesa                         |
| interior_single_floor        | BOOLEAN      | Piso unico                                |
| interior_elevator            | BOOLEAN      | Tem elevador                              |
| interior_elevator_dimensions | JSONB        | Dimensoes do elevador                     |
| interior_surface             | ENUM         | non_slip, carpet, tiles, wood             |
| interior_turning_space_cm    | SMALLINT     | Espaco de manobra                         |
| interior_counter_accessible  | BOOLEAN      | Balcao acessivel                          |
| bathroom_accessible          | BOOLEAN      | Casa de banho acessivel                   |
| bathroom_door_width_cm       | SMALLINT     | Largura da porta                          |
| bathroom_turning_space_cm    | SMALLINT     | Espaco de rotacao                         |
| bathroom_grab_bars           | BOOLEAN      | Barras de apoio                           |
| bathroom_toilet_height_cm    | SMALLINT     | Altura da sanita                          |
| bathroom_sink_height_cm      | SMALLINT     | Altura do lavatorio                       |
| bathroom_knee_space          | BOOLEAN      | Espaco para joelhos                       |
| bathroom_tap_type            | ENUM         | lever, sensor, rotary                     |
| bathroom_mirror_accessible   | BOOLEAN      | Espelho acessivel                         |
| bathroom_emergency_alarm     | BOOLEAN      | Alarme de emergencia                      |
| comm_digital_menu            | BOOLEAN      | Menu digital (QR)                         |
| comm_large_print_menu        | BOOLEAN      | Menu letra grande                         |
| comm_braille_menu            | BOOLEAN      | Menu braille                              |
| comm_photo_menu              | BOOLEAN      | Menu com fotos                            |
| comm_staff_training          | BOOLEAN      | Pessoal formado                           |
| comm_high_contrast_signage   | BOOLEAN      | Sinalizacao alto contraste                |
| comm_hearing_loop            | BOOLEAN      | Bucle de inducao                          |
| overall_score                | DECIMAL(5,2) | Pontuacao global calculada                |
| verification_level           | SMALLINT     | 0=nao verificado, 1=comunidade, 2=auditor |
| last_verified_at             | TIMESTAMP    | Data da ultima verificacao                |
| last_verified_by             | UUID (FK)    | Quem verificou por ultimo                 |
| data_confidence              | DECIMAL(3,2) | Confianca media dos dados (0-1)           |
| created_at                   | TIMESTAMP    | Data de criacao                           |
| updated_at                   | TIMESTAMP    | Ultima actualizacao                       |

#### Review

| Atributo                    | Tipo      | Descricao                                  |
| --------------------------- | --------- | ------------------------------------------ |
| id                          | UUID      | Identificador unico                        |
| user_id                     | UUID (FK) | Autor da avaliacao                         |
| restaurant_id               | UUID (FK) | Restaurante avaliado                       |
| accessibility_rating        | SMALLINT  | 1-5 estrelas (acessibilidade)              |
| accessibility_entrance      | SMALLINT  | 1-5 (entrada)                              |
| accessibility_interior      | SMALLINT  | 1-5 (interior)                             |
| accessibility_bathroom      | SMALLINT  | 1-5 (casa de banho)                        |
| accessibility_communication | SMALLINT  | 1-5 (comunicacao)                          |
| accessibility_text          | TEXT      | Comentario sobre acessibilidade            |
| food_rating                 | SMALLINT  | 1-5 estrelas (gastronomia)                 |
| food_text                   | TEXT      | Comentario sobre comida/servico            |
| mobility_type_at_review     | ENUM      | Tipo de mobilidade no momento da avaliacao |
| is_verified_visit           | BOOLEAN   | Visita confirmada                          |
| helpful_count               | INTEGER   | Numero de "util"                           |
| created_at                  | TIMESTAMP | Data de criacao                            |

#### Reservation

| Atributo            | Tipo      | Descricao                                           |
| ------------------- | --------- | --------------------------------------------------- |
| id                  | UUID      | Identificador unico                                 |
| user_id             | UUID (FK) | Utilizador que reservou                             |
| restaurant_id       | UUID (FK) | Restaurante                                         |
| date                | DATE      | Data da reserva                                     |
| time                | TIME      | Hora da reserva                                     |
| party_size          | SMALLINT  | Numero de pessoas                                   |
| accessibility_notes | TEXT      | Notas de acessibilidade (pre-preenchidas do perfil) |
| status              | ENUM      | pending, confirmed, cancelled, completed            |
| restaurant_notes    | TEXT      | Notas do restaurante                                |
| created_at          | TIMESTAMP | Data de criacao                                     |

#### VerificationReport

| Atributo           | Tipo      | Descricao                         |
| ------------------ | --------- | --------------------------------- |
| id                 | UUID      | Identificador unico               |
| restaurant_id      | UUID (FK) | Restaurante verificado            |
| verifier_id        | UUID (FK) | Utilizador verificador            |
| report_data        | JSONB     | Dados estruturados da verificacao |
| measurements       | JSONB     | Medicoes precisas                 |
| verification_level | SMALLINT  | Nivel atribuido                   |
| notes              | TEXT      | Notas do verificador              |
| created_at         | TIMESTAMP | Data da verificacao               |

#### Embedding

| Atributo      | Tipo        | Descricao                      |
| ------------- | ----------- | ------------------------------ |
| id            | UUID        | Identificador unico            |
| entity_type   | ENUM        | restaurant, review, menu, dish |
| entity_id     | UUID        | ID da entidade                 |
| vector        | VECTOR(768) | Vector de embedding (pgvector) |
| model_version | VARCHAR(50) | Versao do modelo de embedding  |
| created_at    | TIMESTAMP   | Data de criacao                |

### 8.3 Indices Recomendados

```plaintext
-- Pesquisa geografica
CREATE INDEX idx_restaurant_location ON restaurant
  USING GIST (ST_MakePoint(longitude, latitude));

-- Pesquisa vectorial (embeddings)
CREATE INDEX idx_embedding_vector ON embedding
  USING hnsw (vector vector_cosine_ops);

-- Pesquisa full-text
CREATE INDEX idx_restaurant_search ON restaurant
  USING GIN (to_tsvector('portuguese', name || ' ' || description));

-- Filtros frequentes
CREATE INDEX idx_restaurant_city ON restaurant (city);
CREATE INDEX idx_restaurant_cuisine ON restaurant
  USING GIN (cuisine_types);
CREATE INDEX idx_restaurant_status ON restaurant (status);
CREATE INDEX idx_review_restaurant ON review (restaurant_id);
CREATE INDEX idx_accessibility_restaurant ON accessibility_profile (restaurant_id);
CREATE INDEX idx_accessibility_score ON accessibility_profile (overall_score);
```

---

## 9. Arquitectura do Sistema

### 9.1 Visao Geral

```plaintext
                         +---------------------------+
                         |     Utilizador/Browser    |
                         |   (PWA - Next.js CSR)     |
                         +-------------+-------------+
                                       |
                                   HTTPS/TLS 1.3
                                       |
                         +-------------+-------------+
                         |     Coolify + Traefik     |
                         |    (Reverse Proxy, SSL)   |
                         +-------------+-------------+
                                       |
                         +-------------+-------------+
                         |      Next.js 16           |
                         |  +---------------------+  |
                         |  | Server Components   |  |
                         |  | (SSR + ISR + PPR)   |  |
                         |  +---------------------+  |
                         |  | API Routes + tRPC   |  |
                         |  | (REST + type-safe)  |  |
                         |  +---------------------+  |
                         |  | Server Actions      |  |
                         |  | (Mutacoes simples)  |  |
                         |  +---------------------+  |
                         |  | SSE Endpoints       |  |
                         |  | (Tempo real)        |  |
                         |  +---------------------+  |
                         +---+-------+-------+-------+
                             |       |       |
              +--------------+   +---+---+   +--------------+
              |                  |       |                   |
   +----------+----------+  +---+---+   +---+---+  +-------+--------+
   |   PostgreSQL 17     |  | Claude|   | Ollama|  | APIs Externas  |
   |   + pgvector        |  |  API  |   | (emb.)|  | (Google Maps,  |
   | +----------------+  |  +-------+   +-------+  |  OSM, etc.)    |
   | | Dados relac.   |  |                         +----------------+
   | | Dados vectores |  |
   | | Full-text idx  |  |
   | +----------------+  |
   +---------------------+
```

### 9.2 Fluxo de Pesquisa com IA (RAG)

```plaintext
Utilizador: "restaurante italiano acessivel perto da Ribeira"
                              |
                              v
                   +---------------------+
                   | 1. Parse da query   |
                   |    (Next.js API)    |
                   +----------+----------+
                              |
                   +----------+----------+
                   | 2. Gerar embedding  |
                   |    da query         |
                   |  (Ollama / API)     |
                   +----------+----------+
                              |
               +--------------+--------------+
               |                             |
   +-----------+----------+    +-------------+-----------+
   | 3a. Busca vectorial  |    | 3b. Busca full-text    |
   |     (pgvector HNSW)  |    |     (tsvector/tsquery) |
   |     Top 30 similares |    |     Top 30 matches     |
   +----------+-----------+    +-------------+-----------+
               |                             |
               +----------+--+---------------+
                          |
               +----------+----------+
               | 4. Merge + filtros  |
               |    de acessibilid.  |
               |    (perfil do user) |
               +----------+----------+
                          |
               +----------+----------+
               | 5. Enriquecer com   |
               |    dados estrutur.  |
               |    (horarios, scores|
               |     distancia, etc.)|
               +----------+----------+
                          |
               +----------+----------+
               | 6. Re-ranking com   |
               |    Claude API       |
               |    (top 20 -> top 5)|
               +----------+----------+
                          |
               +----------+----------+
               | 7. Resposta natural |
               |    com resultados   |
               |    personalizados   |
               +----------+----------+
                          |
                          v
              Resposta ao utilizador com
              5 sugestoes ordenadas e
              justificacao personalizada
```

### 9.3 Stack Tecnica Completa

Para detalhes completos sobre cada tecnologia, justificacoes e alternativas consideradas, consultar o documento [`TECH_STACK.md`](./TECH_STACK.md).

**Resumo:**

| Camada        | Tecnologia                                                                     |
| ------------- | ------------------------------------------------------------------------------ |
| Frontend      | Next.js 16, shadcn/ui + Radix UI, Tailwind CSS v4, Serwist (PWA)               |
| Backend       | Next.js API Routes + tRPC, Drizzle ORM, Better Auth, SSE                       |
| Base de Dados | PostgreSQL 17 + pgvector                                                       |
| IA            | Claude Sonnet 4.6 / Opus 4.5, Claude Vision, nomic-embed-text-v2 (Ollama), RAG |
| DevOps        | Docker multi-arch, Coolify, GitHub Actions                                     |
| Testes        | Vitest, Playwright, axe-core                                                   |
| Qualidade     | ESLint 9, Prettier, markdownlint-cli2, TypeScript strict                       |
| CLI           | pnpm, Turborepo, Claude Code, MCP                                              |

### 9.4 Ambientes

| Ambiente        | Infraestrutura            | Finalidade            |
| --------------- | ------------------------- | --------------------- |
| Desenvolvimento | MacBook Air M1 16GB       | Desenvolvimento local |
| Staging         | Docker no N5105 (Coolify) | Testes pre-producao   |
| Producao        | Docker no N5105 (Coolify) | Utilizadores finais   |

**Nota:** Staging e producao partilham o mesmo hardware inicialmente. A separacao sera feita via namespaces Docker e recursos alocados. Quando o volume justificar, producao migra para VPS cloud (Hetzner ARM64).

---

## 10. Internacionalizacao

### 10.1 Estrategia de Idiomas

**Fase 1 (MVP):**

- Portugues de Portugal (pt-PT) -- idioma principal
- Ingles (en) -- idioma secundario

**Fase 2:**

- Espanhol (es) -- proximidade geografica e linguistica
- Frances (fr) -- turismo significativo em Portugal

**Fase 3:**

- Alemao (de) -- forte comunidade turistica em Portugal
- Neerlandes (nl) -- idem
- Outros conforme procura

### 10.2 Abordagem Tecnica

**Framework:** next-intl (ou equivalente para Next.js 16)

**Estrutura de ficheiros:**

```plaintext
messages/
  pt-PT.json    -- Traducoes em portugues
  en.json       -- Traducoes em ingles
  es.json       -- Traducoes em espanhol
  ...
```

**Routing:**

- `/pt/restaurantes/[slug]` -- Versao portuguesa
- `/en/restaurants/[slug]` -- Versao inglesa
- Deteccao automatica por header `Accept-Language` do browser
- Cookie de preferencia de idioma

### 10.3 Traducao de Conteudo

**Conteudo da interface (estatico):**

- Traducao manual por nativos ou tradutores profissionais
- Revisao por utilizadores bilingues da comunidade

**Conteudo gerado por utilizadores (dinamico):**

- Avaliacoes, descricoes e comentarios mantidos no idioma original
- Botao "Traduzir" que usa Claude API para traducao contextual
- Traducoes em cache para evitar chamadas repetidas a API
- Indicacao visual de que o texto e uma traducao automatica

### 10.4 Adaptacao Cultural

- Formatos de data e hora regionais (dd/mm/aaaa para PT, mm/dd/yyyy para EN)
- Formatos de moeda (EUR para PT/ES/FR/DE, GBP para UK)
- Separadores decimais e de milhares regionais
- Tipos de cozinha adaptados ao contexto cultural
- Normas de acessibilidade referenciadas conforme a regiao do utilizador

---

## 11. Modelo de Negocio

### 11.1 Filosofia

O Eat Out Adviser segue um modelo open source com nucleo gratuito e funcionalidades comerciais opcionais. O objectivo principal e impacto social, nao maximizacao de lucro. A sustentabilidade financeira e necessaria para manter e desenvolver a plataforma, mas nao a custa da missao de acessibilidade.

### 11.2 Nucleo Open Source (Gratuito)

**Para utilizadores:**

- Pesquisa e descoberta de restaurantes acessiveis
- Perfil de acessibilidade personalizado
- Pontuacao de acessibilidade personalizada
- Avaliacoes e classificacoes
- Visualizacao em mapa
- Notificacoes basicas
- Capacidade offline (PWA)

**Para restaurantes:**

- Perfil basico na plataforma
- Formulario de autoavaliacao de acessibilidade
- Resposta a avaliacoes
- Metricas basicas (visualizacoes)

**Para a comunidade:**

- API de dados de acessibilidade (leitura)
- Dados abertos em formato A11yJSON
- Codigo fonte completo no GitHub

### 11.3 Funcionalidades Freemium (Fase 2+)

**Para utilizadores (subscrição "Eat Out Plus"):**

- Recomendacoes avancadas por IA (historico + preferencias)
- Pesquisa por linguagem natural ilimitada (base: 10/dia)
- Traducao automatica de avaliacoes ilimitada
- Reservas prioritarias
- Notificacoes personalizadas avancadas
- Preco estimado: 2,99 EUR/mes ou 24,99 EUR/ano

**Para restaurantes (plano "Restaurante Pro"):**

- Perfil destacado nos resultados de pesquisa
- Relatorio detalhado de acessibilidade com recomendacoes
- Selo de acessibilidade verificada para marketing
- Estatisticas avancadas (demographics, comparacao sectorial)
- Gestao de reservas integrada
- Suporte prioritario
- Preco estimado: 19,99 EUR/mes

**Para restaurantes (plano "Restaurante Premium"):**

- Tudo do Pro
- Verificacao presencial por auditor (1x/ano incluida)
- Certificacao de acessibilidade
- Integracao API com sistema de reservas existente
- Formacao online em acessibilidade para o pessoal
- Preco estimado: 49,99 EUR/mes

### 11.4 Receitas Futuras (Fase 3+)

| Fonte de Receita               | Descricao                                       | Estimativa                         |
| ------------------------------ | ----------------------------------------------- | ---------------------------------- |
| Subscriacoes de utilizadores   | Plano "Eat Out Plus"                            | 5-15% conversao                    |
| Subscriacoes de restaurantes   | Planos Pro e Premium                            | 10-20% dos restaurantes registados |
| Certificacao de acessibilidade | Programa de certificacao formal                 | 200-500 EUR/certificacao           |
| API comercial                  | Acesso avancado a dados para terceiros          | Licenciamento por volume           |
| Parcerias com municipios       | Dados de acessibilidade para politicas publicas | Contratos anuais                   |
| Parcerias com turismo          | Dados para operadores turisticos                | Licenciamento                      |
| Eventos e formacao             | Workshops de acessibilidade para restaurantes   | Valor por sessao                   |

### 11.5 Plano de Sustentabilidade

**Fase 1 (0-6 meses):** Investimento pessoal, zero receita. Foco em construir o MVP e a base de utilizadores.

**Fase 2 (6-12 meses):** Primeiras receitas de subscriacoes de restaurantes. Objectivo: cobrir custos de infraestrutura (dominio, APIs, eventuais VPS).

**Fase 3 (12-24 meses):** Receitas diversificadas. Objectivo: cobrir custos de infraestrutura + tempo parcial de desenvolvimento.

**Longo prazo:** Candidatura a financiamento europeu (programas de acessibilidade e inclusao digital), parcerias com associacoes de deficiencia, possivel constituicao de cooperativa ou associacao.

---

## 12. Roadmap

### 12.1 Fase 1 -- MVP (Meses 1-4)

**Objectivo:** Lancar a versao minima funcional no Grande Porto com dados de 50-100 restaurantes.

| Mes       | Entregas                                                               |
| --------- | ---------------------------------------------------------------------- |
| **Mes 1** | Setup do projecto, CI/CD, base de dados, autenticacao, modelo de dados |
|           | Estrutura Next.js 16 + Tailwind + shadcn/ui                            |
|           | Formulario de registo com perfil de acessibilidade                     |
|           | CRUD basico de restaurantes                                            |
| **Mes 2** | Formulario de acessibilidade completo (baseado em normas)              |
|           | Sistema de pontuacao de acessibilidade (algoritmo + calculos)          |
|           | Pesquisa por filtros estruturados                                      |
|           | Mapa interactivo com marcadores de semaforo                            |
| **Mes 3** | Sistema de avaliacoes (acessibilidade + gastronomia)                   |
|           | Pesquisa por linguagem natural (RAG basico)                            |
|           | PWA com capacidade offline basica                                      |
|           | Multilingue (PT + EN)                                                  |
| **Mes 4** | Reservas basicas (formulario + email)                                  |
|           | Seed de dados: 50-100 restaurantes no Grande Porto                     |
|           | Testes de acessibilidade (axe-core + manuais)                          |
|           | Beta fechado com 20-30 utilizadores                                    |

**Marco:** Lancamento publico da versao beta no Grande Porto.

### 12.2 Fase 2 -- IA e Comunidade (Meses 5-8)

**Objectivo:** Adicionar funcionalidades de IA e construir comunidade activa.

| Mes       | Entregas                                                      |
| --------- | ------------------------------------------------------------- |
| **Mes 5** | Analise de fotografias por Claude Vision                      |
|           | Sumarizacao de avaliacoes por IA                              |
|           | Recomendacoes personalizadas basicas                          |
| **Mes 6** | Sistema de verificacao comunitaria (3 niveis)                 |
|           | Portal self-service para restaurantes                         |
|           | Importacao de dados OSM/Wheelmap (Grande Porto)               |
| **Mes 7** | Notificacoes push                                             |
|           | Recomendacoes avancadas (historico + collaborative filtering) |
|           | Analise de menus por IA                                       |
| **Mes 8** | Idiomas adicionais (ES, FR)                                   |
|           | Expansao geografica: Lisboa                                   |
|           | Lancamento de funcionalidades freemium                        |

**Marco:** 500+ restaurantes, 200+ utilizadores activos, primeiras receitas.

### 12.3 Fase 3 -- Comercializacao e Expansao (Meses 9-14)

**Objectivo:** Monetizacao sustentavel e expansao nacional.

| Mes             | Entregas                                                   |
| --------------- | ---------------------------------------------------------- |
| **Meses 9-10**  | Planos comerciais para restaurantes (Pro + Premium)        |
|                 | Sistema de certificacao de acessibilidade                  |
|                 | API publica (v1)                                           |
|                 | Relatorios de acessibilidade automaticos para restaurantes |
| **Meses 11-12** | Expansao para todo o territorio portugues                  |
|                 | Parcerias com associacoes de deficiencia                   |
|                 | Parcerias com municipios (piloto)                          |
|                 | Idiomas adicionais (DE, NL)                                |
| **Meses 13-14** | Optimizacao de performance e escalabilidade                |
|                 | Avaliacao de migracao para cloud (se necessario)           |
|                 | Relatorio de impacto social (1 ano)                        |

**Marco:** 2.000+ restaurantes, 1.000+ utilizadores activos, receita recorrente.

### 12.4 Fase 4 -- Extensao (Mes 15+)

**Objectivo:** Expandir para outros tipos de espacos e mercados.

- Extensao do modelo para hoteis (campos especificos de quartos, chuveiros, etc.)
- Extensao para museus e espacos culturais
- Extensao para espacos de actividades e lazer
- Internacionalizacao para Espanha (piloto: Galiza, pela proximidade)
- Candidatura a financiamento europeu
- Consideracao de app mobile nativa (React Native ou equivalente)

---

## 13. Metricas de Sucesso

### 13.1 KPIs por Fase

**Fase 1 (MVP):**

| KPI                                                  | Meta  | Metodo de Medicao |
| ---------------------------------------------------- | ----- | ----------------- |
| Restaurantes com perfil completo (Grande Porto)      | 50    | Base de dados     |
| Utilizadores registados                              | 100   | Base de dados     |
| Utilizadores com perfil de acessibilidade preenchido | 60%   | Base de dados     |
| Avaliacoes submetidas                                | 200   | Base de dados     |
| Tempo medio de pesquisa ate resultado                | < 3 s | Analytics         |
| Score Lighthouse (Performance)                       | >= 90 | Lighthouse CI     |
| Score Lighthouse (Acessibilidade)                    | 100   | Lighthouse CI     |
| Bugs criticos em producao                            | 0     | Sentry            |

**Fase 2 (IA + Comunidade):**

| KPI                                         | Meta                       | Metodo de Medicao |
| ------------------------------------------- | -------------------------- | ----------------- |
| Restaurantes (Portugal)                     | 500                        | Base de dados     |
| Utilizadores activos mensais (MAU)          | 200                        | Analytics         |
| Avaliacoes com fotografia                   | 30%                        | Base de dados     |
| Dados verificados por comunidade (Nivel 1+) | 40%                        | Base de dados     |
| Precisao da pesquisa por IA                 | >= 80% relevancia no top-5 | Avaliacao manual  |
| Taxa de conversao freemium (utilizadores)   | 5%                         | Analytics         |
| Restaurantes com portal activo              | 50                         | Base de dados     |

**Fase 3 (Comercializacao):**

| KPI                             | Meta    | Metodo de Medicao |
| ------------------------------- | ------- | ----------------- |
| Restaurantes (Portugal)         | 2.000   | Base de dados     |
| Utilizadores activos mensais    | 1.000   | Analytics         |
| Receita mensal recorrente (MRR) | 500 EUR | Financeiro        |
| Restaurantes com plano pago     | 50      | Base de dados     |
| Certificacoes emitidas          | 20      | Base de dados     |
| Dados verificados (Nivel 1+)    | 60%     | Base de dados     |
| NPS (Net Promoter Score)        | >= 50   | Inquerito         |

### 13.2 Metricas de Satisfacao

| Metrica                                    | Meta    | Frequencia |
| ------------------------------------------ | ------- | ---------- |
| NPS (utilizadores com mobilidade reduzida) | >= 60   | Trimestral |
| NPS (restaurantes)                         | >= 40   | Trimestral |
| Taxa de retencao mensal (utilizadores)     | >= 50%  | Mensal     |
| Taxa de recomendacao organica              | >= 30%  | Trimestral |
| Tempo medio na aplicacao por sessao        | 3-5 min | Mensal     |

### 13.3 Metricas de Cobertura de Acessibilidade

| Metrica                                      | Meta Fase 1 | Meta Fase 3 |
| -------------------------------------------- | ----------- | ----------- |
| % de restaurantes com dados de entrada       | 95%         | 95%         |
| % de restaurantes com dados de WC            | 80%         | 90%         |
| % de restaurantes com dados de interior      | 70%         | 85%         |
| % de restaurantes com fotografias            | 80%         | 95%         |
| % de dados verificados (Nivel 1+)            | 20%         | 60%         |
| % de dados verificados por auditor (Nivel 2) | 5%          | 20%         |
| Idade media dos dados                        | < 6 meses   | < 4 meses   |

### 13.4 Metricas de Impacto Social

| Metrica                                                               | Meta (12 meses) | Metodo     |
| --------------------------------------------------------------------- | --------------- | ---------- |
| Utilizadores que reportam "encontrei restaurante que nao conhecia"    | >= 70%          | Inquerito  |
| Utilizadores que reportam "reduziu ansiedade ao escolher restaurante" | >= 60%          | Inquerito  |
| Restaurantes que fizeram melhorias apos relatorio                     | >= 20%          | Seguimento |
| Contribuicoes para OpenStreetMap                                      | 500+            | Export OSM |

---

## 14. Riscos e Mitigacoes

### 14.1 Riscos Tecnicos

| Risco                                                   | Probabilidade | Impacto | Mitigacao                                                                                                                      |
| ------------------------------------------------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **N5105 insuficiente para carga**                       | Media         | Alto    | Monitorizar desde dia 1; plano de migracao para Hetzner ARM64 documentado; arquitectura stateless facilita migracao            |
| **Custos de API Claude elevados**                       | Media         | Medio   | Cache agressivo de respostas; limites por utilizador; modelo freemium para recuperar custos; fallback para modelos open source |
| **Quebra de servico (single server)**                   | Media         | Alto    | Backups diarios automaticos; procedimento de restauracao testado; CDN para assets; PWA mitiga indisponibilidade parcial        |
| **Mudanca na API Claude**                               | Baixa         | Medio   | Abstraccao da camada de IA; testes de integracao; SDK oficial com versionamento                                                |
| **Performance de pgvector em escala**                   | Baixa         | Medio   | Para o volume esperado (<500k vectores) pgvector e mais do que suficiente; migracao para servico dedicado se necessario        |
| **Dependencia de servicos externos (Google Maps, OSM)** | Baixa         | Medio   | Abstraccao da camada de mapas; dados locais em cache; alternativas open source (Leaflet + tiles OSM)                           |

### 14.2 Riscos de Negocio

| Risco                             | Probabilidade | Impacto | Mitigacao                                                                                                                                                       |
| --------------------------------- | ------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Adocao lenta por utilizadores** | Media         | Alto    | Foco num nicho bem definido (Grande Porto); parcerias com associacoes de deficiencia; marketing em comunidades especificas; resolver um problema real e pessoal |
| **Adocao lenta por restaurantes** | Media         | Medio   | Registo gratuito e simples; demonstrar valor (mais clientes); relatorio de acessibilidade gratuito como incentivo                                               |
| **Concorrente com mais recursos** | Baixa         | Medio   | Vantagem de primeiro no mercado portugues; comunidade open source; dados verificados como diferenciador; nicho especifico vs. generalista                       |
| **Sustentabilidade financeira**   | Media         | Alto    | Modelo freemium desde a Fase 2; custos operacionais minimos (self-hosting); financiamento europeu como opcao; sem custos de equipa (projecto solo inicialmente) |
| **Regulamentacao adversa**        | Muito Baixa   | Medio   | EAA e RGPD sao aliados do projecto (criam procura); monitorizacao regulamentar; dados sensiveis tratados com rigor                                              |

### 14.3 Riscos de Qualidade de Dados

| Risco                                   | Probabilidade | Impacto    | Mitigacao                                                                                                                                                   |
| --------------------------------------- | ------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dados de acessibilidade incorrectos** | Alta          | Muito Alto | Sistema de verificacao em 3 niveis; avisos claros de "nao verificado"; penalizacao na pontuacao para dados nao verificados; mecanismo de contestacao        |
| **Dados desactualizados**               | Alta          | Alto       | Sinalizacao automatica apos 12 meses; pedidos de reconfirmacao aos utilizadores; mecanismo de reporte de alteracoes; analise de fotografias recentes por IA |
| **Avaliacoes fraudulentas**             | Media         | Medio      | Verificacao de visita; deteccao de padroes anomalos; moderacao comunitaria; revisao manual de avaliacoes sinalizadas                                        |
| **Enviesamento nos dados**              | Media         | Medio      | Monitorizar cobertura por zona geografica, tipo de cozinha e gama de precos; incentivar contribuicoes em areas sub-representadas                            |
| **Estimativas de IA incorrectas**       | Media         | Medio      | Todas as estimativas de IA marcadas explicitamente; pedido de confirmacao humana; nivel de confianca apresentado; IA nao substitui verificacao humana       |

### 14.4 Riscos Legais e Regulamentares

| Risco                                      | Probabilidade | Impacto    | Mitigacao                                                                                                                                               |
| ------------------------------------------ | ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Violacao de RGPD**                       | Baixa         | Muito Alto | Privacy by design; dados minimos; consentimento explicito para dados de saude; DPO designado (mesmo que informal); auditoria RGPD antes do lancamento   |
| **Responsabilidade por dados incorrectos** | Media         | Alto       | Termos de uso claros: dados sao informativos, nao garantidos; disclaimers vissiveis; incentivo a verificacao; seguro de responsabilidade civil (futuro) |
| **Difamacao via avaliacoes**               | Baixa         | Medio      | Politica de moderacao; direito de resposta do restaurante; remocao de conteudo difamatorio; procedimento de reclamacao                                  |
| **Propriedade intelectual de dados OSM**   | Muito Baixa   | Baixo      | Licenca ODbL respeitada; atribuicao correcta; contribuicao de volta para OSM                                                                            |

### 14.5 Matriz de Prioridade de Riscos

```plaintext
Impacto
  ^
  |
  |  Muito Alto  |  RGPD          |  Dados         |                |
  |              |                |  incorrectos   |                |
  |              |                |                |                |
  |  Alto        |  N5105 carga   |  Dados desact. |  Sustentab.    |
  |              |  Adocao lenta  |                |  financeira    |
  |              |                |                |                |
  |  Medio       |  Concorrente   |  Avaliacoes    |  Custos API    |
  |              |  Responsab.    |  fraudulentas  |  IA incorrecta |
  |              |                |                |                |
  |  Baixo       |                |                |  IP dados OSM  |
  |              |                |                |                |
  +--------------+----------------+----------------+------------------>
                 Muito Baixa      Baixa            Media           Alta
                                                               Probabilidade
```

---

## Anexo A: Glossario

| Termo     | Definicao                                                                      |
| --------- | ------------------------------------------------------------------------------ |
| A11yJSON  | Formato padronizado de dados de acessibilidade criado pela Sozialhelden e.V.   |
| ADA       | Americans with Disabilities Act -- lei federal dos EUA sobre acessibilidade    |
| ARIA      | Accessible Rich Internet Applications -- atributos HTML para acessibilidade    |
| EAA       | European Accessibility Act -- directiva europeia em vigor desde Junho 2025     |
| Embedding | Representacao vectorial de texto usada para busca semantica                    |
| HNSW      | Hierarchical Navigable Small World -- algoritmo de indice para busca vectorial |
| ISR       | Incremental Static Regeneration -- tecnica de rendering do Next.js             |
| LLM       | Large Language Model -- modelo de linguagem de grande escala                   |
| MAU       | Monthly Active Users -- utilizadores activos mensais                           |
| MVP       | Minimum Viable Product -- minimo produto viavel                                |
| OSM       | OpenStreetMap -- projecto de mapeamento colaborativo open source               |
| PPR       | Partial Pre-Rendering -- tecnica de rendering do Next.js 16                    |
| PWA       | Progressive Web App -- aplicacao web com capacidades nativas                   |
| RAG       | Retrieval Augmented Generation -- busca + geracao com IA                       |
| RGPD      | Regulamento Geral sobre a Proteccao de Dados (GDPR em ingles)                  |
| SSE       | Server-Sent Events -- protocolo de push do servidor para o cliente             |
| tRPC      | TypeScript Remote Procedure Call -- framework de API type-safe                 |
| WCAG      | Web Content Accessibility Guidelines -- directrizes de acessibilidade web      |

---

## Anexo B: Referencias Normativas

- **ISO 21542:2021** -- Building construction: Accessibility and usability of the built environment
- **ADA Standards for Accessible Design** (2010) -- U.S. Department of Justice
- **EN 301 549 v3.2.1** -- Accessibility requirements for ICT products and services
- **European Accessibility Act** -- Directive (EU) 2019/882
- **WCAG 2.1/2.2** -- Web Content Accessibility Guidelines (W3C)
- **A11yJSON** -- Accessibility data exchange format (Sozialhelden e.V.)

---

## Anexo C: Documentos Relacionados

| Documento                   | Localizacao                                                                                                            | Descricao                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Relatorio Tecnico de Stack  | [`TECH_STACK.md`](./TECH_STACK.md)                                                                                     | Decisoes tecnologicas detalhadas com justificacoes |
| Investigacao de Plataformas | [`research/plataformas-acessibilidade-fisica-relatorio.md`](./research/plataformas-acessibilidade-fisica-relatorio.md) | Analise detalhada de 15 plataformas internacionais |

---

_Este documento e mantido como especificacao viva e sera actualizado conforme o projecto evolui. Ultima actualizacao: 15 de Marco de 2026._
