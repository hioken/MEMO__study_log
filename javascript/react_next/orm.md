# Prisma
## 主要コンポーネント
### Prisma Schema
* db構造とdbの種類を記述(Prisma7~)
  * SSOT(Prisma~6)
* データベースの接続情報
* アプリケーションのデータ構造
### config
* 接続用設定
### Prisma Client
* schemaから自動生成される
* 型安全なDB操作ライブラリ
* 提供されるメソッドでクエリを発行
* PrismaClientインスタンスごとにTCPソケットが開設されるが、このインスタンスが消えてもソケットは自動で閉じてはくれない
  * そのためglobalThisによるシングルトンパターンの定義が必須
### Prisma Migrate
* schemaの変更内容を、DBに反映させるためのツール
* `schema.prisma`のテーブル操作


## Prisma Schema
### 概要
* `prisma/schema.prisma`
* 3つのブロックで構成される

### Datasource
* 接続するDBの種類と、接続URLを指定するブロック
```prisma
datasource db {
  provider = "postgresql"
  // Prisma~6 url = env("POSTGREW_URL")
}
```

### Generator
* どのようなコードを生成するか指定するブロック
* `prisma-client-js`: Ts環境で型安全にDBを操作するためのPrismaClientを立ち上げる
* サードパーティ製プロバイダ: `zod`etcのプロバイダを指定できる
```prisma
generator client {
  provider = "prisma-client-js"
}
```

### Model
#### 概要
* テーブルに対応する構造体を定義するブロック
* `フィールド名 型 @オプション`で定義
```prisma
model User {
  id       String @id @default(uuid())
  name     String
  email    String @unique
  password String
}
```
#### リレーション
* リレーション定義
```prisma
model Customer {
  id       String    @id @default(uuid())
  name     String
  invoices Invoice[] //子
}

model Invoice {
  id         String   @id @default(uuid())
  amount     Int
  customerId String //親ID
  customer   Customer @relation(fields: [customerId], references: [id]) //親
}
```
#### 制約etc一覧
| 記述 | 分類 | 概要 |
| :--- | :--- | :--- |
| `@id` | 属性 | 主キー |
| `@default()` | 属性 | デフォルト値設定 |
| `@unique` | 属性 | 一意制約 |
| `@relation()` | 属性 | リレーション・外部キー定義 |
| `@map()` | 属性 | DB上の物理カラム名へのマッピング |
| `@updatedAt` | 属性 | 更新時の自動タイムスタンプ付与 |
| `@ignore` | 属性 | Client生成対象外（コードから不可視） |
| `?` | 修飾子 | NULL許容（オプショナル） |
| `[]` | 修飾子 | 配列（主に1対多の「多」側） |

## config
* `/schema.config.ts`
* `@prisma/config`からimportした`defineConfig`関数をラップしてexportする
```ts
  import { defineConfig } from '@prisma/config'

  export default defineConfig({
    // 設定プロパティ
  })
```

| プロパティ | 型 | 説明 |
| :--- | :--- | :--- |
| `migrate` | Object | マイグレーション設定。 |
| `migrate.url` | string | DB直接接続URL。必須。 |
| `studio` | Object | Prisma Studio起動設定。 |
| `studio.port` | number | ポート番号（初期値5555）。 |
| `studio.browser` | string | 起動時に開くブラウザ。 |
| `schema` | string | schema.prismaの独自パス指定。 |
| `earlyAccess` | boolean | プレビュー機能の有効化。 |
| `telemetry` | boolean | テレメトリ（利用状況）送信設定。 |

## 操作
### クライアントインスタンス化
```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  adapter: DBのアダプター
});
// const prisma = new PrismaClient(); Prisma~6
```

### query methods一覧
| clause | method | argObj | 説明 |
| :--- | :--- | :--- | :--- |
| `SELECT (unique)` | `findUnique` | `{ where, select?, include? }` | 一意条件で1件取得。必須: `where` |
| `SELECT (LIMIT 1)` | `findFirst` | `{ where?, select?, include?, ... }` | 条件に合う最初の1件を取得 |
| `SELECT (ALL)` | `findMany` | `{ where?, select?, include?, ... }` | 条件に合う複数件を取得 |
| `INSERT (1件)` | `create` | `{ data, select?, include? }` | 1件作成。必須: `data` |
| `INSERT (複数)` | `createMany` | `{ data, skipDuplicates? }` | 複数作成。必須: `data` |
| `UPDATE (1件)` | `update` | `{ where, data, select?, include? }` | 1件更新。必須: `where`, `data` |
| `UPDATE (複数)` | `updateMany` | `{ where?, data }` | 複数更新。必須: `data` |
| `INSERT / UPDATE` | `upsert` | `{ where, create, update, ... }` | 存在すれば更新、なければ作成。必須: `where`, `create`, `update` |
| `DELETE (1件)` | `delete` | `{ where, select?, include? }` | 1件削除。必須: `where` |
| `DELETE (複数)` | `deleteMany` | `{ where? }` | 複数削除 |
| `SELECT COUNT` | `count` | `{ where?, select?, ... }` | 条件に合うレコードの件数を取得 |
| `SELECT (集計)` | `aggregate` | `{ where?, _sum, _avg, ... }` | 合計・平均などの集計を実行。集計プロパティが必須 |
| `GROUP BY` | `groupBy` | `{ by, where?, _sum, ... }` | 指定カラムでグループ化して集計。必須: `by` |

### query props一覧
| keyword | prop | value | 説明 |
| :--- | :--- | :--- | :--- |
| `WHERE` | `where` | Object | 絞り込み条件（対象の特定）を指定 |
| `SET` / `VALUES`| `data` | Object / Array | 作成・更新する具体的な値を指定 |
| `SELECT` | `select` | Object | 取得するカラムをbooleanで指定 |
| `JOIN` | `include` | Object | リレーション先のテーブルも結合して取得 |
| `ORDER BY` | `orderBy` | Object / Array | ソート順（`asc` または `desc`）を指定 |
| `LIMIT` | `take` | Number | 取得する最大件数を制限 |
| `OFFSET` | `skip` | Number | 取得を開始する位置（スキップ件数）を指定 |
| `DISTINCT` | `distinct` | Array | 指定したカラムの重複を排除して取得 |
| (upsert専用) | `create` | Object | `upsert` 時にレコードが存在しない場合の値 |
| (upsert専用) | `update` | Object | `upsert` 時にレコードが存在する場合の値 |
| `GROUP BY` | `by` | Array | `groupBy` メソッド専用。グループ化するカラムを指定 |
| `HAVING` | `having` | Object | `groupBy` メソッド専用。グループ化後の結果に対する絞り込み |
| `SUM()` | `_sum` | Object | `aggregate` / `groupBy` 用。指定カラムの合計値を計算 |
| `AVG()` | `_avg` | Object | `aggregate` / `groupBy` 用。指定カラムの平均値を計算 |
| `MIN()` | `_min` | Object | `aggregate` / `groupBy` 用。指定カラムの最小値を取得 |
| `MAX()` | `_max` | Object | `aggregate` / `groupBy` 用。指定カラムの最大値を取得 |
| `COUNT()` | `_count` | Object / boolean | `aggregate` / `groupBy` 用。件数を計算 |

### crud例
```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 【findUnique】一意条件での取得
/* SELECT "id", "name", "email", "password", "createdAt", "updatedAt" FROM "User" 
 WHERE "id" = 'user-123' LIMIT 1; */
const user = await prisma.user.findUnique({
  where: { id: 'user-123' },
});

// 【findMany】複数件の取得
// SELECT "id", "name" FROM "Customer" WHERE "name" = 'Alice';
const customers = await prisma.customer.findMany({
  where: { 
    name: 'Alice' 
  },
});

// 【include】リレーション先を含めた取得
// (N+1問題けるため、通常2つのクエリに分けて取得しメモリ上で結合):
/* 1. SELECT "id", "name" FROM "Customer" WHERE "id" = 'customer-123' LIMIT 1;
   2. SELECT "id", "amount", "customerId" FROM "Invoice" WHERE "customerId" IN ('customer-123'); */
const customerWithInvoices = await prisma.customer.findUnique({
  where: { id: 'customer-123' },
  include: { invoices: true },
});


// 【create】新規作成
/* INSERT INTO "Invoice" ("amount", "customerId") VALUES (5000, 'customer-123') 
RETURNING "id", "amount", "customerId"; */
const newInvoice = await prisma.invoice.create({
  data: {
    amount: 5000,
    customerId: 'customer-123',
  },
});

// 【update】更新
/* UPDATE "Customer" SET "name" = 'Alice Smith' WHERE "id" = 'customer-122' 
RETURNING "id", "name"; */
const updatedCustomer = await prisma.customer.update({
  where: { id: 'customer-123' },
  data: { name: 'Alice Smith' },
});

// 【delete】削除
// DELETE FROM "Invoice" WHERE "id" = 'invoice-456' RETURNING "id", "amount", "customerId";
const deletedInvoice = await prisma.invoice.delete({:w
  where: { id: 'invoice-456' },
});
```

## migrate
* `npx prisma migrate [dev or deploy]`
* `schema.prisma`と現在のDBの差分を計算、テーブルを作成, 変更するためのSQLファイルが`prisma/migrations`に生成される
* 生成したmigrationsの実行
* 新しいテーブル構造に合わせたClientの再生成(devのみ)
* `npx prisma migrate reset`: テーブルを削除し、migrationを当てなおす