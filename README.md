# folio

Portfolio allocation dashboard. Holdings live in `app/config.ts`. Quotes and the USD/BRL rate are loaded from Yahoo Finance when the page opens and when you press **Atualizar**.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Fill the allocation

`app/config.ts` is gitignored. Copy the sample and edit the copy:

```bash
cp app/config.example.ts app/config.ts
```

The file must export `assetAllocation`. The sample is a valid tree: Internacional 70 and Nacional 30, and each class's children add up to 100.

### Tree

The root has `targetPercentage: 100` and a list of `classes`. A class has a `name`, a `targetPercentage`, and either nested `classes` or `assets`. When both are present, only `classes` are used.

`targetPercentage` is the share of the parent, not of the whole portfolio. The children of a class should add up to 100. The dashboard shows that number as **META** and compares it with the current share. It does not reject a group that adds up to something else.

### Assets

| Field | Required | Meaning |
| --- | --- | --- |
| `code` | yes | Ticker, or a label for cash that has no ticker |
| `targetPercentage` | no | Share of the parent class, shown as **META** |
| `holdingQuantity` | no | Shares held. The position is the quote times this quantity |
| `balance` | no | Cash already held, in `currency`. Used when there is no market quote |
| `currency` | no | `USD` or `BRL`. See the default below |

Do not put `holdingValue`, quotes, or percentages of the current portfolio in the config. Those are calculated when the quotes load.

### Tickers and currency

A code is quoted when it is 1 to 5 letters, optionally followed by 1 or 2 digits: `AAPL`, `VOO`, `WEGE3`, `KNRI11`.

- A code with a digit is read as a B3 ticker (`WEGE3` becomes `WEGE3.SA`).
- A code with no digit is read as a US ticker (`VOO` stays `VOO`).
- Anything else is not quoted: spaces, accents, or a digit before the end, such as `B3SA3`. Give those a `balance`, or they stay empty.

Currency defaults from the top class. Assets under `Internacional` are USD. Everything else is BRL. Set `currency` when that default is wrong. A US listing placed under Nacional, such as `XP`, needs `currency: "USD"`. Cash uses `balance` plus `currency`, as in the sample `CDB` and `Saldo corretora` rows.
