# Marcações, Etiquetas e Regra de KM

## Regra de referência: KM que chegou na empresa

**A referência para saber se o veículo precisa trocar um produto é sempre a KM em que o veículo CHEGOU NA EMPRESA** (registrada em Marcações).

- Não existe "KM certa" — o veículo pode chegar **antes** (ex: 80.000 km) ou **depois** (ex: 120.000 km) da próxima troca.
- O cálculo e os avisos usam sempre a **KM de chegada na empresa** (última marcação) quando não houver troca registrada.

## Fluxos

### 1. Marcação (chegada na empresa)

- O guarda registra: **veículo** + **KM que chegou**.
- Atualiza o histórico de quilometragem **e** a **quilometragem atual do veículo** (`Vehicle.currentKm`), para que o caminhão fique sempre com a KM certa em todo o sistema.
- **Não cria etiqueta**.
- Essa KM será usada como base quando não houver última troca do produto.

### 2. Registrar troca na estrada

- Usado quando o produto foi trocado **fora da empresa** (na estrada).
- Informa: **veículo**, **produto** e **KM em que foi trocada**.
- Pode ser 80k, 120k, etc. — qualquer KM em que a troca aconteceu.
- Essa KM passa a ser a **última troca** daquele produto naquele veículo.
- A **quilometragem atual do veículo** (`Vehicle.currentKm`) é atualizada com essa KM, replicando em todo o sistema.

### 3. Criar etiqueta

- Usado quando for **imprimir** a etiqueta de manutenção.
- Escolhe **veículo** e **produtos**.
- Para cada produto:
  - **Última troca** = último registro (etiqueta anterior ou “troca na estrada”).
  - Se não houver registro → usa **KM que chegou na empresa** (última marcação).
  - **Próxima troca** = última troca + intervalo do produto (Troca em KM).

## Exemplos

| Situação | Referência usada | Observação |
|----------|------------------|------------|
| Produto troca a cada 100k; veículo chegou com 120k | 120k (marcação) | Considera que naquela chegada já estava na hora ou passou da troca. |
| Produto troca a cada 100k; veículo chegou com 80k | 80k (marcação) | Ainda não precisava trocar na empresa; pode trocar na estrada se quiser. |
| Troca feita na estrada em 85k | 85k (registro de troca) | Na próxima etiqueta, última troca = 85k, próxima = 85k + intervalo. |
| Primeira etiqueta do veículo | Última marcação ou currentKm | Não há troca anterior; usa KM de chegada como base. |

## Quilometragem única do veículo

Sempre que se informa a quilometragem do veículo em qualquer fluxo (marcação, registrar troca, ou "Atualizar Quilometragem" na tela do veículo), esse valor **replica** em `Vehicle.currentKm`. O caminhão permanece com a KM certa em listas, detalhes, etiquetas e cálculos de próxima troca.

## Resumo

1. **Marcação** = KM de chegada na empresa; atualiza `Vehicle.currentKm` e é fonte da “KM atual” para cálculos.
2. **Troca na estrada** = registra a KM em que o produto foi trocado; atualiza `Vehicle.currentKm`.
3. **Etiqueta** = junta última troca (ou KM de chegada) + intervalo e calcula próxima troca.
4. Toda a lógica de “precisa trocar?” e de próxima troca se baseia na **KM que chegou na empresa** quando não houver troca registrada.
