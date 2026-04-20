# Inventário de Dados — Status ERP (SQL Server)

**Gerado em:** 2026-04-03  
**Fonte:** schemas_sql/ (DDL) + tabelas_sql/ (100 linhas de exemplo por tabela)  
**Convenção de schema:** `Campo;Tipo;TamanhoOuNULL` — para tipos numéricos/data "NULL" indica nullable; para varchar/char o terceiro campo é o tamanho (nullable não declarado explicitamente no export)

---

## Tabelas Base

---

### TBAIR — Bairros

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_Area | int | Sim | 0, 0, 0 | 0% |
| Cd_Bairro | smallint | Sim | 1, 2, 3 | 0% |
| Cd_Cidade | int | Sim | 1, 2, 3 | 0% |
| Cd_SecTrab | int | Sim | 137402, 22, 1114 | 0% |
| Nome | varchar(30) | — | NITEROI, CENTRO, SAO JOAO | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 900 | ~90% |
| VSINC_DH | datetime | Sim | 2023-03-08, 2008-07-23, 2018-04-16 | ~90% |
| VSINC_FlagSinc | varchar(1) | — | NULL | ~100% |
| CAMPO1 | varchar(1000) | — | NULL | ~100% |

---

### TBOMB — Bombas

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Qt_DigBomba | int | Sim | 7, 7, 7 | 0% |
| Tx_TipoVenda | varchar(1) | — | 0, 0, 0 | 0% |
| Vl_Preco | money | Sim | 6.69, 6.49, 8.86 | 0% |
| Cd_TanquePadrao | varchar(3) | — | 2, 3, 1 | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 001, 002, 005 | 0% |
| VSINC_DH | datetime | Sim | 2026-03-19, 2026-03-17, 2024-01-10 | 0% |
| VSINC_FlagSinc | varchar(1) | — | N, N, N | 0% |
| Cd_Bomba | int | Sim | 1, 2, 3 | 0% |
| Cd_Estab | varchar(3) | — | 001, 002, 005 | 0% |
| Cd_Tanque | varchar(3) | — | 2, 3, 1 | 0% |
| AbastManual | varchar(1) | — | N, N, N | 0% |
| Cd_SecTrab | int | Sim | 106799, 106795, 137345 | 0% |
| FatConv | money | Sim | 100.00, 100000.00, 10000.00 | 0% |
| BomRefPrecAvista | varchar(1) | — | N, N, N | 0% |
| Bomba_Concentrador | varchar(4) | — | 05, 04, 09 | 0% |
| FatorSomaEnc | money | Sim | 0.00, 1000000.00, 2000000.00 | 0% |
| Cd_Conjunto | int | Sim | 1, 2, 3 | 0% |
| Tipo_Bomba | varchar(1) | — | G, G, W | 0% |
| Id_Concentrador | int | Sim | 2, 1, 2 | 0% |
| ImpressoraComanda | varchar(255) | — | PISTA1, PISTA2, Pista | 0% |
| EnviaPreco3Dec | bit | Sim | 0, 0, NULL | ~3% |

---

### TCATI — Categorias de Item

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_CatItem | varchar(3) | — | LIV, CB, CV | 0% |
| Cd_Externo | varchar(20) | — | (vazio) | ~100% |
| Cd_GrpFisE | smallint | Sim | 131, 120, 126 | 0% |
| Cd_GrpFisS | smallint | Sim | 20, 20, 20 | 0% |
| Cd_PadCInv | smallint | Sim | 1, 1, 1 | ~10% |
| Cd_SecTrab | int | Sim | 177224, 88871, 160105 | 0% |
| Descricao | varchar(20) | — | LIVROS, COMBUSTIVEIS, CONVENIENCIA | 0% |

> **Valores reais (37 categorias):** ACESSORIOS, ARLA, BANHO, BEBIDAS, BRINDES, CAFES, CESTA BASICA, COMBUSTIVEIS, CONVENIENCIA, Diversos, EMPÓRIO, Energia eletrica, EQUIP. IMFORMATICA, EQUIPAMENTOS, FERRAMENTAS, FILTROS, FINANCEIRO, FLUIDOS, Inativos, INSUMOS LANCHERIA, INSUMOS PRODUÇÃO, LANCHES PRONTOS, LAVAGEM, LIVROS, LUBRIFICAÇAO, LUBRIFICANTES, MANUTENÇÃO DO POSTO, Manutençao Veiculos, MAQUINA LAVA/SECA, Material de Consumo, MATERIAL DE LIMPEZA, MATERIAL/ESCRITORIO, PRATOS PRONTOS, PRODUÇAO IMBE, TABACARIA, UNIFORMES, UTENCILIOS / COZINHA
| Id_FatorAco | varchar(1) | — | N, N, N | 0% |
| Id_ListaDePrecos | varchar(1) | — | S, S, S | 0% |
| Id_MestreCjtos | varchar(1) | — | NULL, NULL, NULL | ~100% |
| Id_OC | varchar(1) | — | S, S, S | 0% |
| Id_OP | varchar(1) | — | N, N, N | 0% |
| Id_OPE | varchar(1) | — | N, N, N | 0% |
| Id_PPE | varchar(1) | — | N, N, N | 0% |
| Id_Previsao | varchar(1) | — | S, S, S | 0% |
| Id_SER | varchar(1) | — | N, N, N | 0% |
| Id_Terceiros | varchar(1) | — | N, N, N | 0% |
| Id_Venda | varchar(1) | — | S, S, S | 0% |
| Id_VendaCons | varchar(1) | — | S, S, S | 0% |
| GerarCodBar | varchar(1) | — | N, N, N | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 090, 090 | 0% |
| VSINC_DH | datetime | Sim | 2025-07-10, 2025-08-13 | 0% |
| VSINC_FlagSinc | varchar(1) | — | NULL, N, N | ~40% |
| Cd_GrpFOper | int | Sim | 15, 0, 15 | 0% |
| ImpAplicOC | varchar(1) | — | N, N, N | 0% |
| PesoAuto | varchar(1) | — | S, S, S | 0% |
| PossuiKIt | varchar(1) | — | N, N, N | 0% |
| Id_Esteriliza | varchar(1) | — | N, N, N | 0% |
| Semovente | varchar(1) | — | N, N, N | 0% |
| CD_INDPERF | int | Sim | 0, NULL, NULL | ~50% |
| VincItemAtivoFixo | varchar(1) | — | N, N, N | 0% |
| Lavagem | varchar(1) | — | N, N, N | 0% |
| Id_EstProdOrca | varchar(1) | — | N, N, N | 0% |
| BloqVendaVinculoShell | bit | Sim | 0, 0, 0 | ~60% |
| UtilizaIntegracaoShell | bit | Sim | 0, 0, 0 | ~60% |
| ConsDebitoF100 | bit | Sim | 0, 0, 0 | ~60% |
| ValidarANP | bit | Sim | 0, 0, 0 | ~60% |
| UtilizaIntegracaoIpiranga | bit | Sim | 0, 0, 0 | ~60% |
| LocalIpiranga | smallint | Sim | NULL, NULL, 3 | ~80% |
| UtilizaIntegracaoPostoAki | bit | Sim | 0, 0, 0 | ~60% |
| GerarEstruturaFrig | bit | Sim | 0, 0, 0 | ~60% |
| PermVendaNegativa | bit | Sim | 0, 0, 0 | ~60% |
| Cd_GrpFisE_Transf | int | Sim | 0, NULL, NULL | ~60% |
| Cd_GrpFisS_Transf | int | Sim | 0, NULL, NULL | ~60% |
| UtilizaIntegracaoSpark | bit | Sim | 0, NULL, 0 | ~60% |
| WMSEstrategiaId | int | Sim | NULL, NULL, NULL | ~100% |

---

### TCENT — Centros de Custo / Estabelecimentos

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_Centro | varchar(12) | — | 001, 002, 080 | 0% |
| Cd_Empr | varchar(3) | — | 001, 001, 001 | 0% |
| Cd_Estab | varchar(3) | — | 001, 080, 002 | 0% |
| Cd_Externo | varchar(20) | — | " " (vazio) | ~100% |
| Cd_SecTrab | int | Sim | 184236, 177178, 42095 | 0% |
| Sigla | varchar(4) | — | P01, P02, MTZ | ~30% |
| Controla_Benefic | varchar(1) | — | N, N, N | ~20% |
| Descricao | varchar(100) | — | AUTO POSTO JAM LTDA, REDE JAM - MATRIZ | 0% |
| RestOpProd | varchar(1) | — | N, N, N | 0% |

---

### TCIDA — Cidades

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_Cidade | int | Sim | 1, 4, 5 | 0% |
| Cd_MicRegiao | varchar(3) | — | " " (vazio) | ~100% |
| Cd_Municipio | int | Sim | 4606, 16006, 7708 | 0% |
| Cd_Pais | int | Sim | 999, 999, 999 | 0% |
| Cd_SecTrab | int | Sim | 137402, 900421860, 43566 | 0% |
| Cd_UF | varchar(2) | — | RS, RS, RS | 0% |
| Nome | varchar(30) | — | CANOAS, ROLANTE, ESTEIO | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 900, 090 | 0% |
| VSINC_DH | datetime | Sim | 2023-03-08, 2010-12-03, 2018-10-01 | 0% |
| VSINC_FlagSinc | varchar(1) | — | N, N, N | ~15% |
| Cd_ExternoGIA | varchar(3) | — | NULL | ~100% |
| Cd_MacRegiao | varchar(3) | — | NULL | ~100% |
| Cd_ANPCidade | varchar(7) | — | NULL, "7533", " 8051" | ~40% |

---

### TCLIE — Clientes/Fornecedores/Pessoas

> **Nota:** Esta é a tabela central de cadastro de pessoas. Possui 338 campos. Apenas campos principais são listados abaixo.

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_Pessoa | int | Sim | (posição 33 no CSV) | 0% |
| Nome | varchar(40) | — | SEASA DO BRASIL LTDA, PRAIANA AZUL LTDA | 0% |
| CGC | varchar(14) | — | 07366769000177, 23963979000107 | 0% |
| RG | varchar(14) | — | 082322511, 0100044697 | ~30% |
| Apelido | varchar(30) | — | NULL, NULL | ~80% |
| Cliente | varchar(1) | — | N, N, S | 0% |
| Fornecedor | varchar(1) | — | N, N, N | 0% |
| Vendedor | varchar(1) | — | N, N, N | 0% |
| Representante | varchar(1) | — | N, N, N | 0% |
| Empregado | varchar(1) | — | N, N, N | 0% |
| Transportadora | varchar(1) | — | N, N, N | 0% |
| Endereco | varchar(40) | — | AV. PAULISTA MULLER, R ERNESTO BASSANI | ~20% |
| CEP | varchar(8) | — | 95708472, 88896500 | ~20% |
| Telefone1 | varchar(20) | — | (27)33350000, 27-99991-1221 | ~30% |
| Telefone2 | varchar(20) | — | NULL | ~80% |
| EMailCR | varchar(30) | — | NULL | ~80% |
| EMail | varchar(60) | — | contabilidade@postosjam.com.br | ~70% |
| Situacao | varchar(1) | — | NULL, NULL | ~50% |
| InsEst | varchar(14) | — | ISENTO, NULL | ~60% |
| DtCadastro | datetime | Sim | 2016-05-06, 2023-04-06 | ~30% |
| UltAlt | datetime | Sim | NULL | ~80% |
| Cd_Grupo | smallint | Sim | 0, 4, 3 | 0% |
| Cd_Centro | varchar(12) | — | NULL | ~80% |
| LimiteCR | money | Sim | 8000.00, 18000.00, NULL | ~50% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 090, 090 | 0% |
| VSINC_DH | datetime | Sim | 2021-06-25, 2023-04-25 | 0% |
| VSINC_FlagSinc | varchar(1) | — | N, NULL, N | ~20% |
| ContribuinteICMS | bit | Sim | NULL, NULL, NULL | ~100% |
| EnviarEmailNFCe | bit | Sim | NULL, NULL, NULL | ~100% |
| ObrigaOrdemAbastEletronica | bit | Sim | NULL, NULL, NULL | ~100% |
| PerfilVipAutoId | int | Sim | NULL | ~100% |
| _(+ 308 outros campos)_ | — | — | — | — |

> Campos adicionais incluem: dados bancários (Cd_Banco, ContaCorrente, Dig_AgenciaFor), dados financeiros (LibePrazoCM, LimiteVales, PercJuroAtraso), configurações de emissão de nota (TpEmisCF, EmiteNFSubstCF), integrações (AceitarTrocoFacil, Cd_Indicador), dados físicos (Latitude, Longitude), e muitos parâmetros de comportamento operacional.

---

### TESPE — Espécies de Documento

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| AcumFiscal | varchar(3) | — | " " (vazio) | ~100% |
| Cd_Especie | varchar(1) | — | U, M, C | 0% |
| Cd_ExternoES | varchar(10) | — | " " (vazio) | ~100% |
| Cd_SecTrab | int | Sim | 164313, 188917, 127383 | 0% |
| Descricao | varchar(30) | — | Uso consumo Vale Bri, TROCO CHEQUE, Cheque ate 15 dias | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 090, 090 | 0% |
| VSINC_DH | datetime | Sim | 2024-10-09, 2024-09-03 | 0% |
| VSINC_FlagSinc | varchar(1) | — | N, N, N | 0% |
| Uti_CupomFiscal | varchar(1) | — | S, S, S | 0% |
| Uti_RecTitulos | varchar(1) | — | N, S, S | 0% |
| Uti_PagContas | varchar(1) | — | N, S, S | 0% |
| RequerCliente | bit | Sim | 0, 0, 0 | ~30% |
| Uti_TrocaValores | varchar(1) | — | N, S, S | 0% |
| Cd_Indice | smallint | Sim | NULL | ~100% |
| RequerConfigAdicional | char(1) | — | NULL | ~100% |

---

### TESTA — Estabelecimentos (Empresas/Filiais)

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_Agencia | smallint | Sim | NULL, NULL, NULL | ~90% |
| Cd_Bairro | smallint | Sim | 3219, 2434, 5455 | 0% |
| Cd_Banco | smallint | Sim | NULL, NULL, NULL | ~90% |
| Cd_Clie | int | Sim | NULL, 999080, 999002 | ~15% |
| Cd_Empr | varchar(3) | — | 001, 001, 001 | 0% |
| Cd_Estab | varchar(3) | — | 001, 080, 002 | 0% |
| Cd_Externo | varchar(20) | — | NULL, " " | ~80% |
| Cd_Forn | int | Sim | 184242, 184242, 184242 | 0% |
| Cd_RamoAtiv | varchar(7) | — | NULL | ~100% |
| Cd_SecTrab | int | Sim | 95535000, 95625000, 95560000 | 0% |
| CEP | varchar(8) | — | 95535000, 95625000 | ~20% |
| Fantasia | varchar(30) | — | JAM ROTA 1, CENTRO DE DISTRIBUICAO, POSTO JAM FILIAL TORRES | 0% |
| Ins_Estadual | varchar(14) | — | 2119, NULL, 12189 | ~20% |
| Ins_Federal | varchar(14) | — | 10527743000178, 10527743000259 | 0% |
| Razao | varchar(100) | — | AUTO POSTO JAM LTDA | 0% |
| Telefone1 | varchar(20) | — | 51-995463426, (51) 3627-4705 | ~20% |
| Email | varchar(50) | — | contabilidade@postosjam.com.br | ~40% |
| Latitude | varchar(30) | — | -29.5936734, -29.3260143 | ~40% |
| Longitude | varchar(30) | — | -50.0763563, -49.7535033 | ~40% |
| UtilizaIntegracaoShell | bit | Sim | NULL | ~100% |
| UtilizaIntegracaoIpiranga | bit | Sim | NULL | ~100% |
| BAIRRO_NOME | varchar(30) | — | OLARIA, CENTRO, ENG VELHO | 0% |
| CIDADE_NOME | varchar(30) | — | TERRA DE AREIA, IMBE, TORRES | 0% |
| UF | varchar(2) | — | RS, RS, RS | 0% |
| _(+ 69 outros campos)_ | — | — | — | — |

---

### TGRPF — Grupos Financeiros (Plano DRE)

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_GrpF1 | varchar(3) | — | 1, 9, 9 | 0% |
| Cd_GrpF2 | varchar(3) | — | 02, 01, 01 | ~10% |
| Cd_GrpF3 | varchar(3) | — | 003, NULL, NULL | ~30% |
| Cd_GrpF4 | varchar(3) | — | " " (vazio) | ~100% |
| Cd_GrpFin | varchar(12) | — | 102003, 9, 901 | 0% |
| Cd_GrpFOper | int | Sim | 23, 0, 0 | 0% |
| Cd_SecTrab | int | Sim | 80876, 4596, 4596 | 0% |
| Descricao | varchar(40) | — | Telefones, SOMENTE CONTAS A PAGAR, NÃO CONTABILIZAR | 0% |
| Tipo | varchar(1) | — | R, D, D | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 090, 090 | 0% |
| VSINC_DH | datetime | Sim | 2020-03-05, 2020-03-24 | 0% |
| VSINC_FlagSinc | varchar(1) | — | N, N, N | ~20% |
| Cd_ContaDR | int | Sim | 0, 0, 0 | 0% |
| Cd_PadCont | int | Sim | 0, 0, 0 | 0% |
| Cd_CtaCor | int | Sim | 0, 0, 0 | 0% |
| Cd_PadFin | int | Sim | 0, 0, 0 | 0% |
| CritDpResult | varchar(1) | — | N, B, B | 0% |
| Id_FluxoCaixa | varchar(1) | — | NULL, NULL, NULL | ~80% |
| TipoOcorrencia | char(1) | — | NULL, NULL, V | ~80% |
| Cd_PadContBaixa | int | Sim | 0, 0, 0 | 0% |
| Situacao | char(1) | — | NULL, NULL, M | ~50% |
| Modo | char(1) | — | NULL, NULL, M | ~50% |

---

### TGRPI — Grupos de Item

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_GrpItem | smallint | Sim | 1, 2, 3 | 0% |
| Cd_SecTrab | int | Sim | 187579, 187579, 187579 | 0% |
| Descricao | varchar(30) | — | Combustíveis, Lubrificantes, Filtros Linha Leve | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 090, 090 | 0% |
| VSINC_DH | datetime | Sim | 2026-02-11, 2020-06-16 | 0% |

> **Valores reais (76 grupos):** Acessorios Linha Pesada, Acessorios P/ Veiculos, Aditivos, Aluguéis, ARLA, Balas e Chicletes, Bancárias, Banho, Bebidas Alcolicas, Bebidas Nao Alcolicas, Bomboniere, Brindes de Pontos, Brinquedos, Cafés Formulados, Cervejas especiais, Cesta Basica Funcionarios, Cesta Limpeza Funcionarios, Cesta Natal, Choc Barra e Gondola, Chocolates - Barras e Caixas, Churrasco, Combo, Combustíveis, Comodato Ipiranga, Congelados, Consumo Interno, Despesas Administrativas, Despesas com Pessoal, Despesas Serviços de Terceiros, Destilados, Emporio, Emporio-Bebidas Nao Alcoolica, Emporio-Azeites/Acetos/Tempero, Emporio-Massas/Molhos/Antepast, EPI´S Funcionarios, Equipamentos, Equipamentos Troca de Oleo, Farmacia Funcionarios, Ferramentas, Filtros Linha Leve, Filtros Linha Pesada, Frios e Laticinios, ICMS, Informática, Insumos cafés Lancheria, Insumos Compra Unidade, Insumos Lancheria, Insumos Lavagem Veiculos, Jardins, Lanches Produçao, Lanches Prontos, Lavagem/Lubrificaçao, Limpeza-Perfumaria Automotiva, Livros, Lubrificantes, Manutençao Movel, Manutenção Posto, Manutençao Veiculos, Mao de obra, Mat Construçao, Material de Escritório, Material de Limpeza, Mini mercado, Padaria, Pratos Prontos, Presentes, Produçao, Produção Imbé, Produtos Coloniais, Salgadinhos, Sanduiches e Pizzas Insumos, Sorvetes e Picoles, Tabacaria, Uniformes, Utensilios de Cozinha, Vinhos e espumantes
| VSINC_FlagSinc | varchar(1) | — | NULL | ~100% |
| Cd_GrpFOper | int | Sim | 11, 12, 13 | 0% |
| Cd_PadCInv | smallint | Sim | 1, 1, 0 | 0% |

---

### TITEM — Itens (Produtos)

> **Nota:** Tabela central de produtos. Possui 250 campos. Campos principais listados abaixo.
> **Catálogo real: ~13.599 produtos** (ativos + inativos). Amostras por tipo: combustíveis (GASOLINA, DIESEL, ARLA), lubrificantes (MOBIL SUPER MINERAL 20W50, OLEO MOTUL XCESS 5W30), filtros (FILTRO OLEO WOE626, FILTRO COMB WK723), conveniência (SALGADINHO, CERVEJA, CAFÉ), livros (DIARIO DE UM BANANA, ROBINSON CRUSOE), lavagem (SHAMPOO NANO RM 816, VIP CAR LAVA CARROS), tabacaria (FUMO CAPITAIN BLACK, ZOMO POD), utilidades (PAPEL TOALHA, PAPEL HIGIENICO). Itens inativos identificáveis pelo sufixo `(INATIVO)` ou `INATIVO` no campo `Descricao`.

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_Item | varchar(15) | — | (posição 14 no CSV) | 0% |
| Descricao | varchar(120) | — | NEUTRALIZADOR DE URINA, CAPA DE CHUVA GG, FIO DENTAL 400M | 0% |
| DescrRes | varchar(30) | — | NEUTRALIZADOR DE URINA, CAPA DE CHUVA GG | 0% |
| Cd_CatItem | varchar(3) | — | INA, UF, INA | 0% |
| Cd_GrpItem | smallint | Sim | 185, 0, 0 | 0% |
| Cd_LinItem | smallint | Sim | 150, 0, 0 | 0% |
| Cd_SGrItem | smallint | Sim | 31, 0, 0 | 0% |
| Cd_TipItem | smallint | Sim | 0, 23, 22 | 0% |
| Cd_CodBarras | varchar(14) | — | " ", 7788000000000, NULL | ~40% |
| Cd_SecTrab | int | Sim | 801155, 104214, 275256 | 0% |
| Unidade | varchar(3) | — | " ", UNI, " " | 0% |
| ClasFisc | varchar(10) | — | 50400000, 62011300, 33062000 | 0% |
| Preco_Venda | money | Sim | 0.00, 0.00, 0.00 | 0% |
| Cst_Base | money | Sim | 0.00, 0.00, 0.00 | 0% |
| Qtd_Estoque | money | Sim | 0.00, 0.00, 0.00 | 0% |
| ABC | varchar(1) | — | A, A, A | 0% |
| ABC_Automat | varchar(1) | — | S, S, S | 0% |
| Contr_Estoque | varchar(1) | — | S, S, N | 0% |
| ICMS | money | Sim | 0.00, 0.00, 0.00 | 0% |
| Tributacao | int | Sim | 0, 0, 0 | 0% |
| IPI | money | Sim | 0.00, 0.00, 0.00 | 0% |
| CEST | varchar(7) | — | NULL | ~100% |
| DtCadastro | datetime | Sim | 2015-10-03, 2018-06-25, 2018-05-07 | 0% |
| Dt_CMP | datetime | Sim | 2017-04-12, 1899-12-30, 2018-12-21 | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 005, 005, 005 | 0% |
| VSINC_DH | datetime | Sim | 2020-02-13 | 0% |
| VSINC_FlagSinc | varchar(1) | — | N | 0% |
| PermiteNegativo | bit | Sim | NULL | ~100% |
| CalcDIFALEntConsForaEstado | bit | Sim | NULL | ~100% |
| RegraImpostoId_Saida | int | Sim | NULL | ~100% |
| RegraImpostoId_Entrada | int | Sim | NULL | ~100% |
| _(+ 220 outros campos)_ | — | — | — | — |

---

### TLINI — Linhas de Item

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_LinItem | smallint | Sim | 5451, 5452, 5453 | 0% |
| Cd_SecTrab | int | Sim | 900469835, 900315906 | 0% |
| Descricao | varchar(30) | — | Produto comissão 7%, Produto Comissão R$ 3,00 | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 900, 900, 900 | 0% |
| VSINC_DH | datetime | Sim | 2011-09-03, 2009-04-28 | 0% |
| VSINC_FlagSinc | varchar(1) | — | NULL | ~100% |
| Cd_GrpFOper | int | Sim | 0, 0, 0 | 0% |
| Cd_SGrItem | int | Sim | 0, 0, 0 | 0% |

---

### TMODP — Modalidades de Pagamento

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_LayoutBco | smallint | Sim | 1, 0, 0 | 0% |
| Cd_LayoutChe | smallint | Sim | 0, 0, 0 | 0% |
| Cd_ModPag | varchar(3) | — | 100, 101, 102 | 0% |
| Cd_PadFin | int | Sim | 0, 0, 0 | 0% |
| Cd_SecTrab | int | Sim | 162531, 162531, 162544 | 0% |
| Descricao | varchar(30) | — | INA Cobrança Bancária, INA Deposito C/Corrente, Rec-Caixas Dinheiro PDV | 0% |
| Sigla | varchar(4) | — | RB, DEP, R$ | 0% |
| Tp_ModPag | varchar(2) | — | 01, O, NULL | ~10% |
| Cd_PadCont | int | Sim | 100, 110, 1000 | 0% |
| Cd_ContaBco | int | Sim | 3092, 0, 5 | 0% |
| Cd_Especie | varchar(1) | — | NULL, NULL, D | ~50% |
| Cd_LOP | int | Sim | NULL | ~100% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 090, 090 | 0% |
| VSINC_DH | datetime | Sim | 2025-08-18, 2025-11-23 | 0% |
| VSINC_FlagSinc | varchar(1) | — | N, N, N | 0% |
| Cd_CtaCor | int | Sim | 1, 0, 0 | 0% |
| Cd_Externo | varchar(20) | — | NULL | ~100% |
| Modo | varchar(1) | — | R, R, R | 0% |
| SenhaLibRec | varchar(1) | — | NULL | ~100% |
| OperacCaixa | varchar(1) | — | NULL | ~100% |
| Cd_Estab | varchar(3) | — | NULL | ~100% |
| Cd_Motivo | smallint | Sim | NULL | ~100% |
| BloqNFSubCF | varchar(1) | — | NULL | ~100% |
| VdaRTitConfCaix | varchar(1) | — | NULL | ~100% |
| FinalCliTed_Doc | varchar(5) | — | NULL | ~100% |
| GravarParcDias_TEF | bit | Sim | NULL | ~100% |
| InibSelUtiConfCx | bit | Sim | NULL | ~100% |
| Tp_Utilizacao | varchar(1) | — | NULL | ~100% |
| Txt_Adquirente | varchar(20) | — | NULL | ~100% |
| Txt_Bandeira | varchar(20) | — | NULL | ~100% |
| Txt_Produto | varchar(20) | — | NULL | ~100% |
| TemInfAdqAuto | bit | Sim | NULL | ~100% |
| IdEnumConcAdquirente | int | Sim | NULL | ~100% |
| IdEnumConcBandeira | int | Sim | NULL | ~100% |
| IdEnumConcServico | int | Sim | NULL | ~100% |
| IdEnumConcVoucher | int | Sim | NULL | ~100% |
| IgnorarTransfCart | bit | Sim | NULL | ~100% |
| BloqConfConcPend | bit | Sim | NULL | ~100% |
| PossuiRecolhNFE | bit | Sim | NULL | ~100% |
| TpAmbConc | char(1) | — | P, G, G | ~50% |
| EnvSomenteTEFConc | bit | Sim | NULL | ~100% |
| AbatRecFinancF100 | bit | Sim | NULL | ~100% |
| RequerLibLV | bit | Sim | NULL | ~100% |
| RequerLibLR | bit | Sim | NULL | ~100% |
| Cd_PadContConfCaixa | int | Sim | NULL | ~100% |
| IgnorarGeracaoContasReceber | bit | Sim | NULL | ~100% |
| Cd_MeioPagamentoDFe | varchar(2) | — | NULL, NULL, 01 | ~60% |

---

### TSGrI — Subgrupos de Item

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_Externo | varchar(20) | — | NULL, NULL, NULL | ~100% |
| Cd_SecTrab | int | Sim | 45794, 2881, 4018 | 0% |
| Cd_SGrItem | smallint | Sim | 1, 2, 3 | 0% |
| Descricao | varchar(30) | — | Gasolinas, Gasolina aditivada, Alcool | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, NULL, NULL | ~60% |
| VSINC_DH | datetime | Sim | 2018-11-24, NULL, NULL | ~60% |
| VSINC_FlagSinc | varchar(1) | — | NULL | ~100% |
| Cd_GrpFOper | int | Sim | 0, NULL, NULL | ~60% |
| Cd_PadCInv | smallint | Sim | 0, NULL, NULL | ~60% |
| Cd_GrpItem | int | Sim | 1, NULL, NULL | ~60% |
| IgnorarEnvioShell | bit | Sim | NULL | ~100% |
| IgnorarEnvioIpiranga | bit | Sim | NULL | ~100% |

---

### TSLIL — Sub-Linhas de Item

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_SecTrab | int | Sim | 900428934, 900428934, 112711 | 0% |
| Cd_SliItem | smallint | Sim | 1, 2, 3 | 0% |
| Descricao | varchar(30) | — | Classe Gasolina, Classe Diesel, Outras Classes | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 900, 900, 090 | 0% |
| VSINC_DH | datetime | Sim | 2011-01-18, 2021-09-29 | 0% |
| VSINC_FlagSinc | varchar(1) | — | NULL | ~100% |
| Cd_GrpFOper | int | Sim | 0, 0, 0 | 0% |
| Cd_LinItem | int | Sim | NULL, NULL, NULL | ~100% |

---

### TTANQ — Tanques

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Cd_Estab | varchar(3) | — | 001, 001, 001 | 0% |
| Cd_Item | varchar(15) | — | 7 (combustível associado) | 0% |
| Cd_SecTrab | int | Sim | 23675, 166088, 529 | 0% |
| Cd_Tanque | varchar(3) | — | 1, 2, 3 | 0% |
| Qt_Capacidade | money | Sim | 15000.00, 15000.00, 30000.00 | 0% |
| Qt_Lastro | money | Sim | 150.00, 200.00, 300.00 | 0% |
| Inativo | varchar(1) | — | N, N, N | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 001, 090 | 0% |
| VSINC_DH | datetime | Sim | 2019-08-21, 2023-02-15 | 0% |
| VSINC_FlagSinc | varchar(1) | — | NULL, N, N | ~15% |
| Id_MedidorTanque | int | Sim | 1, 1, 1 | 0% |
| Tanque_Medidor | int | Sim | 0, 0, NULL | ~5% |
| ConsLMCSPED | char(1) | — | S, S, S | 0% |

---

## Views / Tabelas Temporárias BI (TMPBI_*)

> Estas views/tabelas temporárias são geradas especificamente para BI. Não possuem chaves primárias declaradas. Os dados de exemplo são de amostras menores (≤10 linhas).

---

### TMPBI_BAIXA_ESTOQUE_DETALHADA

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| TIPO_MOVIMENTACAO | varchar(2) | — | SV, SV, SV | 0% |
| PERDA_ROUBO | varchar(3) | — | SIM, SIM, SIM | 0% |
| CD_ESTAB | varchar(3) | — | 001, 001, 001 | 0% |
| POSTO | varchar(36) | — | 001 - JAM ROTA 1, 002 - POSTO JAM FILIAL TORRES | 0% |
| NR_NOTA | int | Sim | 70829, 71748, 72315 | 0% |
| OPERADOR | varchar(12) | — | MARILIA, Suporte, PATRICIA | 0% |
| CFOP | varchar(5) | — | 5927O | 0% |
| NATUREZA | varchar(30) | — | NULL | ~100% |
| DATA_EMISSAO | datetime | Sim | 2023-12-20, 2024-01-12 | 0% |
| DIA_SEMANA | varchar(16) | — | 04-QUARTA-FEIRA, 06-SEXTA-FEIRA | 0% |
| DIA_EMISSAO | int | Sim | 20, 12, 25 | 0% |
| MES_EMISSAO | int | Sim | 12, 1, 1 | 0% |
| ANO_EMISSAO | int | Sim | 2023, 2024, 2024 | 0% |
| NR_NOTA_INTERNO | int | Sim | 13040728, 13067139, 13079992 | 0% |
| CODIGO_CLIENTE | int | Sim | 21020, 21020, 21020 | 0% |
| NOME_CLIENTE | varchar(40) | — | AUTO POSTO JAM LTDA | 0% |
| NOME_CLIENTE_REDUZIDO | varchar(30) | — | AUTO POSTO JAM LTDA | 0% |
| BAIRRO_CLIENTE | varchar(30) | — | OLARIA | 0% |
| CIDADE_CLIENTE | varchar(30) | — | TERRA DE AREIA | 0% |
| CODIGO_ITEM | varchar(15) | — | 1, 1, 1 | 0% |
| DESCRICAO_ITEM | varchar(120) | — | GASOLINA COMUM | 0% |
| CODIGO_CATEGORIA_ITEM | varchar(3) | — | CB | 0% |
| DESCRICAO_CATEGORIA_ITEM | varchar(20) | — | COMBUSTIVEIS | 0% |
| CODIGO_GRUPO_ITEM | smallint | Sim | 1, 1, 1 | 0% |
| DESCRICAO_GRUPO_ITEM | varchar(30) | — | Combustíveis | 0% |
| QTD_ITEM | money | Sim | 5.00, 7.03, 5.89 | 0% |
| VLR_UNIT | money | Sim | 5.69, 5.69, 5.69 | 0% |
| TOT_VLRITEM | money | Sim | 28.45, 40.00, 33.51 | 0% |
| CODIGO_SUBGRUPO_ITEM | smallint | Sim | 1, 1, 1 | 0% |
| DESCRICAO_SUBGRUPO_ITEM | varchar(30) | — | Gasolinas | 0% |
| CODIGO_LINHA_ITEM | smallint | Sim | NULL | ~100% |
| DESCRICAO_LINHA_ITEM | varchar(30) | — | NULL | ~100% |
| CODIGO_SUBLINHA_ITEM | smallint | Sim | 12, 12, 12 | 0% |
| DESCRICAO_SUBLINHA_ITEM | varchar(30) | — | Combustiveis Metas | 0% |
| CUSTO_UNIT | money | Sim | 4.8119, 4.8273, 4.8456 | 0% |
| SITUACAO | varchar(9) | — | NORMAL | 0% |

---

### TMPBI_DESPESAS_DRE

> **Nota:** Sem arquivo de dados de exemplo disponível.

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Dt_Geracao | varchar(100) | — | — | — |
| ESTABELECIMENTO | varchar(3) | — | — | — |
| CD_ESTABORIGEM | varchar(3) | — | — | — |
| Grp1 | varchar(12) | — | — | — |
| DESCRICAO1 | varchar(40) | — | — | — |
| Grp2 | varchar(12) | — | — | — |
| DESCRICAO2 | varchar(40) | — | — | — |
| Grp3 | varchar(12) | — | — | — |
| DESCRICAO3 | varchar(52) | — | — | — |
| CD_GRPFOPER | int | Sim | — | — |
| Grp_Original1 | varchar(12) | — | — | — |
| DESCRICAO_Original1 | varchar(40) | — | — | — |
| Grp_Original2 | varchar(12) | — | — | — |
| DESCRICAO_Original2 | varchar(40) | — | — | — |
| Grp_Original3 | varchar(12) | — | — | — |
| DESCRICAO_Original3 | varchar(52) | — | — | — |
| CD_GRPFOPER_Original | int | Sim | — | — |
| Cd_TipTit | varchar(2) | — | — | — |
| ID_DOCUMORIG | varchar(15) | — | — | — |
| CD_TIPTITORIG | varchar(6) | — | — | — |
| CD_PESSOAORIG | varchar(6) | — | — | — |
| SQ_DOCUMORIG | varchar(6) | — | — | — |
| OBSORIG | varchar(5000) | — | — | — |
| DATAORIG | datetime | Sim | — | — |
| NOME | varchar(40) | — | — | — |
| ANOMES | varchar(7) | — | — | — |
| VALOR | money | Sim | — | — |
| PERC_DESPESAS | money | Sim | — | — |

---

### TMPBI_ESTOQUE_DATABASE

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Data_Base | varchar(10) | — | 29/03/2026 | 0% |
| POSTO | varchar(36) | — | 001 - JAM ROTA 1, 090 - REDE JAM - MATRIZ | 0% |
| CD_ESTAB | varchar(3) | — | 001, 090, 005 | 0% |
| CD_CODBARRAS | varchar(14) | — | 17894900181005, " " | ~10% |
| CODIGO_ITEM | varchar(15) | — | 000500, 000568, 01 | 0% |
| DESCRICAO_ITEM | varchar(120) | — | SCHWEPPES GRAPE FUSION 350ML, GLADE GEL FLORAL PERFECTION | 0% |
| CODIGO_CATEGORIA_ITEM | varchar(3) | — | INA, INA, ASS | 0% |
| DESCRICAO_CATEGORIA_ITEM | varchar(20) | — | Inativos, ACESSORIOS | 0% |
| CODIGO_GRUPO_ITEM | smallint | Sim | 154, 4, 4 | 0% |
| DESCRICAO_GRUPO_ITEM | varchar(30) | — | Bebidas Nao Alcolicas, Acessorios P/ Veiculos | 0% |
| QTD_ESTOQUE | money | Sim | 0.00, 0.00, 3.00 | 0% |
| CODIGO_SUBGRUPO_ITEM | smallint | Sim | 28, 26, 164 | 0% |
| DESCRICAO_SUBGRUPO_ITEM | varchar(30) | — | Refrigerantes, Perfume Veicular, Palhetas Leves | 0% |
| NCM | varchar(10) | — | 22021000, 33074900, 85129000 | 0% |
| UN | varchar(3) | — | UN, UN, UN | 0% |
| CUSTO_UNIT | money | Sim | 0.00, 0.00, 17.25 | 0% |
| Cst_UltCompraSEncargos | money | Sim | 0.00, 0.00, 18.98 | 0% |
| Cst_UltCompraCEncargos | money | Sim | 0.00, 0.00, 19.01 | 0% |
| CD_TABPRE_ESTAB | varchar(5) | — | 2, 2, 10 | 0% |
| Vlr_Unit | money | Sim | 0.00, 0.00, 0.00 | 0% |
| CUSTO_TOTAL | money | Sim | 0.00, 0.00, 0.00 | 0% |
| Cst_UltCompraSEncargos_TOTAL | money | Sim | 0.00, 0.00, 0.00 | 0% |
| Cst_UltCompraCEncargos_TOTAL | money | Sim | 0.00, 0.00, 0.00 | 0% |
| VENDA_TOTAL | money | Sim | 0.00, 0.00, 0.00 | 0% |
| Estoque | varchar(8) | — | Zerado, Zerado, Positivo | 0% |

---

### TMPBI_ESTOQUE_MOVIMENTOS_ENTRADAS

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| CD_ESTAB | varchar(3) | — | 002, 002, 002 | 0% |
| POSTO | varchar(36) | — | 002 - POSTO JAM FILIAL TORRES | 0% |
| DATAMOV | datetime | Sim | 2025-02-01, 2025-02-02 | 0% |
| DIA_SEMANA | varchar(16) | — | 07-SÁBADO, 01-DOMINGO | 0% |
| OPERACAO | varchar(2) | — | EI, EI | 0% |
| ATUALIZA_EST | varchar(1) | — | S, S | 0% |
| CD_ENTSAI | int | Sim | 0, 0 | 0% |
| CD_DOCUM | int | Sim | 10225, 10225 | 0% |
| SERIE_DOCUM | varchar(3) | — | FOR, FOR | 0% |
| CD_NATOPE | varchar(4) | — | NULL, NULL | ~100% |
| CD_COMPL | varchar(1) | — | NULL, NULL | ~100% |
| CD_PESSOA | int | Sim | NULL, NULL | ~100% |
| CODIGO_ITEM | varchar(15) | — | 891, 891 | 0% |
| DESCRICAO_ITEM | varchar(120) | — | CAFE LONGO MAQUINA | 0% |
| UNIDADE | varchar(3) | — | UN, UN | 0% |
| CODIGO_CATEGORIA_ITEM | varchar(3) | — | op, op | 0% |
| DESCRICAO_CATEGORIA_ITEM | varchar(20) | — | CAFES, CAFES | 0% |
| CODIGO_GRUPO_ITEM | smallint | Sim | 28, 28 | 0% |
| DESCRICAO_GRUPO_ITEM | varchar(30) | — | Cafés Formulados | 0% |
| CODIGO_SUBGRUPO_ITEM | smallint | Sim | 185, 185 | 0% |
| DESCRICAO_SUBGRUPO_ITEM | varchar(30) | — | Cafes e chás | 0% |
| CODIGO_LINHA_ITEM | smallint | Sim | NULL, NULL | ~100% |
| DESCRICAO_LINHA_ITEM | varchar(30) | — | NULL | ~100% |
| CODIGO_SUBLINHA_ITEM | smallint | Sim | 11, 11 | 0% |
| DESCRICAO_SUBLINHA_ITEM | varchar(30) | — | Conveniencia Metas | 0% |
| QTD_ITEM | money | Sim | 1.00, 1.00, 5.00 | 0% |
| FORNEC | int | Sim | 1, 1 | 0% |
| LOTE | varchar(15) | — | U, U | 0% |
| MOTIVO | varchar(200) | — | PDC: 002-2 Caixa: 3020 | 0% |
| CUSTO_UNIT | money | Sim | 0.00, 0.00, 0.00 | 0% |
| OPERADOR | varchar(12) | — | evelize, LUCIANO, GEOVANI | 0% |

---

### TMPBI_ESTOQUE_MOVIMENTOS_EXTRAS

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| CD_ESTAB | varchar(3) | — | 001, 001, 001 | 0% |
| POSTO | varchar(36) | — | 001 - JAM ROTA 1 | 0% |
| DATAMOV | datetime | Sim | 2023-06-19, 2023-09-24 | 0% |
| DIA_SEMANA | varchar(16) | — | 02-SEGUNDA-FEIRA, 01-DOMINGO | 0% |
| OPERACAO | varchar(2) | — | SB, SB, EB | 0% |
| CD_NATOPE | varchar(4) | — | NULL | ~100% |
| CD_COMPL | varchar(1) | — | NULL | ~100% |
| ATUALIZA_EST | varchar(1) | — | S, S | 0% |
| CODIGO_ITEM | varchar(15) | — | 1, 1, 10501 | 0% |
| DESCRICAO_ITEM | varchar(120) | — | GASOLINA COMUM, ACUCAR SACHE 1000UN | 0% |
| UNIDADE | varchar(3) | — | L, L, CX | 0% |
| CODIGO_CATEGORIA_ITEM | varchar(3) | — | CB, INL | 0% |
| DESCRICAO_CATEGORIA_ITEM | varchar(20) | — | COMBUSTIVEIS, INSUMOS LANCHERIA | 0% |
| CODIGO_GRUPO_ITEM | smallint | Sim | 1, 120 | 0% |
| DESCRICAO_GRUPO_ITEM | varchar(30) | — | Combustíveis, Insumos Lancheria | 0% |
| CODIGO_SUBGRUPO_ITEM | smallint | Sim | 1, 174 | 0% |
| DESCRICAO_SUBGRUPO_ITEM | varchar(30) | — | Gasolinas, Consumo Clientes Insumos | 0% |
| CODIGO_LINHA_ITEM | smallint | Sim | NULL | ~100% |
| DESCRICAO_LINHA_ITEM | varchar(30) | — | NULL | ~100% |
| CODIGO_SUBLINHA_ITEM | smallint | Sim | 12, NULL | ~50% |
| DESCRICAO_SUBLINHA_ITEM | varchar(30) | — | Combustiveis Metas | ~50% |
| QTD_ITEM | money | Sim | 317.96, 120.79, 24.39 | 0% |
| FORNEC | int | Sim | 1, 1 | 0% |
| LOTE | varchar(15) | — | " " (vazio), 5152 | 0% |
| MOTIVO | varchar(200) | — | Atualização de Balanço por Lote e Fornecedor, BAIXA SEMANAL USO E CONSUMO | 0% |
| CUSTO_UNIT | money | Sim | 4.63, 5.03, 51.76 | 0% |
| OPERADOR | varchar(12) | — | GEOVANI, Pedro, ANGELO | 0% |

---

### TMPBI_ESTOQUE_PREVISAO

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| TIPO | varchar(6) | — | PEDIDO, PEDIDO | 0% |
| DOCUMENTO | int | Sim | 900053603, 900060063 | 0% |
| ESTAB_ORIGEM | varchar(3) | — | 080, 080 | 0% |
| ESTAB_DESTINO | varchar(3) | — | 006, 006 | 0% |
| COD_PESSOA | int | Sim | 999006, 999006 | 0% |
| NOME_PESSOA | varchar(40) | — | AUTO POSTO JAM LTDA | 0% |
| RESUMIDO_PESSOA | varchar(30) | — | POSTO JAM TRAMANDAI | 0% |
| DT_EMIS | datetime | Sim | 2025-04-28, 2026-03-23 | 0% |
| DT_PREVENTR | datetime | Sim | 2025-04-28, 2026-03-23 | 0% |
| CODIGO_ITEM | varchar(15) | — | 10501, 203111, 4077 | 0% |
| DESCRICAO | varchar(120) | — | ACUCAR SACHE 1000UN, CREME DE CHANTILLY 1 LITRO | 0% |
| QUANT_PED | money | Sim | 2.00, 2.00, 3.00 | 0% |
| QUANT_ATEND | money | Sim | 1.00, 0.00, 0.00 | 0% |
| QUANT_ABERTA | money | Sim | 1.00, 2.00, 3.00 | 0% |
| VLR_UNIT | money | Sim | 53.64, 16.58, 93.32 | 0% |

---

### TMPBI_ESTOQUE_RETROATIVO_DATABASE

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| DATABASE_TXT | varchar(10) | — | 2026-02-28 | 0% |
| DATABASE_SQL | datetime | Sim | 2026-02-28 | 0% |
| POSTO | varchar(36) | — | 005 - POSTO JAM IMBÉ, 002 - POSTO JAM FILIAL TORRES | 0% |
| CD_ESTAB | varchar(3) | — | 005, 002, 006 | 0% |
| CD_CODBARRAS | varchar(14) | — | 17894900181005, " " | ~10% |
| CODIGO_ITEM | varchar(15) | — | 000500, 000568, 0100 | 0% |
| DESCRICAO_ITEM | varchar(120) | — | SCHWEPPES GRAPE FUSION 350ML, GLADE GEL FLORAL PERFECTION | 0% |
| CODIGO_CATEGORIA_ITEM | varchar(3) | — | INA, INA, ASS | 0% |
| DESCRICAO_CATEGORIA_ITEM | varchar(20) | — | Inativos, ACESSORIOS | 0% |
| CODIGO_GRUPO_ITEM | smallint | Sim | 154, 4, 4 | 0% |
| DESCRICAO_GRUPO_ITEM | varchar(30) | — | Bebidas Nao Alcolicas, Acessorios P/ Veiculos | 0% |
| QTD_ESTOQUE | money | Sim | 0.00, 0.00, 3.00 | 0% |
| CODIGO_SUBGRUPO_ITEM | smallint | Sim | 28, 26, 164 | 0% |
| DESCRICAO_SUBGRUPO_ITEM | varchar(30) | — | Refrigerantes, Palhetas Leves | 0% |
| NCM | varchar(10) | — | 22021000, 33074900 | 0% |
| UN | varchar(3) | — | UN, UN | 0% |
| CUSTO_UNIT | money | Sim | 0.00, 0.00, 16.98 | 0% |
| CUSTO_TOTAL | money | Sim | 0.00, 0.00, 50.94 | 0% |
| Estoque | varchar(10) | — | Zerado, Zerado, Positivo | 0% |

---

### TMPBI_MIX_CMM_PONTO_PEDIDO

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| POSTO | varchar(36) | — | 001 - JAM ROTA 1 | 0% |
| ABC | varchar(1) | — | A, A | 0% |
| ABC_Automatico | varchar(1) | — | S, S | 0% |
| Cd_Estab | varchar(3) | — | 001, 001, 001 | 0% |
| Cd_Item | varchar(15) | — | 0100, 0101, 0106 | 0% |
| Cd_SecTrab | int | Sim | -20181217, -20181217 | 0% |
| CMM | money | Sim | 0.00 | 0% |
| CMM_Automatico | varchar(1) | — | S, S | 0% |
| EM | money | Sim | 0.00 | 0% |
| EM_Automatico | varchar(1) | — | S, S | 0% |
| ES | money | Sim | 0.00 | 0% |
| ES_Automatico | varchar(1) | — | S, S | 0% |
| LE | money | Sim | 0.00 | 0% |
| LE_Automatico | varchar(1) | — | S, S | 0% |
| PP | money | Sim | 0.00 | 0% |
| PP_Automatico | varchar(1) | — | S, S | 0% |
| TR | smallint | Sim | 0, 0 | 0% |
| TR_AssumFornec | varchar(1) | — | S, S | 0% |
| LastroQtde | int | Sim | 1, 1 | 0% |
| LastroDias | int | Sim | 7, 7 | 0% |
| SuprDias | int | Sim | 7, 7 | 0% |
| VSINC_Cd_EstabHost | varchar(3) | — | 090, 090 | 0% |
| VSINC_DH | datetime | Sim | 2026-03-02 | 0% |
| VSINC_FlagSinc | varchar(1) | — | NULL | ~100% |

---

### TMPBI_RECEITAS_DESPESAS_DRE

> **Nota:** Mesma estrutura de TMPBI_DESPESAS_DRE. Sem arquivo de dados de exemplo disponível.

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| Dt_Geracao | varchar(100) | — | — | — |
| ESTABELECIMENTO | varchar(3) | — | — | — |
| CD_ESTABORIGEM | varchar(3) | — | — | — |
| Grp1 | varchar(12) | — | — | — |
| DESCRICAO1 | varchar(40) | — | — | — |
| Grp2 | varchar(12) | — | — | — |
| DESCRICAO2 | varchar(40) | — | — | — |
| Grp3 | varchar(12) | — | — | — |
| DESCRICAO3 | varchar(52) | — | — | — |
| CD_GRPFOPER | int | Sim | — | — |
| Grp_Original1 | varchar(12) | — | — | — |
| DESCRICAO_Original1 | varchar(40) | — | — | — |
| Grp_Original2 | varchar(12) | — | — | — |
| DESCRICAO_Original2 | varchar(40) | — | — | — |
| Grp_Original3 | varchar(12) | — | — | — |
| DESCRICAO_Original3 | varchar(52) | — | — | — |
| CD_GRPFOPER_Original | int | Sim | — | — |
| Cd_TipTit | varchar(2) | — | — | — |
| ID_DOCUMORIG | varchar(15) | — | — | — |
| CD_TIPTITORIG | varchar(6) | — | — | — |
| CD_PESSOAORIG | varchar(6) | — | — | — |
| SQ_DOCUMORIG | varchar(6) | — | — | — |
| OBSORIG | varchar(5000) | — | — | — |
| DATAORIG | datetime | Sim | — | — |
| NOME | varchar(40) | — | — | — |
| ANOMES | varchar(7) | — | — | — |
| VALOR | money | Sim | — | — |
| PERC_DESPESAS | money | Sim | — | — |

---

### TMPBI_VENDA_DETALHADA

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| CD_ESTAB | varchar(3) | — | 001, 001, 001 | 0% |
| POSTO | varchar(36) | — | 001 - JAM ROTA 1 | 0% |
| NR_NOTA | int | Sim | 262183, 262184, 262185 | 0% |
| TP_NOTA | varchar(2) | — | CE, CE | 0% |
| PONTO_CAIXA | varchar(5) | — | 001-3, 001-3 | 0% |
| NR_CAIXA | int | Sim | 5133, 5133 | 0% |
| TURNO | varchar(1) | — | 1, 1 | 0% |
| OPERADOR | varchar(12) | — | TIAGO, TIAGO | 0% |
| CFOP | varchar(5) | — | 5405x, 5656X | 0% |
| DATA_EMISSAO | datetime | Sim | 2021-01-01 | 0% |
| DIA_SEMANA | varchar(16) | — | 06-SEXTA-FEIRA | 0% |
| DIA_EMISSAO | int | Sim | 1, 1 | 0% |
| MES_EMISSAO | int | Sim | 1, 1 | 0% |
| ANO_EMISSAO | int | Sim | 2021, 2021 | 0% |
| HORA_COMPLETA_EMISSAO | varchar(8) | — | 06:10:10, 06:11:14 | 0% |
| HORA_HR_EMISSAO | varchar(2) | — | 06, 06 | 0% |
| HORA_HR_MINUTO_EMISSAO | varchar(5) | — | 06:10, 06:11 | 0% |
| NR_VENDA_INTERNO | int | Sim | 12164227, 12164228 | 0% |
| PLACA | varchar(15) | — | " ", 5656X | ~20% |
| KM | int | Sim | 0, 0 | 0% |
| CODIGO_CLIENTE | int | Sim | 1, 1 | 0% |
| NOME_CLIENTE | varchar(40) | — | VENDA A VISTA - CONSUMIDOR | 0% |
| BAIRRO_CLIENTE | varchar(50) | — | NITEROI | 0% |
| CIDADE_CLIENTE | varchar(50) | — | CANOAS | 0% |
| CODIGO_ITEM | varchar(15) | — | 8381, 1, 1 | 0% |
| DESCRICAO_ITEM | varchar(120) | — | CIG DUNHILL CARLTON BOX, GASOLINA COMUM | 0% |
| CODIGO_CATEGORIA_ITEM | varchar(3) | — | TAB, CB | 0% |
| DESCRICAO_CATEGORIA_ITEM | varchar(20) | — | TABACARIA, COMBUSTIVEIS | 0% |
| CODIGO_GRUPO_ITEM | smallint | Sim | 158, 1 | 0% |
| DESCRICAO_GRUPO_ITEM | varchar(30) | — | Tabacaria, Combustíveis | 0% |
| QTD_VENDA | money | Sim | 1.00, 37.49 | 0% |
| VLR_UNIT | money | Sim | 9.25, 4.799 | 0% |
| TOT_VLRITEM | money | Sim | 9.25, 179.91 | 0% |
| VLR_UNIT_REGRA | money | Sim | 9.25, 4.799 | 0% |
| TOT_VLRITEM_REGRA | money | Sim | 9.25, 179.91 | 0% |
| DESCONTO_UNIT | money | Sim | 0.00, 0.00 | 0% |
| ACRESCIMO_UNIT | money | Sim | 0.00, 0.00 | 0% |
| TOT_DESCONTO_UNIT | money | Sim | 0.00, 0.00 | 0% |
| TOT_ACRESCIMO_UNIT | money | Sim | 0.00, 0.00 | 0% |
| QTD_ABASTECIDAS | int | Sim | 0, 1 | 0% |
| BICO | int | Sim | 0, 6 | ~20% |
| BICO_COMBUSTIVEL | varchar(125) | — | NULL, 06 - GASOLINA COMUM | ~20% |
| TANQUE | varchar(125) | — | NULL, 03 - GASOLINA COMUM | ~20% |
| FRENTISTA_IDENT | varchar(30) | — | NULL, ALESSANDRO BORB | ~20% |
| CODIGO_VENDEDOR | int | Sim | 0, 902276 | ~20% |
| NOME_VENDEDOR | varchar(40) | — | NULL, ALESSANDRO BORBA WITICOSKI | ~20% |
| FILTRO_VLR_UNIT_REGRA | varchar(3) | — | NÃO, NÃO | 0% |
| FILTRO_DESCONTO_NOTA | varchar(3) | — | NÃO, NÃO | 0% |
| FILTRO_ACRESCIMO_NOTA | varchar(3) | — | NÃO, NÃO | 0% |
| TIPO_DESCACRES | varchar(27) | — | NULL | ~100% |
| CD_ITEMCB | varchar(15) | — | NULL | ~100% |
| DESCR_ITEMCB | varchar(120) | — | NULL | ~100% |
| CODIGO_SUBGRUPO_ITEM | smallint | Sim | 30, 1 | 0% |
| DESCRICAO_SUBGRUPO_ITEM | varchar(30) | — | Cigarros, Gasolinas | 0% |
| CODIGO_LINHA_ITEM | smallint | Sim | NULL, NULL | ~100% |
| DESCRICAO_LINHA_ITEM | varchar(30) | — | NULL | ~100% |
| CODIGO_SUBLINHA_ITEM | smallint | Sim | NULL, 12 | ~20% |
| DESCRICAO_SUBLINHA_ITEM | varchar(30) | — | NULL, Combustiveis Metas | ~20% |
| CUSTO_UNIT | money | Sim | 7.989, 4.194 | 0% |
| SITUACAO | varchar(9) | — | NORMAL | 0% |
| Cd_Autorizado | varchar(50) | — | NULL | ~100% |
| Autorizado | varchar(50) | — | NULL | ~100% |
| SIT_CAIXA | varchar(7) | — | FECHADO | 0% |
| CD_PACOTE | varchar(5) | — | NULL | ~100% |
| DESCR_PACOTE | varchar(100) | — | NULL | ~100% |
| Cd_Abas | int | Sim | NULL | ~100% |
| Hora_Abst | varchar(8) | — | NULL | ~100% |
| CD_REGRACASHBACK | varchar(5) | — | NULL | ~100% |
| DESCR_REGRACASHBACK | varchar(100) | — | NULL | ~100% |
| QTD_CASHBACK | money | Sim | NULL | ~100% |
| FormasRecebimento | int | Sim | 10455733, 10455731 | 0% |
| ModPag_MaisRelevante | varchar(50) | — | 126, 123 | 0% |
| Descr_ModPag_MaisRelevante | varchar(100) | — | Rec-Caixa Banricompras Prazo, INA Rec-Caixa Master | 0% |
| ModPag_MenosRelevante | varchar(50) | — | NULL | ~100% |
| Descr_ModPag_MenosRelevante | varchar(100) | — | NULL | ~100% |
| UTILIZOUAPP | varchar(3) | — | NÃO | 0% |
| CPF_CNPJ_CLISEMCAD | varchar(14) | — | NULL | ~100% |
| ORIGEMEMISSAO | varchar(50) | — | NULL | ~100% |
| TERMINAL_PDV | int | Sim | NULL | ~100% |

---

### TMPBI_VENDA_DETALHADA_CUSTOS

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| CD_ESTAB | varchar(3) | — | 001, 001, 001 | 0% |
| DT_EMIS | datetime | Sim | 2020-01-06, 2020-07-13, 2020-08-19 | 0% |
| CD_ITEM | varchar(15) | — | 01, 01, 01 | 0% |
| CST_MEDAQUIS | money | Sim | 12.87, 12.83, 13.89 | 0% |
| ID_ES | varchar(2) | — | ET, ET, ET | 0% |
| CD_ENTSAI | int | Sim | 900026107, 900030331, 900030986 | 0% |
| SEQ_ITEM | smallint | Sim | 36, 54, 18 | 0% |

---

### TMP_VENDA_ITEM_VENDEDOR

> **Nota:** Sem arquivo de dados de exemplo disponível.

| Campo | Tipo | Nullable | Exemplos | % Nulos |
|-------|------|----------|----------|---------|
| CD_VENDA | int | Sim | — | — |
| CD_ITEM | varchar(15) | — | — | — |
| Cd_Vendedor | int | Sim | — | — |

---

## Resumo das Tabelas

| Tabela/View | Tipo | Nº Campos | Observações |
|-------------|------|-----------|-------------|
| TBAIR | Tabela Base | 9 | Bairros — lookup geográfico |
| TBOMB | Tabela Base | 21 | Bombas de abastecimento |
| TCATI | Tabela Base | 46 | Categorias de item — controla comportamento fiscal e operacional |
| TCENT | Tabela Base | 9 | Centros de custo e estabelecimentos |
| TCIDA | Tabela Base | 13 | Cidades — lookup geográfico |
| TCLIE | Tabela Base | 338 | Cadastro unificado de clientes/fornecedores/pessoas |
| TESPE | Tabela Base | 15 | Espécies de documento financeiro |
| TESTA | Tabela Base | 93 | Estabelecimentos (filiais/postos) |
| TGRPF | Tabela Base | 22 | Grupos financeiros / plano DRE |
| TGRPI | Tabela Base | 8 | Grupos de item (para classificação de produtos) |
| TITEM | Tabela Base | 250 | Cadastro de itens/produtos — tabela principal |
| TLINI | Tabela Base | 8 | Linhas de item |
| TMODP | Tabela Base | 47 | Modalidades de pagamento |
| TSGrI | Tabela Base | 12 | Subgrupos de item |
| TSLIL | Tabela Base | 8 | Sub-linhas de item |
| TTANQ | Tabela Base | 13 | Tanques de combustível |
| TMPBI_BAIXA_ESTOQUE_DETALHADA | View BI | 36 | Movimentos de baixa de estoque |
| TMPBI_DESPESAS_DRE | View BI | 28 | Despesas para DRE — sem amostra de dados |
| TMPBI_ESTOQUE_DATABASE | View BI | 25 | Snapshot de estoque atual |
| TMPBI_ESTOQUE_MOVIMENTOS_ENTRADAS | View BI | 31 | Entradas de estoque detalhadas |
| TMPBI_ESTOQUE_MOVIMENTOS_EXTRAS | View BI | 27 | Movimentos extras de estoque (balanços, baixas) |
| TMPBI_ESTOQUE_PREVISAO | View BI | 15 | Pedidos e previsão de entrada |
| TMPBI_ESTOQUE_RETROATIVO_DATABASE | View BI | 19 | Snapshot retroativo de estoque |
| TMPBI_MIX_CMM_PONTO_PEDIDO | View BI | 24 | Parâmetros de reposição (CMM, ES, EM, PP) |
| TMPBI_RECEITAS_DESPESAS_DRE | View BI | 28 | Receitas e despesas para DRE — sem amostra |
| TMPBI_VENDA_DETALHADA | View BI | 79 | Vendas detalhadas por item |
| TMPBI_VENDA_DETALHADA_CUSTOS | View BI | 7 | Custo médio por item na venda |
| TMP_VENDA_ITEM_VENDEDOR | View BI | 3 | Relação venda × item × vendedor — sem amostra |