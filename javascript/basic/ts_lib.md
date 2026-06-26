# db
## zod
- tsの動的コンパイラを疑似的に再現
- 疑似コンパイラの制御文, 型の定義, キャスト変換やプロパティ除去etcサポートを一括で行う
```ts
import { z } from 'zod';

// プリミティブ型
const schema = z.type()

// オブジェクト
cosnt userSchema = z.object({
  name: z.string(),
  age: z.number(),
})

// ユニオン
const idSchema = union([z.string(), z.number()]);
const idSchemaOr = z.string().or(z.number());

// 列挙型
const roleSchema = z.enum(['admin', 'user', 'guest']);
```
### 1. プリミティブ・基本型定義
単一の基本データ型や、特定の値そのものを定義する関数です。

| 関数 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `z.type()` | なし | `ZodString` | プリミティブ型を定義する。 |
| `z.date()` | なし | `ZodDate` | Dateオブジェクト型を定義する。 |
| `z.literal()` | `string \| number \| boolean` | `ZodLiteral` | 指定した値との完全一致を要求する型を定義する。 |
| `z.void()` | なし | `ZodVoid` | 戻り値がないこと（undefined）を定義する。 |

### 2. 複合型・構造定義
オブジェクトや配列など、ネスト可能なデータ構造を定義する関数です。

| 関数 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `z.object()` | `{ [key: string]: ZodType }` | `ZodObject` | オブジェクトのプロパティ構造を定義する。 |
| `z.array()` | `ZodType` | `ZodArray` | 指定した型の配列構造を定義する。 |
| `z.record()` | `ZodType` (値の型) | `ZodRecord` | 動的な文字列キーを持つオブジェクト（辞書型）を定義する。 |
| `z.enum()` | `[string, ...string[]]` | `ZodEnum` | 指定した文字列の完全一致のみを許容する列挙型を定義する。 |
| `z.union()` | `[ZodType, ...ZodType[]]` | `ZodUnion` | 複数の型のいずれかに一致することを許容する共用体を定義する。 |
| `z.intersection()` | `ZodType, ZodType` | `ZodIntersection` | 2つの型の両方の条件を満たす交差型（AND）を定義する。 |
| `z.tuple()` | `[ZodType, ...ZodType[]]` | `ZodTuple` | 要素数と各要素の型が固定された配列（タプル）を定義する。 |

### 3. オブジェクト操作（ユーティリティ）
定義済みの `ZodObject` から新しいスキーマを派生させるメソッドです。

| 関数（メソッド） | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `.omit()` | `{ [key: string]: true }` | `ZodObject` | 指定したプロパティを除外した新しいオブジェクトスキーマを生成する。 |
| `.pick()` | `{ [key: string]: true }` | `ZodObject` | 指定したプロパティのみを抽出した新しいオブジェクトスキーマを生成する。 |
| `.extend()` | `{ [key: string]: ZodType }` | `ZodObject` | 既存のオブジェクトスキーマに新しいプロパティを追加または上書きする。 |
| `.merge()` | `ZodObject` | `ZodObject` | 2つのオブジェクトスキーマのプロパティを結合する。 |
| `.partial()` | なし | `ZodObject` | オブジェクトのすべてのプロパティを省略可能（optional）にする。 |
| `.deepPartial()` | なし | `ZodObject` | オブジェクトのネストされたすべてのプロパティを省略可能にする。 |
| `.keyof()` | なし | `ZodEnum` | オブジェクトのキーを列挙型（Enum）として抽出する。 |

### 4. 値の修飾・強制・変換
スキーマに対して、型の変更や値の加工を行う機能です。

| 関数（メソッド） | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `z.coerce.<type>()` | なし | `ZodType` | 入力値を指定した基本型（string, number, boolean, date）へ強制変換（キャスト）してから検証する。 |
| `.transform()` | `(val: T) => U` | `ZodEffects` | 検証通過後の入力値を別の値やデータ型へ変換する。 |
| `.optional()` | なし | `ZodOptional` | 対象の型に対して `undefined` の混入を許容する。 |
| `.nullable()` | なし | `ZodNullable` | 対象の型に対して `null` の混入を許容する。 |
| `.nullish()` | なし | `ZodOptional<ZodNullable>` | 対象の型に対して `null` と `undefined` 両方の混入を許容する。 |
| `.default()` | `T` (デフォルト値) | `ZodDefault` | 入力値が `undefined` の場合に使用する代替値を設定する。 |
| `.catch()` | `T` (代替値) | `ZodCatch` | 検証に失敗した場合、エラーの代わりに指定した代替値を返す。 |

### 5. 制約・バリデーションルール
特定の型に対して、より詳細な検証条件を付与するメソッドです。

| 関数（メソッド） | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `.min/max()` | `number` (閾値) | ベースのZod型 | 文字列の最小/最大文字数、数値の最小値、または配列の最小要素数を規定する。 |
| `.length()` | `number` (指定値) | ベースのZod型 | 文字列の文字数、または配列の要素数を厳密に規定する。 |
| `.regex()` | `RegExp` (正規表現) | `ZodString` | 文字列が指定した正規表現に一致することを要求する。 |
| `.email()` | なし | `ZodString` | 文字列がメールアドレス形式であることを要求する。 |
| `.url()` | なし | `ZodString` | 文字列がURL形式であることを要求する。 |
| `.int()` | なし | `ZodNumber` | 数値が整数であることを要求する。 |
| `.refine()` | `(val: T) => boolean` | `ZodEffects` | 独自のカスタム検証ロジックを追加し、falseを返した場合に検証エラーとする。 |

### 6. パース・実行時検証
定義したスキーマを用いて、実際の入力データを評価するメソッドです。

| 関数（メソッド） | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `.parse()` | `unknown` (検証対象) | `T` (検証済みデータ) | データを検証し、成功時は値を返し、失敗時は例外（`ZodError`）をスローする。 |
| `.safeParse()` | `unknown` (検証対象) | `{ success: boolean, data?: T, error?: ZodError }` | データを検証し、例外をスローせず成功・失敗の状態とデータ（またはエラー）を持つオブジェクトを返す。 |

### 7. 静的型の抽出
ZodスキーマからTypeScriptの型情報を生成するユーティリティです。

| 関数（型） | 引数（型引数） | 戻り値（型） | 説明 |
| :--- | :--- | :--- | :--- |
| `z.infer<T>` | `typeof ZodSchema` | `TypeScript静的型` | Zodスキーマオブジェクトから、対応するTypeScriptの静的型定義を抽出する。 |