# Inventário WebPosto ERP — API REST

**Fonte:** `files/status/webPosto.docx` (arquivo PDF, 73 páginas)  
**Base URL:** `https://web.qualityautomacao.com.br`  
**Autenticação:** não documentada no PDF (presumivelmente header/token)  
**Paginação:** Respostas de listagem retornam `{ ultimoCodigo, resultados[] }` — usar `ultimoCodigo` como cursor para próxima página.

---

## Índice de Endpoints

| # | Grupo | Método | Path |
|---|-------|--------|------|
| 1 | Aprix | GET | /INTEGRACAO/APRIX_CUSTO |
| 2 | Aprix | GET | /INTEGRACAO/APRIX_MOVIMENTO |
| 3 | Aprix | GET | /INTEGRACAO/APRIX_PRECO_CLIENTE |
| 4 | Pedido Combustível | POST | /INTEGRACAO/PEDIDO_COMBUSTIVEL/CLIENT |
| 5 | Pedido Combustível | POST | /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO |
| 6 | Pedido Combustível | GET | /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id} |
| 7 | Pedido Combustível | DELETE | /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id} |
| 8 | Pedido Combustível | POST | /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id}/DANFE |
| 9 | Pedido Combustível | POST | /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id}/FATURAR |
| 10 | Pedido Combustível | GET | /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id}/XML |
| 11 | Pedido Combustível | GET | /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/STATUS |
| 12 | Pedido Combustível | GET | /INTEGRACAO/PEDIDO_COMBUSTIVEL/PRODUTO |
| 13 | Clientes | GET | /INTEGRACAO/CLIENTE |
| 14 | Clientes | POST | /INTEGRACAO/CLIENTE |
| 15 | Clientes | PUT | /INTEGRACAO/CLIENTE/{id} |
| 16 | Clientes | GET | /INTEGRACAO/CLIENTE_EMPRESA |
| 17 | Clientes | POST | /INTEGRACAO/CLIENTE_PRAZO/{codigoCliente} |
| 18 | Clientes | POST | /INTEGRACAO/CLIENTE_UNIDADE_NEGOCIO |
| 19 | Produtos | GET | /INTEGRACAO/PRODUTO |
| 20 | Produtos | POST | /INTEGRACAO/INCLUIR_PRODUTO |
| 21 | Produtos | PUT | /INTEGRACAO/ALTERAR_PRODUTO/{id} |
| 22 | Produtos | GET | /INTEGRACAO/PRODUTO_EMPRESA |
| 23 | Produtos | GET | /INTEGRACAO/PRODUTO_ESTOQUE |
| 24 | Produtos | POST | /INTEGRACAO/PRODUTO_INVENTARIO |
| 25 | Produtos | GET | /INTEGRACAO/PRODUTO_LMC_LMP |
| 26 | Produtos | GET | /INTEGRACAO/PRODUTO_META |
| 27 | Produtos | GET | /INTEGRACAO/CONSULTAR_SUB_GRUPO_REDE |
| 28 | LMC | GET | /INTEGRACAO/LMC |
| 29 | LMC | GET | /INTEGRACAO/CONSULTAR_LMC_REDE |
| 30 | Venda | GET | /INTEGRACAO/VENDA |
| 31 | Venda | GET | /INTEGRACAO/VENDA/{idList} |
| 32 | Venda | GET | /INTEGRACAO/VENDA_ITEM |
| 33 | Venda | GET | /INTEGRACAO/VENDA_FORMA_PAGAMENTO |
| 34 | Venda | GET | /INTEGRACAO/CONSULTAR_VENDA_ITEM_REDE |
| 35 | Venda | GET | /INTEGRACAO/CONSULTAR_VENDA_FORMA_PAGAMENTO_REDE |
| 36 | Venda | GET | /INTEGRACAO/PLACARES |
| 37 | Usuário | GET | /INTEGRACAO/USUARIO |
| 38 | Usuário | GET | /INTEGRACAO/USUARIO_EMPRESA |
| 39 | Usuário | GET | /INTEGRACAO/CONSULTAR_USUARIO_REDE |
| 40 | Financeiro | GET | /INTEGRACAO/TITULO_RECEBER |
| 41 | Financeiro | PUT | /INTEGRACAO/RECEBER_TITULO |
| 42 | Financeiro | GET | /INTEGRACAO/TITULO_PAGAR |
| 43 | Financeiro | PUT | /INTEGRACAO/RECEBER_CHEQUE |
| 44 | Financeiro | GET | /INTEGRACAO/CHEQUE |
| 45 | Financeiro | GET | /INTEGRACAO/DUPLICATA |
| 46 | Financeiro | GET | /INTEGRACAO/CONSULTAR_DUPLICATA_REDE |
| 47 | Financeiro | GET | /INTEGRACAO/FINANCEIRO_EXCLUSAO |
| 48 | Financeiro | GET | /INTEGRACAO/MOVIMENTO_CONTA |
| 49 | Financeiro | GET | /INTEGRACAO/CONSULTAR_MOVIMENTO_CONTA_REDE |
| 50 | Financeiro | GET | /INTEGRACAO/FORMA_PAGAMENTO |
| 51 | Financeiro | GET | /INTEGRACAO/CONSULTAR_FORMA_PAGAMENTO |
| 52 | Financeiro | GET | /INTEGRACAO/PRAZOS |
| 53 | Financeiro | GET | /INTEGRACAO/VALE_FUNCIONARIO |
| 54 | Financeiro | GET | /INTEGRACAO/CONSULTAR_VALE_FUNCIONARIO_REDE |
| 55 | Financeiro | GET | /INTEGRACAO/CONSULTAR_TITULO_PAGAR_REDE |
| 56 | Estoque | POST | /INTEGRACAO/REAJUSTAR_PRODUTO |
| 57 | Estoque | PUT | /INTEGRACAO/REAJUSTAR_PRODUTO_COMBUSTIVEL |
| 58 | Estoque | GET | /INTEGRACAO/ESTOQUE_PERIODO |
| 59 | Estoque | GET | /INTEGRACAO/CONSULTAR_ESTOQUE_PERIODO |
| 60 | Estoque | GET | /INTEGRACAO/CONTAGEM_ESTOQUE |
| 61 | Nota Fiscal | GET | /INTEGRACAO/NFE_SAIDA |
| 62 | Nota Fiscal | GET | /INTEGRACAO/NFE/{id}/XML |
| 63 | Nota Fiscal | POST | /INTEGRACAO/AUTORIZAR_NFE_SAIDA/{notaCodigo} |
| 64 | Nota Fiscal | GET | /INTEGRACAO/NOTA_SAIDA_ITEM |
| 65 | Nota Fiscal | GET | /INTEGRACAO/NFCE |
| 66 | Nota Fiscal | GET | /INTEGRACAO/NFCE/{id}/XML |
| 67 | Nota Fiscal | GET | /INTEGRACAO/NOTA_SERVICO |
| 68 | Nota Fiscal | GET | /INTEGRACAO/SAT |
| 69 | Nota Fiscal | GET | /INTEGRACAO/CONSULTAR_SAT_REDE |
| 70 | Nota Fiscal | GET | /INTEGRACAO/DFE_XML |
| 71 | Compras | GET | /INTEGRACAO/COMPRA |
| 72 | Compras | GET | /INTEGRACAO/CONSULTAR_COMPRA_REDE |
| 73 | Compras | GET | /INTEGRACAO/COMPRA_ITEM |
| 74 | Compras | GET | /INTEGRACAO/CONSULTAR_COMPRA_ITEM_REDE |
| 75 | Cadastros | GET | /INTEGRACAO/EMPRESAS |
| 76 | Cadastros | GET | /INTEGRACAO/CONSULTAR_EMPRESA |
| 77 | Cadastros | GET | /INTEGRACAO/FUNCIONARIO |
| 78 | Cadastros | GET | /INTEGRACAO/FUNCIONARIO_META |
| 79 | Cadastros | GET | /INTEGRACAO/CONSULTAR_FUNCIONARIO_META_REDE |
| 80 | Cadastros | GET | /INTEGRACAO/FUNCOES |
| 81 | Cadastros | GET | /INTEGRACAO/CONSULTAR_FUNCOES_REDE |
| 82 | Cadastros | GET | /INTEGRACAO/FORNECEDOR |
| 83 | Cadastros | GET | /INTEGRACAO/CONSULTAR_FORNECEDOR_REDE |
| 84 | Cadastros | GET | /INTEGRACAO/GRUPO |
| 85 | Cadastros | GET | /INTEGRACAO/CONSULTAR_GRUPO_REDE |
| 86 | Cadastros | GET | /INTEGRACAO/GRUPO_CLIENTE |
| 87 | Cadastros | POST | /INTEGRACAO/GRUPO_CLIENTE |
| 88 | Cadastros | PUT | /INTEGRACAO/GRUPO_CLIENTE/{id} |
| 89 | Cadastros | GET | /INTEGRACAO/GRUPO_META |
| 90 | Cadastros | GET | /INTEGRACAO/CENTRO_CUSTO |
| 91 | Cadastros | GET | /INTEGRACAO/CONSULTAR_CENTRO_CUSTO_REDE |
| 92 | Cadastros | GET | /INTEGRACAO/ADMINISTRADORA |
| 93 | Cadastros | GET | /INTEGRACAO/CONSULTAR_ADMINISTRADORA |
| 94 | Cadastros | GET | /INTEGRACAO/CONSULTAR_ADMINISTRADORA_REDE |
| 95 | Equipamentos | GET | /INTEGRACAO/BICO |
| 96 | Equipamentos | GET | /INTEGRACAO/CONSULTAR_BICO_REDE |
| 97 | Equipamentos | GET | /INTEGRACAO/BOMBA |
| 98 | Equipamentos | GET | /INTEGRACAO/TANQUE |
| 99 | Equipamentos | GET | /INTEGRACAO/CONSULTAR_TANQUE_REDE |
| 100 | Equipamentos | GET | /INTEGRACAO/PDV |
| 101 | Equipamentos | GET | /INTEGRACAO/CONSULTAR_PDV_REDE |
| 102 | Caixa | GET | /INTEGRACAO/CAIXA |
| 103 | Caixa | GET | /INTEGRACAO/CONSULTAR_CAIXA_REDE |
| 104 | Caixa | GET | /INTEGRACAO/CAIXA_APRESENTADO |
| 105 | Caixa | GET | /INTEGRACAO/CONSULTAR_CAIXA_APRESENTADO_REDE |
| 106 | Abastecimento | GET | /INTEGRACAO/ABASTECIMENTO |
| 107 | Abastecimento | GET | /INTEGRACAO/CONSULTAR_ABASTECIMENTO_REDE |
| 108 | Abastecimento | POST | /INTEGRACAO/AUTORIZA_PAGAMENTO_ABASTECIMENTO |
| 109 | Abastecimento | GET | /INTEGRACAO/CONSULTAR_ANALISE_VENDAS_COMBUSTIVEL |
| 110 | Cartão | GET | /INTEGRACAO/CARTAO |
| 111 | Cartão | POST | /INTEGRACAO/CARTAO |
| 112 | Cartão | DELETE | /INTEGRACAO/CARTAO/{id} |
| 113 | Cartão | GET | /INTEGRACAO/CONSULTAR_CARTAO_REDE |
| 114 | Cartão | GET | /INTEGRACAO/CONSULTAR_CARTOES_CLUBGAS |
| 115 | Preços | POST | /INTEGRACAO/ALTERACAO_PRECO_COMBUSTIVEL |
| 116 | Preços | GET | /INTEGRACAO/TROCA_PRECO |
| 117 | Preços | GET | /INTEGRACAO/CONSULTAR_PRECO_IDENTIFID |
| 118 | Contábil | GET | /INTEGRACAO/PLANO_CONTA_GERENCIAL |
| 119 | Contábil | GET | /INTEGRACAO/CONSULTAR_PLANO_CONTA_GERENCIAL_REDE |
| 120 | Contábil | GET | /INTEGRACAO/PLANO_CONTA_CONTABIL |
| 121 | Contábil | GET | /INTEGRACAO/CONSULTAR_SALDO_PLANO_CONTA_CONTABIL_REDE |
| 122 | Contábil | GET | /INTEGRACAO/LANCAMENTO_CONTABIL |
| 123 | Contábil | GET | /INTEGRACAO/ICMS |
| 124 | Contábil | GET | /INTEGRACAO/PIS_COFINS |
| 125 | Contábil | GET | /INTEGRACAO/CONTA |
| 126 | Contábil | GET | /INTEGRACAO/CONSULTAR_CONTA_REDE |
| 127 | Relatórios | GET | /INTEGRACAO/MAPA_DESEMPENHO |
| 128 | Relatórios | GET | /INTEGRACAO/CONSULTAR_DESPESAS_FINANCEIRO_REDE |
| 129 | Relatórios | GET | /INTEGRACAO/CONSULTAR_FUNCIONARIO_IDENTFID |
| 130 | Relatórios | GET | /INTEGRACAO/CONSUMO_CLIENTE |
| 131 | Outros | GET | /INTEGRACAO/PEDIDO_TRR |
| 132 | Outros | POST | /INTEGRACAO/REVENDEDORES_ANP |
| 133 | Outros | GET | /INTEGRACAO/CNPJ_REDES_PAGPIX |
| 134 | Outros | GET | /INTEGRACAO/CONSULTAR_VIEW |

---

## 1. Aprix

### GET /INTEGRACAO/APRIX_CUSTO
Retorna custo Aprix (integração com distribuidoras de combustível).  
Sem schema de response documentado no PDF.

### GET /INTEGRACAO/APRIX_MOVIMENTO
Retorna movimentos Aprix.  
Sem schema de response documentado no PDF.

### GET /INTEGRACAO/APRIX_PRECO_CLIENTE
Retorna preços Aprix por cliente.  
Sem schema de response documentado no PDF.

---

## 2. Integração Pedido Combustível

### POST /INTEGRACAO/PEDIDO_COMBUSTIVEL/CLIENT
Vincula/consulta dados do cliente para pedido combustível.

**Response — DadosCliente:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| codCliente | integer($int32) | Sim | Código do cliente |
| nomeFantasia | string | Sim | Nome fantasia |
| temLimiteValor | boolean | Sim | Possui limite em R$ |
| limiteValor | number | Não | Valor do limite |
| disponivelValor | number | Não | Disponível em R$ |
| temLimiteLitros | boolean | Sim | Possui limite em litros |
| limiteLitros | number | Não | Limite em litros |
| disponivelLitros | number | Não | Disponível em litros |
| suspenso | boolean | Sim | Cliente suspenso |

### POST /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO
Cria novo pedido de combustível.

**Request Body — IntegracaoPedidoCombustivelPedido:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| empresaCodigo | integer($int32) | Sim | Código da empresa |
| clienteCodigo | integer($int32) | Sim | Código do cliente |
| prazoCodigo | integer($int32) | Sim | Código do prazo |
| data | string($date) | Sim | Data do pedido |
| itens | [IntegracaoPedidoCombustivelPedidoItem] | Sim | Itens do pedido |

**IntegracaoPedidoCombustivelPedidoItem:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| produtoCodigo | integer($int32) | Sim |
| quantidade | number($double) | Sim |
| valor | number($double) | Sim |

**Response — RetornoPedido:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| codigo | integer($int32) | Sim |
| situacao | string | Sim |

### GET /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id}
Consulta pedido de combustível por ID.  
**Response:** IntegracaoPedidoCombustivelPedido (schema acima)

### DELETE /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id}
Cancela pedido de combustível.

### POST /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id}/DANFE
Emite DANFE do pedido.

### POST /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id}/FATURAR
Fatura pedido de combustível.

**Request Body — IntegracaoPedidoCombustivelFaturar:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| cartoes | [IntegracaoPedidoCombustivelCartao] | Sim |

**IntegracaoPedidoCombustivelCartao:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| cartaoCodigo | integer($int32) | Sim |
| valor | number($double) | Sim |

### GET /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/{id}/XML
Retorna XML NF-e do pedido.  
**Response:** XML (text/xml)

### GET /INTEGRACAO/PEDIDO_COMBUSTIVEL/PEDIDO/STATUS
Consulta status de pedidos.

**Response — RetornoConsultarPedido:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| situacao | string | Sim |

### GET /INTEGRACAO/PEDIDO_COMBUSTIVEL/PRODUTO
Lista produtos disponíveis para pedido de combustível.

**Response — ProdutoCombustivel:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| codProduto | integer($int32) | Sim |
| referencia | string | Sim |
| descricao | string | Sim |

---

## 3. Clientes

### GET /INTEGRACAO/CLIENTE
Lista clientes paginado.

**Response — RetornoPaginadoClienteRede → [ClienteRede]:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| clienteCodigo | integer($int32) | Sim | PK interno |
| clienteReferencia | string | Sim | Código de referência |
| razao | string | Sim | Razão social |
| fantasia | string | Sim | Nome fantasia |
| cnpjCpf | string | Sim | CNPJ ou CPF |
| dataCadastro | string($date) | Sim | Data do cadastro |
| cidade | string | Sim | Cidade |
| codigoCidade | integer($int32) | Sim | Código IBGE da cidade |
| numero | string | Não | Número do endereço |
| logradouro | string | Não | Logradouro |
| tipoLogradouro | string | Não | Tipo (Rua, Av, etc.) |
| uf | string | Sim | Estado |
| usaLimiteLitros | boolean | Sim | Controla limite em litros |
| limiteLitros | number($double) | Sim | Limite em litros |
| usaLimiteReais | boolean | Sim | Controla limite em R$ |
| limiteReais | number($double) | Sim | Limite em R$ |
| bloqueado | boolean | Sim | Cliente bloqueado |
| ultimoUsuarioAlteracao | string | Sim | Último usuário que alterou |
| clienteGrupoCodigo | integer($int32) | Sim | Grupo de cliente |
| clienteCodigoExterno | string | Não | Código no sistema externo |
| telafone | string | Não | Telefone (typo na API) |
| celular | string | Não | Celular |
| outroTelefone | string | Não | Outro telefone |
| observacoes | string | Não | Observações |
| centroCustoVeiculo | [CentroCustoCliente] | Sim | Centros de custo (veículos) |
| clienteContato | [ClienteInfo] | Sim | Contatos |
| codigo | integer($int32) | Sim | Código interno (cursor) |

**CentroCustoCliente:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| descricao | string | Sim |
| ativo | boolean | Sim |

**ClienteInfo:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| contato | string | Sim |
| setor | string | Sim |
| email | string | Não |
| telefone | string | Não |
| celular | string | Não |
| aniversario | string($date) | Não |
| recebeEmail | boolean | Sim |

### POST /INTEGRACAO/CLIENTE
Cadastra novo cliente.

**Request Body — IntegracaoClienteCadastro:**

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| cnpjCpf | string | Sim | |
| rg | string | Não | |
| nomeFantasia | string | Sim | |
| tipoInscricaoEstadual | integer($int32) | Sim | 1–3 |
| inscricaoEstadual | string | Não | |
| razaoSocial | string | Sim | |
| tipoPessoa | string | Sim | F ou J |
| enderecoTipoLogradouro | string | Sim | |
| enderecoLogradouro | string | Sim | |
| enderecoNumero | string | Sim | |
| enderecoComplemento | string | Não | |
| enderecoBairro | string | Não | |
| enderecoCidade | string | Sim | |
| enderecoUf | string | Sim | |
| enderecoCep | string | Não | |
| clienteCodigoExterno | string | Não | |
| clienteSuspenso | boolean | Não | |
| motivoClienteSuspenso | string | Não | |
| clienteLimite | boolean | Não | |
| valorClienteLimite | number($double) | Não | |
| valorClienteLimiteDisponivel | number($double) | Não | |
| exigeCentroCusto | boolean | Sim | |
| documentosEmitidos | integer($int32) | Não | -1=TODOS, 1=NFE, 2=NFCE |
| grupoCodigo | integer($int32) | Não | |
| centrosCustoCliente | [CentroCustoCliente] | Sim | |

**Response — RetornoCadastroCliente:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| codigo | integer($int32) | Sim |

### PUT /INTEGRACAO/CLIENTE/{id}
Altera cliente existente.  
**Request Body:** IntegracaoClienteCadastro (idem POST)

### GET /INTEGRACAO/CLIENTE_EMPRESA
Lista vínculos cliente–empresa.

**Response — RetornoPaginadoClienteEmpresaRede → [ClienteEmpresaRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| clienteCodigo | integer($int32) | Sim |
| ativoInativo | boolean | Sim |
| usaPrazo | boolean | Sim |
| codigo | integer($int32) | Sim |

### POST /INTEGRACAO/CLIENTE_PRAZO/{codigoCliente}
Associa prazo ao cliente.

**Request Body — InegracaoClientePrazo:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| prazoCodigo | integer($int32) | Sim |
| empresaCodigo | integer($int32) | Sim |

### POST /INTEGRACAO/CLIENTE_UNIDADE_NEGOCIO
Vincula cliente a unidade de negócio.

**Request Body — VincularClienteUnidadeNegocio:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| clienteCodigo | integer($int32) | Sim |
| empresaCodigo | integer($int32) | Sim |
| ativo | boolean | Sim |

---

## 4. Produtos

### GET /INTEGRACAO/PRODUTO
Lista produtos paginado.

**Response — RetornoPaginadoProdutoRede → [ProdutoRede]:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| produtoCodigo | integer($int32) | Sim | PK interno |
| nome | string | Sim | Nome do produto |
| referenciaCodigo | string | Sim | Código de referência |
| grupoCodigo | integer($int32) | Sim | Grupo |
| combustivel | boolean | Sim | É combustível |
| produtoLmcCodigo | integer($int32) | Não | Código LMC |
| tipoCombustivel | string | Não | Tipo de combustível |
| unidadeCompra | string | Sim | Unidade de compra |
| unidadeVenda | string | Sim | Unidade de venda |
| subGrupo1Codigo | integer($int32) | Não | Sub-grupo 1 |
| subGrupo2Codigo | integer($int32) | Não | Sub-grupo 2 |
| subGrupo3Codigo | integer($int32) | Não | Sub-grupo 3 |
| tipoProduto | string | Sim | C/P/U/I/O/S/K/8 |
| produtoCodigoExterno | string | Não | Código externo |
| tributacaoAdRem | number($double) | Sim | Tributação ad rem |
| descricaoFabricante | string | Não | Descrição do fabricante |
| registraInventario | string | Não | |
| ncm | string | Não | NCM fiscal |
| cest | string | Não | CEST |
| misturaBioCombustivel | number($double) | Não | % mistura biocombustível |
| produtoCodigoBarra | [CodigoBarras] | Sim | Códigos de barras |
| codigo | integer($int32) | Sim | Cursor de paginação |

### POST /INTEGRACAO/INCLUIR_PRODUTO
Cadastra novo produto.

**Request Body — IntegracaoProdutoCadastro:**

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| descricao | string | Sim | |
| descricaoResumida | string | Sim | |
| tipoProduto | string | Sim | C\|P\|U\|I\|O\|S\|K\|8 |
| grupoCodigo | integer($int32) | Sim | |
| codigoExterno | string | Não | |
| unidadeCompra | string | Sim | máx 6 chars |
| unidadeVenda | string | Sim | máx 6 chars |
| iat | string | Sim | A=Arredondamento, T=Truncamento |
| ippt | string | Sim | P=Própria, T=Terceiro |
| naturezaReceitaCodigo | string | Não | máx 3, ex: 101 |
| precoCusto | number($double) | Sim | mín 0 |
| precoCompra | number($double) | Sim | mín 0 |
| precoVenda | number($double) | Sim | mín 0 |
| centroCustoCodigo | integer($int32) | Não | |
| ativo | boolean | Não | |
| codigoAnp | string | Não | Obrigatório p/ combustível |
| codigoProdutoLmc | integer($int32) | Não | Obrigatório p/ combustível |
| codigoBarras | string | Não | |
| tributoIcms | IntegracaoProdutoTributoIcms | Não | Ver schema |
| percentualIcmsSaida | number($double) | Sim | |
| cstSaida | string | Sim | máx 3, ex: 060 |
| percentualIcmsEntrada | number($double) | Sim | |
| cstEntrada | string | Sim | máx 3 |
| dsCsosnEntrada | string | Sim | máx 3, ex: 500 |
| dsCsosnSaida | string | Sim | máx 3 |
| valorPercentualFcp | number($double) | Sim | |
| fatorReducaoBaseIcmsDe | number($double) | Não | nullable |
| fatorReducaoBaseIcms | number($double) | Não | nullable |
| fatorReducaoBaseIcmsSt | number($double) | Não | nullable (2x: entrada e saída) |
| tributoPisCofins | IntegracaoProdutoTributoPisConfins | Não | Ver schema |
| codigoNcm | string | Sim | máx 8 |
| codigoCest | string | Não | máx 7 |
| permiteVendaEstoqueNegativo | boolean | Sim | |
| produtoVendeFracionado | boolean | Sim | |
| utilizaCodigoBarras | boolean | Sim | |
| utilizaBalanca | boolean | Sim | |
| cdCfopSaida | string | Não | ex: 5.405 ou 6.405 |
| cdCfopEntrada | string | Não | ex: 1.403 ou 2.403 |
| TributacaoMonofasica | number($double) | Sim | nullable |

**IntegracaoProdutoTributoIcms:**

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| percentualIcmsSaida | number($double) | Sim | |
| cstSaida | string | Sim | máx 3, ex: 060 |
| percentualIcmsEntrada | number($double) | Sim | |
| cstEntrada | string | Sim | máx 3 |
| dsCsosnEntrada | string | Sim | máx 3 |
| dsCsosnSaida | string | Sim | máx 3 |
| valorPercentualFcp | number($double) | Sim | |
| fatorReducaoBaseIcmsDe | number($double) | Não | nullable |
| fatorReducaoBaseIcms | number($double) | Não | nullable |
| fatorReducaoBaseIcmsSt | number($double) | Não | nullable (x2) |

**IntegracaoProdutoTributoPisConfins:**

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| percentualCofinsEntrada | number($double) | Sim | 7.6 |
| percentualBaseCalculoCofinsEntrada | number($double) | Sim | 100 |
| cstCofinsEntrada | string | Sim | 50 |
| percentualCofinsSaida | number($double) | Sim | 7.6 |
| percentualBaseCalculoCofinsSaida | number($double) | Sim | 100 |
| cstCofinsSaida | string | Sim | 01 |
| percentualPisEntrada | number($double) | Sim | 1.65 |
| percentualBaseCalculoPisEntrada | number($double) | Sim | 100 |
| cstPisEntrada | string | Sim | 50 |
| percentualPisSaida | number($double) | Sim | 1.65 |
| percentualBaseCalculoPisSaida | number($double) | Sim | 100 |
| cstPisSaida | string | Sim | 01 |

**Response — RetornoCadastroProduto:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| codigo | integer($int32) | Sim |

### PUT /INTEGRACAO/ALTERAR_PRODUTO/{id}
Altera produto existente. **Request Body:** IntegracaoProdutoCadastro

### GET /INTEGRACAO/PRODUTO_EMPRESA
Lista produtos por empresa com preços e estoque.

**Response — RetornoPaginadoProdutoEmpresaRede → [ProdutoEmpresaRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| precoVenda | number($double) | Sim |
| precoVendaB | number($double) | Sim |
| precoVendaC | number($double) | Sim |
| precoCusto | number($double) | Sim |
| estoqueQtde | number($double) | Sim |
| estoqueMin | number($double) | Sim |
| ultimoUsuarioAlteracao | string | Sim |
| produtoLmcCodigo | integer($int32) | Não |
| ativo | boolean | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/PRODUTO_ESTOQUE
Lista estoque de produtos por local.

**Response — RetornoPaginadoProdutoEstoque → [ProdutoEstoque]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| saldo | number($double) | Sim |
| saldoEstoque | [SaldoEstoque] | Não | 
| codigo | integer($int32) | Sim |

**SaldoEstoque:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| estoqueCodigo | integer($int32) | Sim |
| estoqueNome | string | Sim |
| quantidade | number($double) | Sim |

### POST /INTEGRACAO/PRODUTO_INVENTARIO
Registra inventário de produtos (contagem de estoque).

**Request Body — ProdutoInventario:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| estoqueCodigo | integer($int32) | Sim |
| dataInventario | string($date) | Sim |
| itens | [ProdutoInventarioItens] | Sim |

**ProdutoInventarioItens:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| produtoCodigo | integer($int32) | Sim |
| quantidade | number($double) | Sim |

### GET /INTEGRACAO/PRODUTO_LMC_LMP
Lista produtos com código LMC/LMP.

**Response — [RetornoProdutoLmc]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| produtoLmcCodigo | integer($int32) | Sim |
| sequencia | integer($int32) | Sim |
| descricao | string | Sim |
| tipoCombustivel | string | Sim |
| geraLmcLmp | string | Sim |

### GET /INTEGRACAO/PRODUTO_META
Lista metas por produto.

**Response — RetornoPaginadoProdutoMeta → [ProdutoMeta]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| grupoMetaCodigo | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/CONSULTAR_SUB_GRUPO_REDE
Lista sub-grupos de produtos (3 níveis hierárquicos).

**Response — [ProdutoSubGrupo1]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| subGrupoCodigo | integer($int32) | Sim |
| descricao | string | Sim |
| grupoCodigo | integer($int32) | Sim |
| produtoSubGrupo2 | [ProdutoSubGrupo2] | Sim |

**ProdutoSubGrupo2:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| subGrupoCodigo | integer($int32) | Sim |
| descricao | string | Sim |
| produtoSubGrupo3 | [ProdutoSubGrupo3] | Sim |

**ProdutoSubGrupo3:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| subGrupoCodigo | integer($int32) | Sim |
| descricao | string | Sim |

---

## 5. LMC

### GET /INTEGRACAO/LMC
Lista Livro de Movimentação de Combustíveis paginado.

**Response — RetornoPaginadoLmcRede → [LmcRede]:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| empresaCodigo | integer($int32) | Sim | |
| lmcCodigo | integer($int32) | Sim | |
| produtoCodigo | [integer($int32)] | Sim | Lista de produtos |
| dataMovimento | string($date) | Sim | |
| abertura | number($double) | Sim | Estoque abertura |
| entrada | number($double) | Sim | Volume recebido |
| saida | number($double) | Sim | Volume vendido |
| perdaSobra | number($double) | Sim | Perda ou sobra |
| escritural | number($double) | Sim | Estoque escritural |
| fechamento | number($double) | Sim | Estoque fechamento |
| disponivel | number($double) | Sim | Volume disponível |
| ultimoUsuarioAlteracao | string | Sim | |
| saldo | number($double) | Sim | |
| precoCusto | number($double) | Sim | |
| produtoLmcCodigo | integer($int32) | Não | |
| codigo | integer($int32) | Sim | Cursor |
| lmcTanque | [LmcRedeTanque] | Sim | Por tanque |
| lmcBico | [LmcRedeBico] | Sim | Por bico |
| lmcNota | [LmcRedeNota] | Sim | Notas de entrada |

**LmcRedeTanque:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| lmcTanqueCodigo | integer($int32) | Sim |
| tanqueCodigo | integer($int32) | Sim |
| abertura | number($double) | Sim |
| escritural | number($double) | Sim |
| fechamento | number($double) | Sim |

**LmcRedeBico:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| lmcBicoCodigo | integer($int32) | Sim |
| bicoCodigo | integer($int32) | Sim |
| tanqueCodigo | integer($int32) | Sim |
| bombaCodigo | integer($int32) | Sim |
| abertura | number($double) | Sim |
| fechamento | number($double) | Sim |
| afericao | number($double) | Sim |
| venda | number($double) | Sim |

**LmcNotaTanque (nota de entrada no LMC):**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| compraCodigo | integer($int32) | Sim |
| numeroNota | string | Sim |
| dataEntrada | string($date) | Sim |
| volumeRecebido | number($double) | Sim |
| tanqueCodigo | integer($int32) | Sim |

### GET /INTEGRACAO/CONSULTAR_LMC_REDE
Consulta LMC pela rede (endpoint alternativo com mesmo schema).

---

## 6. Venda

### GET /INTEGRACAO/VENDA
Lista vendas paginado.

**Response — RetornoPaginadoVendasRede → [VendaRede]:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| vendaCodigo | integer($int32) | Sim | |
| empresaCodigo | integer($int32) | Sim | |
| clienteCodigo | integer($int32) | Sim | |
| dataMovimento | string($date) | Sim | |
| dataHoraMovimento | string($date-time) | Sim | |
| turno | integer($int32) | Sim | |
| caixaCodigo | integer($int32) | Sim | |
| valorBruto | number($double) | Sim | |
| valorLiquido | number($double) | Sim | |
| desconto | number($double) | Sim | |
| acrescimo | number($double) | Sim | |
| cheque | number($double) | Sim | |
| dinheiro | number($double) | Sim | |
| troco | number($double) | Sim | |
| adiantamento | number($double) | Sim | |
| cartao | number($double) | Sim | |
| fornecedorCodigo | integer($int32) | Sim | |
| planoContaGerencialCodigo | integer($int32) | Sim | |
| descricao | string | Sim | |
| numeroTitulo | string | Sim | |
| nomeFornecedor | string | Não | |
| cpfCnpjFornecedor | string | Não | |
| troco (obj) | [Troco] | Não | Detalhamento do troco |
| itens | [VendaItemRede] | Sim | Itens da venda |
| formaPagamento | [VendasFormaPagamentoRede] | Sim | Formas de pagamento |
| codigo | integer($int32) | Sim | Cursor |

**Troco:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| dinheiro | number($double) | Sim |
| adiantamento | number($double) | Sim |

### GET /INTEGRACAO/VENDA/{idList}
Consulta venda(s) por lista de IDs.

### GET /INTEGRACAO/VENDA_ITEM
Lista itens de venda paginado.

**Response — RetornoPaginadoVendaItemRede → [VendaItemRede]:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| empresaCodigo | integer($int32) | Sim | |
| vendaCodigo | integer($int32) | Sim | |
| vendaItemCodigo | integer($int32) | Sim | |
| produtoCodigo | integer($int32) | Sim | |
| quantidade | number($double) | Sim | |
| valorUnitario | number($double) | Sim | |
| valorTotal | number($double) | Sim | |
| desconto | number($double) | Sim | |
| acrescimo | number($double) | Sim | |
| funcionarioCodigo | integer($int32) | Sim | Frentista |
| dataMovimento | string($date) | Sim | |
| dataHoraMovimento | string($date-time) | Sim | |
| clienteCodigo | integer($int32) | Sim | |
| clienteCpfCnpj | string | Sim | |
| prazoCodigo | integer($int32) | Sim | |
| bcIcms | number($double) | Sim | |
| aliqIcms | number($double) | Sim | |
| valorIcms | number($double) | Sim | |
| cstIcms | string | Sim | |
| bcPis | number($double) | Sim | |
| aliqPis | number($double) | Sim | |
| valorPis | number($double) | Sim | |
| cstPis | string | Sim | |
| bcCofins | number($double) | Sim | |
| aliqCofins | number($double) | Sim | |
| valorCofins | number($double) | Sim | |
| cstCofins | string | Sim | |
| cfop | string | Sim | |
| ncm | string | Sim | |
| tipoVenda | string | Sim | |
| centroCustoCodigo | integer($int32) | Sim | |
| vendaItemCancelado | boolean | Sim | |
| precoVenda | number($double) | Sim | Preço tabela A |
| precoVendaB | number($double) | Sim | Preço tabela B |
| precoVendaC | number($double) | Sim | Preço tabela C |
| codigo | integer($int32) | Sim | Cursor |

### GET /INTEGRACAO/VENDA_FORMA_PAGAMENTO
Lista formas de pagamento por venda.

**Response — RetornoPaginadoVendaFormaPagamentos → [VendasFormaPagamentoRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| vendaCodigo | integer($int32) | Sim |
| formaPagamentoCodigo | integer($int32) | Sim |
| valor | number($double) | Sim |
| empresaCodigo | integer($int32) | Sim |
| dataMovimento | string($date) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/PLACARES
Relatório de desempenho/placar de vendas por produto e atendente.

**Response — [Placares]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| cnpj | string | Sim |
| atendentenome | string | Sim |
| grupodescricao | string | Sim |
| seriefiscal | string | Sim |
| produtodescricao | string | Sim |
| produtoid | string | Sim |
| atendenteid | string | Sim |
| grupoid | string | Sim |
| totalLiquido | number($double) | Sim |
| quantidade | number($double) | Sim |
| datavenda | string | Sim |

---

## 7. Usuário

### GET /INTEGRACAO/USUARIO
Lista usuários paginado.

**Response — RetornoPaginadoUsuarioRede → [UsuarioRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| usuarioCodigo | integer($int32) | Sim |
| nome | string | Sim |
| login | string | Sim |
| ativo | boolean | Sim |
| ultimoUsuarioAlteracao | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/USUARIO_EMPRESA
Lista vínculos usuário–empresa.

**Response — RetornoPaginadoUsuarioEmpresaRede → [UsuarioEmpresaRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| usuarioCodigo | integer($int32) | Sim |
| empresaCodigo | integer($int32) | Sim |
| perfil | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/CONSULTAR_USUARIO_REDE
Endpoint alternativo para consulta de usuários (mesmo schema).

---

## 8. Financeiro — Títulos a Receber

### GET /INTEGRACAO/TITULO_RECEBER
Lista títulos a receber paginado.

**Response — RetornoPaginadoTituloReceberRede → [TituloReceberRede]:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| empresaCodigo | integer($int32) | Sim | |
| tituloCodigo | integer($int32) | Sim | |
| vendaCodigo | integer($int32) | Sim | |
| clienteCodigo | integer($int32) | Sim | |
| valor | number($double) | Sim | |
| valorRecebido | number($double) | Sim | |
| valorPendente | number($double) | Sim | |
| dataMovimento | string($date) | Sim | |
| vencimento | string($date) | Sim | |
| pendente | boolean | Sim | |
| numeroDocumento | string | Sim | |
| nomeCliente | string | Não | |
| cpfCnpjCliente | string | Não | |
| planoContaGerencialCodigo | integer($int32) | Sim | |
| centroCustoCodigo | integer($int32) | Sim | |
| hierarquiaPlanoConta | string | Sim | |
| tipoInclusao | string | Sim | |
| codigo | integer($int32) | Sim | Cursor |

### PUT /INTEGRACAO/RECEBER_TITULO
Baixa título a receber.

**Request Body — IntegracaoReceberTitulo:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| listaVenda | [integer($int32)] | Sim |
| contaCodigo | integer($int32) | Sim |
| dataRecebimento | string($date) | Sim |

### GET /INTEGRACAO/DUPLICATA / GET /INTEGRACAO/CONSULTAR_DUPLICATA_REDE
Lista duplicatas paginado.

**Response — RetornoPaginadoDuplicataRede → [DuplicataRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| duplicataCodigo | integer($int32) | Sim |
| dataPagamento | string($date) | Não |
| valorPago | number | Sim |
| pendente | boolean | Sim |
| dataMovimento | string($date) | Sim |
| vencimento | string($date) | Sim |
| clienteCodigo | integer($int32) | Sim |
| valorDuplicata | number($double) | Sim |
| situacao | string | Sim |
| valorAcrescimo | number($double) | Sim |
| valorDesconto | number($double) | Sim |
| valorLiquido | number($double) | Sim |
| numeroDocumento | string | Sim |
| nomeCliente | string | Não |
| cpfCnpjCliente | string | Não |
| pagamento | [TituloReceberPagamentos] | Sim |
| remessaBoleto | string | Não |
| hierarquiaPlanoConta | string | Não |
| codigo | integer($int32) | Sim |

**TituloReceberPagamentos:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| recebimentoCodigo | integer($int32) | Sim |
| tipo | string | Sim |
| detalhe | string | Não |
| valor | number($double) | Sim |
| dataRecebimento | string($date) | Sim |

---

## 9. Financeiro — Títulos a Pagar

### GET /INTEGRACAO/TITULO_PAGAR / GET /INTEGRACAO/CONSULTAR_TITULO_PAGAR_REDE
Lista títulos a pagar paginado.

**Response — RetornoPagiandoTituloPagarRede → [TituloPagarRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| tituloCodigo | integer($int32) | Sim |
| vencimento | string($date) | Sim |
| dataPagamento | string($date) | Não |
| valor | number($double) | Sim |
| desconto | number($double) | Sim |
| acrescimo | number($double) | Sim |
| cheque | number($double) | Sim |
| dinheiro | number($double) | Sim |
| troco | number($double) | Sim |
| adiantamento | number($double) | Sim |
| cartao | number($double) | Sim |
| fornecedorCodigo | integer($int32) | Sim |
| planoContaGerencialCodigo | integer($int32) | Sim |
| descricao | string | Sim |
| numeroTitulo | string | Sim |
| nomeFornecedor | string | Não |
| cpfCnpjFornecedor | string | Não |
| pagamento | [TituloPagarPagamentos] | Sim |
| numeroRemessa | integer($int32) | Não |
| planoContaGerencialNivel | string | Sim |
| planoContaGerencialDescricao | string | Sim |
| centroCustoCodigo | integer($int32) | Sim |
| centroCustoDescricao | string | Sim |
| codigo | integer($int32) | Sim |

**TituloPagarPagamentos:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| pagamentoCodigo | integer($int32) | Sim |
| tipo | string | Sim |
| detalhe | string | Sim |
| valor | number($double) | Sim |
| dataPagamento | string($date) | Sim |

---

## 10. Financeiro — Cheques e Outros

### GET /INTEGRACAO/CHEQUE
Lista cheques paginado.

**Response — RetornoPaginadoChequeRede → [ChqueRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| chequeCodigo | integer($int32) | Sim |
| vendaCodigo | integer($int32) | Sim |
| dataMovimento | string($date) | Sim |
| bomPara | string($date) | Sim |
| dataPagamento | string($date) | Não |
| valor | number($double) | Sim |
| codigoBanco | string | Sim |
| banco | string | Sim |
| agencia | string | Sim |
| contaCheque | string | Não |
| emitente | string | Sim |
| cpfCnpjEmitente | string | Sim |
| clienteCodigo | integer($int32) | Sim |
| devolvido | boolean | Sim |
| alinea | string | Não |
| tipoInclusao | string | Sim |
| pendente | boolean | Sim |
| numeroCheque | string | Não |
| codigo | integer($int32) | Sim |

### PUT /INTEGRACAO/RECEBER_CHEQUE
Baixa cheque.

**Request Body — IntegracaoReceberCheque:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| vendas | [integer($int32)] | Sim |
| contaCodigo | integer($int32) | Sim |
| dataRecebimento | string($date) | Sim |

### GET /INTEGRACAO/FINANCEIRO_EXCLUSAO
Lista exclusões financeiras (títulos/movimentos excluídos). Atenção: se configuração ativa, gera 2 registros por exclusão.

**Response — RetornoPaginadoFinanceiroExclusao → [FinanceiroExclusao]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| codigoDocumentoOrigem | integer($int32) | Sim |
| valor | number($double) | Sim |
| tipo | string | Sim | Enum[9 valores] |
| dataExclusao | string($date-time) | Sim |
| usuarioExclusao | integer($int32) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/MOVIMENTO_CONTA / GET /INTEGRACAO/CONSULTAR_MOVIMENTO_CONTA_REDE
Lista movimentos de conta bancária paginado.

**Response — RetornoPaginadoMovimentoConta → [MovimentoConta]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| movimentoContaCodigo | integer($int32) | Sim |
| valor | number($double) | Sim |
| dataMovimento | string($date) | Sim |
| descricao | string | Sim |
| tipoDocumentoOrigem | string | Sim |
| documentoOrigemCodigo | integer($int32) | Sim |
| tipo | string | Sim |
| conciliado | boolean | Sim |
| evento | string($date-time) | Sim |
| saldo | number($double) | Não |
| contaCodigo | integer($int32) | Sim |
| planoContaGerencialCodigo | integer($int32) | Não |
| centroCustoCodigo | integer($int32) | Não |
| documento | string | Não |
| lote | string | Não |
| daraHoraConciliacao | string($date-time) | Não |
| usuarioConciliacao | string | Não |
| codigoPessoa | integer($int32) | Não |
| tipoPessoa | string | Não |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/FORMA_PAGAMENTO / GET /INTEGRACAO/CONSULTAR_FORMA_PAGAMENTO
Lista formas de pagamento cadastradas.

**Response — RetornoPaginadoFormaPagamentoRede → [FormaPagamentoRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| formaPagamentoCodigo | integer($int32) | Sim |
| nome | string | Sim |
| diasVencimento | integer($int32) | Sim |
| tipo | string | Sim |
| ultimoUsuarioAlteracao | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/PRAZOS
Lista prazos de pagamento cadastrados.

**Response — [RetornoPrazos]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| prazoCodigo | integer($int32) | Sim |
| prazoCodigoExterno | string | Não |
| referencia | string | Não |
| descricao | string | Não |
| dias | integer($int32) | Não |
| fechamentoSemanal | integer($int32) | Não |
| diasBloqueio | integer($int32) | Não |
| perMaxTroco | number($double) | Não |
| ativo | string | Não |
| precoEspecial | string | Não |
| tipoRecebimento | string | Não |
| formaRecebimento | string | Não |

### GET /INTEGRACAO/VALE_FUNCIONARIO / GET /INTEGRACAO/CONSULTAR_VALE_FUNCIONARIO_REDE
Lista vales de funcionários.

**Response — RetornoPaginadoValeFuncionarioRede → [ValeFucionarioRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| valeCodigo | integer($int32) | Sim |
| funcionarioCodigo | integer($int32) | Sim |
| valor | number($double) | Sim |
| dataMovimento | string($date) | Sim |
| descricao | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/CONTA / GET /INTEGRACAO/CONSULTAR_CONTA_REDE
Lista contas bancárias.

**Response — RetornoPaginadoContaRede → [ContaRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| contaCodigo | integer($int32) | Sim |
| descricao | string | Sim |
| saldoAtual | number($double) | Sim |
| ativo | boolean | Sim |
| codigo | integer($int32) | Sim |

---

## 11. Estoque

### POST /INTEGRACAO/REAJUSTAR_PRODUTO
Reajusta estoque de produto não-combustível.

**Request Body — AjusteEstoqueProduto:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| quantidade | number($double) | Sim |
| motivo | string | Sim |

### PUT /INTEGRACAO/REAJUSTAR_PRODUTO_COMBUSTIVEL
Reajusta estoque escritural de tanques de combustível.

**Request Body — ReajustarProdutoCombustivel:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| tanques | [ReajustarProdutoCombustivelItens] | Sim | Lista de tanques |

**ReajustarProdutoCombustivelItens:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| tanqueCodigo | integer($int32) | Sim | Código do tanque |
| estoqueEscritural | number($double) | Sim | Valor atual do estoque |

### GET /INTEGRACAO/ESTOQUE_PERIODO / GET /INTEGRACAO/CONSULTAR_ESTOQUE_PERIODO
Lista fechamentos de estoque por período.

**Response — RetornoPaginadoEstoqueFechamento → [EstoqueFechamento]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| codigoProduto | integer($int32) | Sim |
| codigoUnidadeNegocio | integer($int32) | Sim |
| quatidadeEstoque | number($double) | Sim |
| dataMovimento | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/CONTAGEM_ESTOQUE
Lista contagens de estoque paginado.

**Response — RetornoPaginadoContagemEstoqueRede → [ContagemEstoqueRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| contagemReferencia | integer($int32) | Sim |
| contagemCodigo | integer($int32) | Sim |
| unidadeNegocio | integer($int32) | Sim |
| dataHoraAlteracao | string($date-time) | Não |
| descContagem | string | Sim |
| usuarioCodigo | integer($int32) | Sim |
| emContagemColetor | boolean | Sim |
| estoqueCodigo | integer($int32) | Sim |
| dataHoraCriacao | string($date-time) | Sim |
| dataHoraEstoqueContagem | string($date-time) | Sim |
| tipoContagem | string | Sim |
| contagemRetroativa | boolean | Sim |
| obsContagem | string | Não |
| contagemNotas | [ContagemNotaRede] | Sim |
| codigo | integer($int32) | Sim |

**ContagemNotaRede:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| notaCodigo | integer($int32) | Sim |
| tipoMovimento | string | Sim |
| movimentouSemNota | boolean | Sim |
| contagemItens | [ContagemItemRede] | Sim |

**ContagemItemRede:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| produtoCodigo | integer($int32) | Sim |
| quantidadeAnterior | number($double) | Sim |
| quantidadeContagem | number($double) | Sim |

---

## 12. Nota Fiscal

### GET /INTEGRACAO/NFE_SAIDA
Lista notas fiscais de saída (NF-e) paginado.

**Response — RetornoPaginadoNotaSaidaRede → [NotaSaidaRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| notaCodigo | integer($int32) | Sim |
| empresaCodigo | integer($int32) | Sim |
| numeroDocumento | string | Sim |
| serieDocumento | string | Sim |
| dataEmissao | string($date) | Sim |
| dataSaida | string($date-time) | Não |
| statusDocumento | string | Sim |
| chaveDocumento | string | Não |
| protocoloDocumento | string | Não |
| tipoEmissao | string | Sim |
| finalidade | string | Sim |
| documentosVinculados | [string] | Sim |
| vendaCodigo | integer($int32) | Não |
| clienteCodigo | integer($int32) | Sim |
| clienteCpfCnpj | string | Sim |
| totalNota | number($double) | Sim |
| totalProdutosNota | number($double) | Sim |
| modeloDocumento | string | Sim |
| cfop | string | Sim |
| baseIcms | number($double) | Sim |
| valorIcms | number($double) | Sim |
| baseIcmsST | number($double) | Sim |
| valorIcmsST | number($double) | Sim |
| valorFrete | number($double) | Sim |
| valorSeguro | number($double) | Sim |
| valorDesconto | number($double) | Sim |
| outrasDespesas | number($double) | Sim |
| valorIpi | number($double) | Sim |
| valorIrrfRetido | number($double) | Não |
| valorCsllRetido | number($double) | Não |
| modalidadeFrete | integer($int32) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/NFE/{id}/XML
Retorna XML da NF-e por código.

### POST /INTEGRACAO/AUTORIZAR_NFE_SAIDA/{notaCodigo}
Autoriza NF-e de saída.

### GET /INTEGRACAO/NOTA_SAIDA_ITEM
Lista itens de notas de saída.

**Response — RetornoPaginadoNotaSaidaItemRede → [NotaSaidaItem]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| notaCodigo | integer($int32) | Sim |
| notaItemCodigo | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| quantidade | number($double) | Sim |
| valorUnitario | number($double) | Sim |
| valorTotalItem | number($double) | Sim |
| desconto | number($double) | Sim |
| outrasDespesas | number($double) | Sim |
| valorIcms | number($double) | Sim |
| bcIcms | number($double) | Sim |
| aliqIcms | number($double) | Sim |
| motivoDesoneracaoIcms | string | Não |
| valorReducaoBaseIcms | number($double) | Sim |
| cfop | string | Sim |
| cst | string | Sim |
| cstPis | string | Sim |
| aliqPis | number($double) | Sim |
| bcPis | number($double) | Sim |
| valorPis | number($double) | Sim |
| cstCofins | string | Sim |
| aliqCofins | number($double) | Sim |
| bcCofins | number($double) | Sim |
| valorCofins | number($double) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/NFCE
Lista NFC-e (Nota Fiscal de Consumidor Eletrônica) paginado.

**Response — RetornoPaginadoNfceRede → [NfceRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| nfceCodigo | integer($int32) | Sim |
| vendaCodigo | integer($int32) | Sim |
| numeroDocumento | integer($int32) | Sim |
| serieDocumento | integer($int32) | Sim |
| dataEmissao | string($date) | Sim |
| situacao | string | Sim |
| chaveDocumento | string | Não |
| protocoloAutorizacao | string | Não |
| protocoloCancelamento | string | Não |
| protocoloInutilizacao | string | Não |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/NFCE/{id}/XML
Retorna XML da NFC-e.

### GET /INTEGRACAO/NOTA_SERVICO
Lista notas de serviço (NFS-e).

**Response — RetornoPaginadoNfseRede → [NfseRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| nfseCodigo | integer($int32) | Sim |
| vendaCodigo | integer($int32) | Sim |
| numeroDocumento | string | Não |
| dataEmissao | string($date) | Sim |
| situacao | string | Sim |
| chaveDocumento | string | Não |
| tipoNota | string | Não |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/SAT / GET /INTEGRACAO/CONSULTAR_SAT_REDE
Lista registros SAT.

**Response — RetornoPaginadosatRede → [SatRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| satCodigo | integer($int32) | Sim |
| vendaCodigo | integer($int32) | Sim |
| numeroDocumento | integer($int32) | Sim |
| serieDocumento | integer($int32) | Sim |
| dataEmissao | string($date) | Sim |
| situacao | string | Sim |
| chaveDocumento | string | Não |
| codigo | integer($int32) | Sim |

---

## 13. Compras

### GET /INTEGRACAO/COMPRA / GET /INTEGRACAO/CONSULTAR_COMPRA_REDE
Lista compras (notas de entrada) paginado.

**Response — RetornoPaginadoCompraRede → [CompraRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| compraCodigo | integer($int32) | Sim |
| dataMovimento | string($date) | Sim |
| dataEntrada | string($date) | Não |
| notaNumero | string | Sim |
| notaSerie | string | Sim |
| fornecedorCodigo | integer($int32) | Sim |
| transportadorCodigo | integer($int32) | Não |
| placaVeiculo | string | Não |
| placaReboque | string | Não |
| valorTotal | number($double) | Sim |
| valorFrete | number($double) | Não |
| tipoFrete | string | Não |
| chaveDocumento | string | Não |
| modeloDocumento | string | Sim |
| cteNumero | string | Não |
| cteDataEmissao | string($date) | Não |
| valorTotalProdutos | number($double) | Sim |
| bcIcms | number($double) | Sim |
| valorIcms | number($double) | Sim |
| icmsDesonerado | number($double) | Sim |
| bcIcmsSt | number($double) | Sim |
| valorIcmsSt | number($double) | Sim |
| fcpSt | number($double) | Sim |
| isento | number($double) | Sim |
| seguro | number($double) | Sim |
| desconto | number($double) | Sim |
| outrasDespesasAcessorias | number($double) | Sim |
| valorIpi | number($double) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/COMPRA_ITEM / GET /INTEGRACAO/CONSULTAR_COMPRA_ITEM_REDE
Lista itens de compra paginado (58 campos fiscais detalhados).

**Response — RetornoPaginadoCompraItemRede → [CompraItemRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| compraCodigo | integer($int32) | Sim |
| dataMovimento | string($date) | Sim |
| dataEntrada | string($date) | Sim |
| produtoCodigo | integer($int32) | Sim |
| quantide | number($double) | Sim |
| precoCusto | number($double) | Sim |
| totalCusto | number($double) | Sim |
| precoCompra | number($double) | Sim |
| totalCompra | number($double) | Sim |
| totalDesconto | number($double) | Sim |
| produtoLmcCodigo | integer($int32) | Não |
| cfop | string | Sim |
| cst | string | Sim |
| csosn | string | Não |
| cest | string | Não |
| ncm | string | Não |
| frete | number($double) | Sim |
| unidadeCompra | string | Sim |
| bcIcms | number($double) | Sim |
| aliqIcms | number($double) | Sim |
| valorIcms | number($double) | Sim |
| aliqReducao | number($double) | Sim |
| bcSubstituicao | number($double) | Sim |
| valorSubstituicao | number($double) | Sim |
| icmsDaOperacao | number($double) | Sim |
| icmsDiferido | number($double) | Sim |
| aliqDiferimento | number($double) | Sim |
| aliqFcp | number($double) | Sim |
| valorFcp | number($double) | Sim |
| aliqfcpSt | number($double) | Sim |
| bcFcpSt | number($double) | Sim |
| valorFcpSt | number($double) | Sim |
| aliqIpi | number($double) | Sim |
| valorIpi | number($double) | Sim |
| bcIcmsUfDest | number($double) | Sim |
| aliqIcmsInter | number($double) | Sim |
| aliqIcmsUfDest | number($double) | Sim |
| valorIcmsUfDestino | number($double) | Sim |
| cstPis | string | Sim |
| bcPis | number($double) | Sim |
| aliqPis | number($double) | Sim |
| valorPis | number($double) | Sim |
| cstCofins | string | Sim |
| bcCofins | number($double) | Sim |
| aliqCofins | number($double) | Sim |
| valorCofins | number($double) | Sim |
| irrfRetido | number($double) | Sim |
| csllRetido | number($double) | Sim |
| inssRetido | number($double) | Sim |
| pisRetido | number($double) | Sim |
| cofinsRetido | number($double) | Sim |
| outrasDespesasAcessorias | number($double) | Sim |
| valorIcmsProprio | number($double) | Sim |
| aliqAdrem | number($double) | Sim |
| codigo | integer($int32) | Sim |

---

## 14. Cadastros

### GET /INTEGRACAO/EMPRESAS / GET /INTEGRACAO/CONSULTAR_EMPRESA
Lista empresas da rede.

**Response — RetornoPaginadoEmpresasRede → [EmpresasRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| cnpj | string | Sim |
| razao | string | Sim |
| fantasia | string | Sim |
| endereco | string | Sim |
| bairro | string | Não |
| cep | string | Não |
| cidade | string | Sim |
| estado | string | Sim |
| ultimoUsuarioAlteracao | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/FUNCIONARIO
Lista funcionários paginado.

**Response — RetornoPaginadoFuncionarioRede → [FuncionarioRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| funcionarioCodigo | integer($int32) | Sim |
| funcionarioCodigoExterno | string | Não |
| funcionarioReferencia | string | Sim |
| nome | string | Sim |
| funcaoCodigo | integer($int32) | Sim |
| admissao | string($date) | Não |
| demissao | string($date) | Não |
| ultimoUsuarioAlteracao | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/FUNCIONARIO_META / GET /INTEGRACAO/CONSULTAR_FUNCIONARIO_META_REDE
Lista metas de funcionários.

**Response — RetornoPaginadoFuncionarioMeta → [FuncionarioMeta]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| grupoMetaCodigo | integer($int32) | Sim |
| funcionarioCodigo | integer($int32) | Sim |
| metaTipo | string | Sim |
| metaValor | number($double) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/FUNCOES / GET /INTEGRACAO/CONSULTAR_FUNCOES_REDE
Lista funções (cargos) de funcionários.

**Response — RetornoPaginadoFuncoesRede → [FuncoesRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| funcaoCodigo | integer($int32) | Sim |
| nome | string | Sim |
| ultimoUsuarioAlteracao | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/FORNECEDOR / GET /INTEGRACAO/CONSULTAR_FORNECEDOR_REDE
Lista fornecedores paginado.

**Response — RetornoPaginadoFornecedorRede → [FornecedorRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| fornecedorCodigo | integer($int32) | Sim |
| razao | string | Sim |
| fantasia | string | Sim |
| cnpjCpf | string | Sim |
| logradouro | string | Não |
| tipoLogradouro | string | Não |
| numero | string | Sim |
| bairro | string | Não |
| cidade | string | Sim |
| telefone | string | Não |
| celular | string | Não |
| observacoes | string | Não |
| codigoMunicipio | integer($int32) | Sim |
| uf | string | Sim |
| email | string | Não |
| ultimoUsuarioAlteracao | string | Sim |
| website | string | Não |
| complemento | string | Não |
| cep | string | Não |
| pais | string | Sim |
| inscricaoEstadual | string | Sim |
| inscricaoMunicipal | string | Não |
| contasFornecedor | [ContaFornecedor] | Sim |
| codigo | integer($int32) | Sim |

**ContaFornecedor:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| tipoConta | string | Sim |
| banco | string | Sim |
| agencia | string | Não |
| conta | string | Não |
| tipoChavePix | string | Não |
| chavePix | string | Não |

### GET /INTEGRACAO/GRUPO / GET /INTEGRACAO/CONSULTAR_GRUPO_REDE
Lista grupos de produtos.

**Response — RetornoPaginadoGrupoRede → [GrupoRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| grupoCodigo | integer($int32) | Sim |
| nome | string | Sim |
| ultimoUsuarioAlteracao | string | Sim |
| grupoCodigoExterno | string | Não |
| codigoTributoIcms | integer($int32) | Não |
| codigoTributoPisCofins | integer($int32) | Não |
| descricaoTributoIcms | string | Não |
| descricaoTributoPisCofins | string | Não |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/GRUPO_CLIENTE
Lista grupos de clientes.

**Response — RetornoPaginadoGrupoClienteRede → [GrupoClienteRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| grupoCodigo | integer($int32) | Sim |
| grupoCodigoExterno | string | Não |
| descricao | string | Sim |
| usaLimiteLitros | boolean | Sim |
| limiteLitros | number($double) | Não |
| limiteLitrosDisponivel | number($double) | Não |
| usaLimiteReais | boolean | Sim |
| limiteReais | number($double) | Não |
| limiteReaisDisponivel | number($double) | Não |
| bloqueadoFinanceiroVencido | boolean | Sim |
| diasTolerancia | integer($int32) | Não |
| codigo | integer($int32) | Sim |

### POST /INTEGRACAO/GRUPO_CLIENTE
Cadastra grupo de clientes.

**Request Body — ClienteGrupo:**

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| descricaoGrupo | string | Sim | máx 80 |
| blLimiteLitros | boolean | Não | default false |
| vlLimiteLitros | number($double) | Cond. | obrigatório se blLimiteLitros=true |
| vlLimiteLitrosDisponivel | number($double) | Cond. | obrigatório se blLimiteLitros=true |
| blLimiteReais | boolean | Não | default false |
| vlLimiteReais | number($double) | Cond. | obrigatório se blLimiteReais=true |
| vlLimiteReaisDisponivel | number($double) | Cond. | obrigatório se blLimiteReais=true |
| flTipoLimite | string | Sim | M=Mensal, D=Docs Faturados, P=Docs Pagos |
| flBloqueioFinanceiroAberto | boolean | Não | default false |
| documentosReinicio | integer($int32) | Não | 1=Notas/Dup, 2=Cheques/Rem, 3=Ambos |
| codigoExterno | string | Não | máx 10 |
| isLimiteLitrosPreenchido | boolean | Sim | |
| isLimiteReaisPreenchido | boolean | Sim | |

**Response — RetornoClienteGrupo:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| codClienteGrupo | integer($int32) | Sim |

### PUT /INTEGRACAO/GRUPO_CLIENTE/{id}
Altera grupo de clientes. **Request Body:** ClienteGrupo

### GET /INTEGRACAO/GRUPO_META
Lista grupos de metas.

**Response — RetornoPaginadoGrupoMetaRede → [GrupoMetaRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| grupoMetaCodigo | integer($int32) | Sim |
| descricao | string | Sim |
| empresaCodigo | integer($int32) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/CENTRO_CUSTO / GET /INTEGRACAO/CONSULTAR_CENTRO_CUSTO_REDE
Lista centros de custo.

**Response — RetornoPaginadoCentroCustoRede → [CentroCustoRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| centroCustoCodigo | integer($int32) | Sim |
| descricao | string | Sim |
| centroCustoCodigoExterno | string | Não |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/ADMINISTRADORA / GET /INTEGRACAO/CONSULTAR_ADMINISTRADORA / GET /INTEGRACAO/CONSULTAR_ADMINISTRADORA_REDE
Lista administradoras de cartão.

**Response — ReornoPaginadoAdministradoraRede → [AdministradoraRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| administradoraCodigo | integer($int32) | Sim |
| administradoraCodigoExterno | string | Não |
| descricao | string | Sim |
| tipo | string | Sim |
| codigo | integer($int32) | Sim |

---

## 15. Equipamentos

### GET /INTEGRACAO/BICO / GET /INTEGRACAO/CONSULTAR_BICO_REDE
Lista bicos de bombas.

**Response — RetornoPaginadoBicoRede → [BicoRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| bicoCodigo | integer($int32) | Sim |
| bicoNumero | string | Sim |
| tanqueCodigo | integer($int32) | Sim |
| bombaCodigo | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| ultimoUsuarioAlteracao | string | Sim |
| produtoLmcCodigo | integer($int32) | Não |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/BOMBA
Lista bombas de combustível.

**Response — RetornoPaginadoBombaRede → [BombaRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| bombaCodigo | integer($int32) | Sim |
| empresaCodigo | integer($int32) | Sim |
| bombaReferencia | string | Sim |
| descricao | string | Sim |
| quantidadeBicos | integer($int32) | Sim |
| ilha | integer($int32) | Sim |
| serie | string | Sim |
| fabricante | string | Sim |
| modelo | string | Sim |
| tipoMedicaoDigital | boolean | Sim |
| lacres | [BombaLacre] | Sim |
| codigo | integer($int32) | Sim |

**BombaLacre:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| numeroLacre | string | Sim |
| dataAplicacao | string($date) | Sim |

### GET /INTEGRACAO/TANQUE / GET /INTEGRACAO/CONSULTAR_TANQUE_REDE
Lista tanques de armazenamento.

**Response — RetornoPaginaTanqueRede → [TanqueRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| tanqueCodigo | integer($int32) | Sim |
| nome | string | Sim |
| produtoCodigo | integer($int32) | Sim |
| capacidade | number($double) | Sim |
| ultimoUsuarioAlteracao | string | Sim |
| lastro | number($double) | Não |
| estoqueEscritural | number($double) | Sim |
| produtoLmcCodigo | integer($int32) | Não |
| dataHoraMedidor | string($date-time) | Não |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/PDV / GET /INTEGRACAO/CONSULTAR_PDV_REDE
Lista pontos de venda (PDV).

**Response — RetornoPaginadoPdvRede → [PdvRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| pdvCodigo | integer($int32) | Sim |
| pdv | string | Sim |
| tipo | string | Sim |
| ativo | string | Sim |
| codigo | integer($int32) | Sim |

---

## 16. Caixa

### GET /INTEGRACAO/CAIXA / GET /INTEGRACAO/CONSULTAR_CAIXA_REDE
Lista caixas (turno/operação) paginado.

**Response — RetornoPaginadoCaixaRede → [CaixaRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| caixaCodigo | integer($int32) | Sim |
| dataMovimento | string($date) | Sim |
| turnoCodigo | integer($int32) | Sim |
| turno | string | Sim |
| pdvCodigo | integer($int32) | Sim |
| funcionarioCodigo | integer($int32) | Sim |
| abertura | string($date-time) | Sim |
| fechamento | string($date-time) | Não |
| fechado | boolean | Sim |
| consolidado | boolean | Sim |
| tipoInclusao | string | Sim |
| bloqueado | boolean | Sim |
| tipoBloqueio | string | Sim |
| apurado | number | Não |
| diferenca | number | Não |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/CAIXA_APRESENTADO / GET /INTEGRACAO/CONSULTAR_CAIXA_APRESENTADO_REDE
Retorna valores apresentados vs apurados no caixa (conferência de caixa). Schema com ~60 campos.

**Response — RetornoCaixaApresentadoRede → [CaixaApresentadoRede] (campos principais):**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| caixaCodigo | integer($int32) | Sim |
| dinheiroApresentado | number | Sim |
| dinheiroApurado | number | Sim |
| dinheiroDiferenca | number | Sim |
| notaPrazoApresentado | number | Sim |
| notaPrazoApurado | number | Sim |
| notaPrazoDiferenca | number | Sim |
| chequeApresentado | number | Sim |
| chequeApurado | number | Sim |
| chequeDiferenca | number | Sim |
| cartaoApresentado | number | Sim |
| cartaoApurado | number | Sim |
| cartaoDiferenca | number | Sim |
| despesaApresentado | number | Sim |
| despesaApurado | number | Sim |
| despesaDiferenca | number | Sim |
| valeFunApresentado | number | Sim |
| valeFunApurado | number | Sim |
| valeFunDiferenca | number | Sim |
| valeCliente | number | Sim |
| suprimentoCaixa | number | Sim |
| recebimentoCaixa | number | Sim |
| chequeTroco | number | Sim |
| servicoCaixa | number | Sim |
| prePagoCredito | number | Sim |
| fundoCaixaCredito | number | Sim |
| ordemPagamento | number | Sim |
| pagamentoCaixa | number | Sim |
| saidaTrocaValor | number | Sim |
| consolidado | boolean | Sim |
| codigo | integer($int32) | Sim |

---

## 17. Abastecimento

### GET /INTEGRACAO/ABASTECIMENTO / GET /INTEGRACAO/CONSULTAR_ABASTECIMENTO_REDE
Lista abastecimentos registrados paginado.

**Response — RetornoPaginadoAbastecimentoRede → [AbastecimentoRede]:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| dataFiscal | string($date) | Não | |
| horaFiscal | LocalTime | Não | {hour, minute, second, nano} |
| codigoBico | integer($int32) | Sim | |
| codigoProduto | integer($int32) | Não | |
| quantidade | number($double) | Sim | Litros |
| valorUnitario | number($double) | Sim | Preço/litro |
| valorTotal | number($double) | Sim | |
| codigoFrentista | integer($int32) | Sim | |
| afericao | boolean | Sim | |
| vendaItemCodigo | integer($int32) | Sim | |
| precoCadastro | number($double) | Sim | |
| tabelaPrecoA | number($double) | Não | |
| tabelaPrecoB | number($double) | Não | |
| tabelaPrecoC | number($double) | Não | |
| empresaCodigo | integer($int32) | Sim | |
| dataHoraAbastecimento | string($date-time) | Sim | |
| stringFull | string | Não | |
| abastecimentoCodigo | integer($int32) | Sim | |
| encerrante | number($double) | Sim | Leitura do encerrante |
| codigo | integer($int32) | Sim | Cursor |

### POST /INTEGRACAO/AUTORIZA_PAGAMENTO_ABASTECIMENTO
Autoriza pagamento de abastecimento (pré-autorização).

**Request Body — AutorizaPagamentoAbastecimento:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| clienteCodigo | integer($int32) | Sim |
| cartaoCodigo | integer($int32) | Sim |
| valor | number($double) | Sim |

### GET /INTEGRACAO/CONSULTAR_ANALISE_VENDAS_COMBUSTIVEL
Análise de vendas de combustível (sem schema documentado).

---

## 18. Cartão

### GET /INTEGRACAO/CARTAO / GET /INTEGRACAO/CONSULTAR_CARTAO_REDE
Lista cartões registrados paginado.

**Response — RetornoPaginadoCartaoRede → [CartaoRede]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| cartaoCodigo | integer($int32) | Sim |
| vendaCodigo | integer($int32) | Sim |
| vencimento | string($date) | Sim |
| valor | number($double) | Sim |
| parcela | integer($int32) | Sim |
| taxaPercentual | number($double) | Não |
| administradoraCodigo | integer($int32) | Sim |
| adiministradoraDescricao | string | Sim |
| clienteReferencia | string | Sim |
| clienteRazao | string | Sim |
| clienteCpfCnpj | string | Sim |
| centroCustoCodigo | integer($int32) | Sim |
| centroCustoDescricao | string | Sim |
| dataPagamento | string($date) | Não |
| tipoInclusao | string | Sim |
| dataMovimento | string($date) | Sim |
| dataFiscal | string($date) | Não |
| pendente | boolean | Sim |
| nsu | string | Não |
| autorizacao | string | Não |
| codigo | integer($int32) | Sim |
| codigoBandeira | string | Não |
| nsuTef | string | Não |

### POST /INTEGRACAO/CARTAO
Cadastra cartão.

**Request Body — PersistirCartaoDto:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| administradoraCodigo | integer($int32) | Sim |
| clienteCodigo | integer($int32) | Sim |
| valor | number($double) | Sim |
| parcelas | integer($int32) | Sim |
| vencimento | string($date) | Sim |

### DELETE /INTEGRACAO/CARTAO/{id}
Remove cartão.

### GET /INTEGRACAO/CARTAO — Remessas
Lista remessas de cartão.

**Response — RetornoPaginadoCartaoRemessa → [CartaoRemessa]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| cartaoRemessaCodigo | integer($int32) | Sim |
| cartaoRemessaReferenciaCodigo | string | Sim |
| empresaCodigo | integer($int32) | Sim |
| valorRemessa | number($double) | Sim |
| dataRemessa | string($date) | Sim |
| dataPagamento | string($date) | Sim |
| dataRecebimento | string($date) | Sim |
| administradora | string | Sim |
| taxasDespesas | number($double) | Sim |
| valorLiquido | number($double) | Sim |
| administradoraCodigo | integer($int32) | Sim |
| acrescimos | number($double) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/CONSULTAR_CARTOES_CLUBGAS
Lista cartões ClubGas.

**Response — [ClubGas]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| fantasiaEmpresa | string | Sim |
| razaoSocialEmpresa | string | Sim |
| cnpj | string | Sim |
| codigoProduto | string | Sim |
| nomeProduto | string | Sim |
| precoBomba | number($double) | Sim |
| precoBombaB | number($double) | Sim |
| precoBombaC | number($double) | Sim |
| precoClubgas | number($double) | Sim |
| tipo | string | Sim |

---

## 19. Preços

### POST /INTEGRACAO/ALTERACAO_PRECO_COMBUSTIVEL
Altera preço de combustível.

**Request Body — TrocaPreço (IntegracaoTrocapreco):**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| precoVenda | number($double) | Sim |
| precoVendaB | number($double) | Sim |
| precoVendaC | number($double) | Sim |

### GET /INTEGRACAO/TROCA_PRECO
Lista histórico de trocas de preço.

**Response — RetornoPaginadoIntegracaoTrocaPreço → [IntegracaoTrocapreco]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| precoVenda | number($double) | Sim |
| precoVendaB | number($double) | Sim |
| precoVendaC | number($double) | Sim |
| dataHora | string($date-time) | Sim |
| usuario | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/CONSULTAR_PRECO_IDENTIFID
Consulta preços por identificador (IdentiFid).

**Response — [IntegracaoPrecoltens]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| produtoCodigo | integer($int32) | Sim |
| precoVenda | number($double) | Sim |
| precoVendaB | number($double) | Sim |
| precoVendaC | number($double) | Sim |
| empresaCodigo | integer($int32) | Sim |

---

## 20. Contábil

### GET /INTEGRACAO/PLANO_CONTA_GERENCIAL / GET /INTEGRACAO/CONSULTAR_PLANO_CONTA_GERENCIAL_REDE
Lista plano de contas gerencial.

**Response — RetornoPaginadoPlanoContaGerencial → [PlanoContaReferencial]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| planoContaCodigo | integer($int32) | Sim |
| descricao | string | Sim |
| hierarquia | string | Sim |
| apuraDre | boolean | Sim |
| natureza | string | Sim |
| tipo | string | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/PLANO_CONTA_CONTABIL / GET /INTEGRACAO/CONSULTAR_SALDO_PLANO_CONTA_CONTABIL_REDE
Lista plano de contas contábil.

**Response — RetornoPaginadoPanoContaContabil → [PlanoContaContabil]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| planoContaContabilCodigo | integer($int32) | Sim |
| planoContaContabil | string | Sim |
| hierarquia | string | Sim |
| ativo | boolean | Sim |
| tipo | string | Sim |
| nivel | integer($int32) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/LANCAMENTO_CONTABIL
Lista lançamentos contábeis paginado.

**Response — RetornoPaginadoIntegracaoLancamentoContabil → [IntegracaoLancamentoContabil]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| data | string($date) | Sim |
| loteContabil | integer($int32) | Sim |
| sigla | string | Sim |
| debito | number($double) | Sim |
| credito | number($double) | Sim |
| lancamentoItens | [LancamentoContabilItem] | Sim |
| codigo | integer($int32) | Sim |

**LancamentoContabilItem:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| momento | string | Sim |
| descricao | string | Sim |
| naturezaOperacao | string | Sim |
| planoContaContabilCodigo | integer($int32) | Sim |
| valor | number($double) | Sim |
| historico | string | Sim |
| centroCustoCodigo | integer($int32) | Sim |
| clienteCodigo | integer($int32) | Sim |
| fornecedorCodigo | integer($int32) | Sim |
| funcionarioCodigo | integer($int32) | Sim |
| dataHoraCriacao | string($date-time) | Sim |

### GET /INTEGRACAO/ICMS
Lista tributações ICMS cadastradas.

**Response — RetornoPaginadoIcms → [Icms]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| produtoIcmsCodigo | integer($int32) | Sim |
| descricao | string | Sim |
| cstIcmsEntrada | string | Não |
| icmsEntrada | number($double) | Sim |
| csonEntrada | integer($int32) | Sim |
| cstIcmsSaida | string | Não |
| icmsSaida | number($double) | Sim |
| csonSaida | integer($int32) | Sim |
| fcp | number($double) | Sim |
| mva | number($double) | Sim |
| codigo | integer($int32) | Sim |

### GET /INTEGRACAO/PIS_COFINS
Lista tributações PIS/COFINS cadastradas.

**Response — RetornoPaginadoPisConfins → [PisConfins]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| produtoPisCofinsCodigo | integer($int32) | Sim |
| descricao | string | Sim |
| cstPisEntrada | string | Sim |
| pisEntrada | number($double) | Sim |
| bcPisEntrada | number($double) | Sim |
| cstPisSaida | string | Sim |
| pisSaida | number($double) | Sim |
| bcPisSaida | number($double) | Sim |
| cstCofinsEntrada | string | Sim |
| cofinsEntrada | number($double) | Sim |
| bcCofinsEntrada | number($double) | Sim |
| cstCofinsSaida | string | Sim |
| cofinsSaida | number($double) | Sim |
| bcCofinsSaida | number($double) | Sim |
| codigo | integer($int32) | Sim |

---

## 21. Relatórios

### GET /INTEGRACAO/MAPA_DESEMPENHO
Relatório de desempenho de funcionários por produto.

**Response — [RelatorioMapaDesempenho]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| funcionarioCodigo | integer($int32) | Sim |
| funcionarioNome | string | Sim |
| empresaCodigo | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| grupoNome | string | Não |
| produtoNome | string | Não |
| quantidade | number($double) | Sim |
| quantidadeAjustada | number($double) | Sim |
| percentualComissao | string | Não |
| valorVenda | number($double) | Sim |
| valorAjustado | number($double) | Sim |
| fatorComissao | number($double) | Sim |
| valorComissao | number($double) | Sim |

### GET /INTEGRACAO/CONSULTAR_DESPESAS_FINANCEIRO_REDE
Consulta despesas financeiras (DRE).

**Response — DRE:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| empresaCodigo | [integer($int32)] | Lista de empresas |
| receitaBruta | number | Receita bruta total |
| vendasGrupo | [VendasGrupo] | Vendas por grupo |
| deducaoFiscal | number | Total de deduções |
| apuracaoReceita | [Apuracao] | Detalhamento receitas |
| apuracaoPagamentos | [Apuracao] | Detalhamento pagamentos |

**VendasGrupo:**

| Campo | Tipo |
|-------|------|
| produtoGrupo | string |
| valorVenda | number |
| acrescimo | number |
| desconto | number |
| cmv | number |

**Apuracao:**

| Campo | Tipo |
|-------|------|
| planoContaGerencialPAI | string |
| planoContaGerencialFILHO | string |
| centroCusto | [integer($int32)] |
| data | string($date) |
| descricaoDocumento | string |
| valor | number |

### GET /INTEGRACAO/CONSULTAR_FUNCIONARIO_IDENTFID
Consulta funcionários por IdentiFid.

**Response — [FuncionarioIdentifid]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| funcionario | string | Sim |
| identfid | string | Sim |

### GET /INTEGRACAO/CONSUMO_CLIENTE
Lista consumo de clientes (histórico de abastecimentos por cliente).

**Response — RetornoPaginadoIntegracaoConsumoCliente → [IntegracaoConsumoCliente]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCnpj | string | Sim |
| empresaNome | string | Sim |
| motorista | string | Não |
| placa | string | Não |
| dataHoraEmissao | string | Não |
| kmAtual | integer($int32) | Sim |
| tipoDoc | string | Sim |
| numeroDocumento | integer($int32) | Sim |
| serieDocumento | integer($int32) | Sim |
| chaveDocumento | string | Não |
| valorDocumento | number($double) | Sim |
| codigoVenda | integer($int32) | Sim |
| itensCupom | [IntegracaoConsumoClienteItens] | Sim |
| formaPagamento | [IntegracaoConsumoClientePagamento] | Sim |
| codigo | integer($int32) | Sim |

---

## 22. Outros

### GET /INTEGRACAO/PEDIDO_TRR
Lista pedidos TRR (Transportador Revendedor Retalhista) paginado.

**Response — RetornoPaginadoPedidoTrr → [PedidoTrr]:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| empresaCodigo | integer($int32) | Sim |
| data | string($date) | Sim |
| pedidoCodigo | integer($int32) | Sim |
| vendaCodigo | integer($int32) | Não |
| valor | number($double) | Sim |
| clienteCodigo | integer($int32) | Sim |
| prazoCodigo | integer($int32) | Sim |
| itens | [PedidoTrrItem] | Sim |
| codigo | integer($int32) | Sim |

**PedidoTrrItem:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| sequencialItem | integer($int32) | Sim |
| produtoCodigo | integer($int32) | Sim |
| quantidade | number($double) | Sim |
| valor | number($double) | Sim |
| acrescimo | number($double) | Sim |
| desconto | number($double) | Sim |
| valorItemTotal | number($double) | Sim |

### POST /INTEGRACAO/REVENDEDORES_ANP
Envia dados de revendedores à ANP (Agência Nacional do Petróleo).  
Sem schema de request/response documentado no PDF.

### GET /INTEGRACAO/CNPJ_REDES_PAGPIX
Retorna CNPJs das redes para pagamento PIX.  
Sem schema documentado.

### GET /INTEGRACAO/CONSULTAR_VIEW
Consulta view genérica.  
Sem schema documentado.

### GET /INTEGRACAO/DFE_XML
Retorna XML de documentos fiscais eletrônicos (DFe).  
Sem schema documentado.

---

## Apêndice — Schemas de Suporte

### IntegracaoPedidoNotificar (callback de pedido)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| pedido | integer($int32) | Sim |
| nota | integer($int32) | Não |
| modelo | string | Sim |
| faturado | boolean | Sim |
| error | string | Não |

### Convenção de Paginação

Todos os endpoints de listagem retornam um envelope:

```json
{
  "ultimoCodigo": 12345,
  "resultados": [...]
}
```

Para obter a próxima página, passar `ultimoCodigo` como parâmetro de query (nome exato varia por endpoint — verificar documentação do endpoint específico).

---

*Inventário gerado a partir de `files/status/webPosto.docx` (PDF 73 páginas). Campos marcados com `*` na fonte são obrigatórios. Schemas sem exemplos de valores não tinham exemplos no PDF original.*