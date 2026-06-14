# 型
## 一覧
#### 1. プリミティブ・リテラル（単一・無数の値の集合）
- プリミティブ型の種類(型名をスネークケースで指定)
- プリミティブ型の値 / リテラル型
#### 2. オブジェクト・データ構造（複合的な集合）
- オブジェクト型のプロパティと値の型の組み合わせ
- インデックスシグネチャ / 動的なキーの指定
- 配列型
- タプル型
- class(クラスで生成するオブジェクトの構造が指定される)
#### 3. 関数（[[Call]]を持つオブジェクトの集合）
- Functionオブジェクトの引数を含めた[[Call]]の仕様
- Functionオブジェクトの戻り値単体
#### 4. 特殊型（コンパイラ制御のためのメタ的な集合）
- `any` / `unknown`
- `never`
- `void`
#### 5. 型演算（既存の集合を操作して新たな集合を作る手法）
- ユニオン型 `|`
- インターセクション型 `&`
- `keyof` 演算子
- インデックスアクセス型

## 特殊型
| 特殊な型 | コンパイラへの指示 / バリデーションの挙動 |
| :--- | :--- |
| `any` | すべての型チェックを無効化し、あらゆる操作を許可する。（※原則使用不可） |
| `unknown` | 任意の型を受け入れるが、型ガード等で型を特定・絞り込むまでプロパティアクセスや実行を一切禁止する。 |
| `void` | 関数が明示的に値を返さない（`return`が存在しない、または`return undefined`）ことを保証する。 |
| `never` | 実行フローが絶対にそこへ到達しない、または関数が絶対に正常終了しない（例外を投げる等）ことを示す。 |
| `タプル` | `[number, string]`のように、配列の「要素の数」と「各インデックスの型」を厳格に固定する。 |

## 型の取り扱い
### 型の影響範囲
- 変数に紐づける
  - 変数(引数を含む)への代入
  - プロパティの参照
- 値に対して直接アサーション
- 戻り値の型指定
- ジェネリクスの型引数

### 型の処理プロセス
1. 変数に型を指定する際、毎回型コンストラクタ関数の用に型を呼び出す、この際プレースホルダーに保留される
2. 代入する際は、変数に値を入れると同時に、推論を行い、プレースホルダーの型を補完する
3. 完成した型を変数に紐づける、ジェネリクスが適切ではない場合は、ここでエラー
4. 代入の際は、値を型でバリデートする 

### 型指定例
- `target: type`が基本
```ts
val: type
array: [number, string];
func(args): type

let x: number, y: number;
const array: [number, string];
function funcName(arg): number;
function funcName(arg: number): number; // 実際には引数にも型をつける
```

## TypeScriptにおける型の内包関係（親子関係）一覧
### 概要
（※ 親（広い集合・スーパータイプ） ＞ 子（狭い集合・サブタイプ） の順で論理ソートしています。子を親に代入することは可能です）
#### 1. 宇宙と無（Top型とBottom型）
- `unknown` ＞ [すべての型] ＞ `never`
- `unknown` はすべてを飲み込む親（全集合）
- `never` はどんな型にも内包される最小の要素（空集合）
#### 2. プリミティブとリテラル（値の解像度）
- プリミティブ型 ＞ リテラル型
#### 3. 型演算（集合の拡大と縮小）
- ユニオン型 ＞ 単一の型 ＞ インターセクション型
- 親と子を `&` で結んだ場合、親は吸収されて消える
#### 4. オブジェクト（プロパティの制約）
- プロパティが少ない（条件が緩い） ＞ プロパティが多い（条件が厳しい）
- `{}` （空のオブジェクト） ＞ すべてのオブジェクト型
#### 5. 関数（共変性と反変性）
- 戻り値（共変）：広い戻り値 ＞ 狭い戻り値
- 引数（反変）：狭い引数（要求が厳しい） ＞ 広い引数（何でも受け入れる）


# オブジェクト型の詳細指定とtype/interface
## 型の作成
| 仕様項目 | `type` (型エイリアス) | `interface` |
| :--- | :--- | :--- |
| 定義可能な型 | オブジェクト、プリミティブ、ユニオン、タプル、交差型など全ての型 | オブジェクト型、関数型のみ |
| 拡張（継承）の構文と処理 | `&` 演算子による型の積集合（交差型）の生成 | `extends` キーワードによる継承処理 |
| 同名定義時のコンパイラの処理 | 重複宣言としてコンパイルエラーを発生させる | 宣言のマージ（プロパティの自動結合）を行う |
| Mapped Types の利用可否 | 可能（`{[K in Key]: Type}` の記述ができる） | 不可 |
| インデックスシグネチャの暗黙的推論 | 構造が一致していれば暗黙的に推論される | 明示的に定義しない限り推論されない |

## プロパティ修飾子
| プロパティ修飾子 / 記述 | コンパイラへの指示 / バリデーションの挙動 |
| :--- | :--- |
| `?` (オプショナル) | プロパティの存在を任意にする。キー自体が存在しないこと、または値が `undefined` であることを許容する。 |
| `readonly` (読取専用) | オブジェクトの初期化（定義）時以外のタイミングでのプロパティへの再代入・追加を完全に禁止する。 |
| `[key: string]: Type`（インデックスシグネチャ） | プロパティ名が事前に決まっていない動的なオブジェクトに対し、「任意の文字列のキー」と「その値の型」をまとめて強制する。 |

## インデックスアクセス型
- オブジェクト型のプロパティの型を参照する

## 構文
```ts
// 定義
type UserType = {
  id: number;
  name: string;
};

// [[Call]](実行可能オブジェクトの内部スロット)の定義(シグネチャ定義)
type TypeA = (n: number) => number;

// 型として利用
const user1: UserType = { id: 1, name: "Alice" };

// 特殊型
type Profile = {
  readonly id: number;  // 読取専用（再代入不可）
  name: string;         // 必須プロパティ
  age?: number;         // オプショナル（省略可能）
};

// インデックスアクセス型
type User = { id: number; profile: { age: number; bio: string } };

type UserIdType = User["id"]; // number
type BioType = User["profile"]["bio"]; // string
type UnionAccess = User["id" | "profile"]; // number | { age: number; bio: string }
```
## 型の暗黙的許可
- 必要なプロパティが揃っていれば、余剰プロパティがあろうとも、コンストラクタが別であろうとも許可される
  - ただし直接リテラルを代入する場合は余剰プロパティは許可されない
- `is`や`void`で捻じ曲げた戻り値も同様

## 処理プロセス
### 基礎
#### interface
1. 宣言、プレースホルダーとして定義
2. これ以前に同名の`interface`がある場合、マージする
#### type
1. 同名の宣言がないかチェックし、あればエラー
2. 宣言、プレースホルダーとして定義
#### type代入
- 左辺を宣言

# シグネチャ定義
## 概要
- 関数やオブジェクトのインデックスetcの、引数と戻り値の型を定義
## 定義パターン
- 関数タイプ: シンプルに`[[Call]]`内容を型として定義
- コールシグネチャ: `{}`リテラル内で定義, `[[Call]]`の型として定義される
- メソッドシグネチャ/プロパティシグネチャ: `{}`リテラル内で定義, メソッドとして定義
- コンストラクトシグネチャ: `new`演算子を用いてインスタンス化するオブジェクトの型を定義
- インデックスシグネチャ: プロパティキーと値の型を定義
```ts
// 関数タイプ
type GreetFunction = (name: string, age?: number) => string;

// コールシグネチャ
interface CallableObject {
  // コールシグネチャ
  (x: number, y: number): number;
  // 関数自体にプロパティを持たせることも可能
  description: string; 
}


interface MyInterface {
  // 1. メソッドシグネチャ構文
  methodA(arg: string): void;
  
  // 2. プロパティシグネチャ（関数タイプ）構文
  methodB: (arg: string) => void;
}

// コンストラクタシグネチャ
// 型エイリアス/インターフェイス/クラスでの定義
  type ConstructorType = new (name: string) => MyClass;
  interface ClassConstructor {
    new (name: string): MyClass;
  }
  class MyClass {
    constructor(public name: string) {}
  }
// コンストラクタ関数を引数に取るファクトリ関数の例
  function createInstance(ctor: ClassConstructor, name: string): MyClass {
    return new ctor(name);
  }

// インデックスシグネチャ
interface StringArray {
  [index: number]: string;
}

// オーバーロードシグネチャ(厳密には単体で書くこともできる)
function process(value: number): number;
function process(value: string): string;
```
## シグネチャの特殊構成要素と修飾子
| 構成要素 / 修飾子 (記号) | 適用対象 | 概要と仕様 | 定義例 |
| :--- | :--- | :--- | :--- |
| **オプショナル (`?`) / レスト (`...`)** | 引数 | `?`は引数の省略を許可（必須引数の後方に配置）。`...`は残余引数を配列やタプルとして一括で受け取る。 | `(a: string, b?: number, ...rest: boolean[]) => void` |
| **`this` パラメータ** | 引数（先頭） | 関数内で使われる`this`の型を静的に明示する。コンパイル用であり、実際の呼び出し時の引数（実引数）からは除外される。 | `(this: HTMLElement, e: Event) => void` |
| **Type Predicates (`is`) / Assertions (`asserts`)** | 戻り値 | `is`は関数が`true`を返した際、`asserts`は例外なく終了した際に、対象の引数が特定の型（または条件が真）であることをコンパイラに保証する。 | `(x: any): x is string` / `(x: any): asserts x is string` |
| **ジェネリクス (`<T>`) / `const` 型パラメータ** | シグネチャ全体 | `<T>`は呼び出し時に決定する型変数を定義。`<const T>` (TS 5.0~) は渡された引数をより厳密なリテラル型として推論させる。 | `<const T>(arg: T) => T[]` |
| **`readonly` 修飾子** | プロパティ / インデックス | オブジェクトのプロパティやインデックスシグネチャに対し、初期化後の再代入を禁止（コンパイル時のチェック）する。 | `{ readonly [key: string]: number }` |
| **変性修飾子 (`in` / `out`)** | ジェネリクスの型変数 | `in`は反変性（親クラスの代入を許可）、`out`は共変性（子クラスの代入を許可）をインターフェース等の型パラメータに明示する。 | `interface Handler<in T, out U> { (arg: T): U; }` |

## メソッドシグネチャ/プロパティシグネチャ
- メソッドシグネチャ: 子クラスを受け取る関数も許可する
- プロパティシグネチャ: 自分クラス以上のクラスを受け取る関数しか許可しない
  - 親クラスを受け取る関数を書くという事は、その関数には親クラスのプロパティ参照しかない、つまりその関数に子クラスを入れたとしてもプロトタイプから必ず親クラスにあるプロパティを参照できるから安全


# ユニオンとインターセクション
## 概要
- `typeA | typeB`でor条件の型を作成
- `typeA & typeB`でand条件の型を作成
```ts
type Result = string | number | null;
let data: Result;

type HasName = { name: string };
type HasAge = { age: number };
type Person = HasName & HasAge;
```
## ユニオン型
### 仕様
- 共通プロパティにしかアクセスできない
### 応用用途
- タグ付きユニオン+`never`による型確定+網羅性チェック
```ts
type Success = { status: "success"; data: string };
type Error = { status: "error"; message: string };

type Result = Success | Error;
function handleResult(res: Result) {
  switch (res.status) {
    case "success":
      console.log(res.data);
      break;
    case "error":
      console.error(res.message);
      break;
    default:
      const _exhaustiveCheck: never = res;
      return _exhaustiveCheck;
  }
}
```

### マップドタイプ
- ユニオン型を反復処理し、新しいオブジェクト型を生成
- `{ [反復変数 in ユニオン型]: 型 }`

```ts
type OriginalData = { id: number; name: string };

type ReadonlyPartialData = {
  readonly [K in keyof OriginalData]?: OriginalData[K];
};
// 評価結果: { readonly id?: number; readonly name?: string; }

type MutableRequiredData = {
  -readonly [K in keyof ReadonlyPartialData]-?: ReadonlyPartialData[K];
};
// 評価結果: { id: number; name: string; }
```


## インターセクション型
### 仕様
- 互換性のない型同士を、合わせると`never`型になる
- `[[Call]]`に対する指定を`&`で繋げた場合は、or条件になる
  - プロパティの条件1 & プロパティの条件2 & [[Call]]の条件1 & [[Call]]の条件2
  - プロパティ1が存在して条件を満たしている and プロパティ2が存在して条件を満たしている and ( 引数と戻り値が条件1を満たしている or 引数と戻り値が条件2を満たしている)

### 応用用途
- 幽霊型
- タグ付きユニオン
```ts
// 幽霊型
// __brand という架空のプロパティを合成する
type UserId = string & { readonly __brand: "UserId" };
type PostId = string & { readonly __brand: "PostId" };

function deleteUser(id: UserId) { ... }

// DBから取得した値などに、一度だけ「これは UserId だ」と型を強制付与（キャスト）する
const myUserId = "user_123" as UserId;
const myPostId = "post_456" as PostId;

deleteUser(myUserId); // OK
deleteUser(myPostId); // 💥【コンパイルエラー！】PostId は UserId ではない
deleteUser("user_999"); // 💥【コンパイルエラー！】ただの string も弾かれる
```

# 型の絞り込み
## 必須パターン
- 型が指定されている箇所への代入や指定(引数を含む変数, 戻り値)
- 非共通プロパティへのアクセス
- 型によって処理の異なる演算

## 型の確定方法
### 基本
- Type Guards(型ガード)にあたるもの
  - jsに元々ある演算を用いた絞りこみ
  - `is`, `asserts`
- タグ付きユニオン
- `as`(型アサーション), `variable!`(Non-nullアサーション)
- 暗黙の確定
### 関数の戻り値を受け取る際に確定
- シグネチャ定義
- ジェネリクス

## tsコンパイラ制御用キーワード
| キーワード | 構文例 | 用途 / コンパイラの挙動 |
|-----------|--------|------------------------|
| `is` | `function check(x): x is string` | （ユーザー定義型ガード）戻り値が `true` の場合、呼び出し元のスコープで変数の型を確定させる。 |
| `asserts` | `function assert(x): asserts x is string` | （アサーション関数）この関数を例外なく通過した時点で、それ以降のパスにおける変数の型を確定させる。 |
| `as` | `val as string` | （型アサーション）CFGの解析を無視し、「これは `string` だ」とコンパイラを強制的に黙らせる。※絞り込みではなく上書き。 |
| `!` | `val!` | （Non-null アサーション）CFGの解析を無視し、「`null` や `undefined` ではない」とコンパイラを強制的に黙らせる。※絞り込みではなく型の強制的な除外。 |

## 暗黙の確定
- 実行前に既に型が確定している値を入れた場合、暗黙的に型が確定する

# Type Guards
## 概要
- 特定のスコープで、型を絞り込む条件式や関数の総称

## TSが型推論に流用する演算子
| 演算子 / 構文 | 対象 | 用途 / コンパイラの挙動 |
|-------------|------|------------------------|
| `typeof` | プリミティブ | `if (typeof x === "string")` で `string` に確定させる。 |
| `instanceof` | クラス・日時等 | `if (x instanceof Date)` でプロトタイプチェーンを検証し型を確定させる。 |
| `in` | オブジェクト | `if ("id" in obj)` で、そのプロパティを持つオブジェクト型（またはユニオンの片方）に確定させる。 |
| `===` / `!==` | リテラル値 | `if (status === "success")` で、特定のリテラル型に絞り込む（タグ付きユニオンで頻出）。 |
| 真偽値評価 | `null` / `undefined` | `if (val)` で、Falsyな値（`null` や `undefined`）を型空間から削ぎ落とす。 |

```js
class User {
  constructor(name, age) {
    this.name = name;
  }

  greet() {
    console.log(`こんにちは、私は${this.name}です。`);
  }
}

const user = new User("Taro");
setTimeout(user.greet(), 1000);
```

# ジェネリクス
## 概要
- 型を引数のように受け取る仕組み
- オブジェクト型指定の3つに使える(関数シグネチャ, type, interface)
- type代入では式を使用可能なため、三項演算子による条件分岐と書き換え可能
```ts
function identity<T>(arg: T): T {
  return arg;
}
// 引数が文字列なので、T は string と推論される
const res1 = identity("hello"); 
// 引数が数値なので、T は number と推論される
const res2 = identity(123);

// typeやinterfaceにも使える
interface ApiResponse<Data> {
  status: number;
  message: string;
  data: Data;
}

// 三項演算子
type GetTypeName<T> = 
  T extends string ? "文字列です" :
  T extends number ? "数値です" :
  T extends boolean ? "真偽値です" :
  "それ以外の何かです";
```

## 型の推論
- 引数からの推論
- 拡大解釈と`const`の違い
  - リテラル型を渡した場合、リテラル値そのものではなく、そのリテラルのプリミティブ型と拡大解釈する
  - しかし、最終的に`const`変数にプリミティブ型が直接代入される場合に限り、この拡大解釈が無効かされる
    - ※オブジェクトリテラルのプロパティの値から推論する際は、通常通り拡大解釈される
- 推論が衝突した場合、`union`にする
- 関数の引数と同じように、`=`でデフォルト値の設定ができる
- デフォルト値は`unknown`

```ts
// K: "id", V: number と推論される
function makePair<K, V>(key: K, value: V) { 
  console.log(`value: ${value}`);
  return key;
}
const key = makePair("id", 404);

// string扱い プロパティからも推論される(constでも拡大解釈)
function wrap<T>(value: T): { item: T } { 
  return { item: value };
}
const result = wrap("hello");

// コールバック関数の引数からも推論(string)
function registerCallback<T>(callback: (data: T) => void): void { /* ... */ }
const myCallback: (data: string) => void = (data) => {
  console.log(data.toUpperCase());
};
registerCallback(myCallback);


// T = number | string
function choose<T>(a: T, b: T): T { 
  return Math.random() > 0.5 ? a : b;
}
const result = choose(100, "hello");

// fetchの戻り値の型から、次の .then の value の型が推論される
fetch("https://api.example.com") // Promise<Response> を返す
  .then((res) => res.json())     // res は Response 型だと推論される！
```

## ジェネリクスのインスタンス化
- ジェネリクスが型の一部として定着する現象
- 戻り値や代入元する型にジェネリクスが含まれる場合に発生
```ts
// 例1：関数のシグネチャ（定義）による型の伝播
type A = { id: number };
type Obj<T> = { payload: T };

declare function x(): Obj<A>;
declare function y<T>(input: Obj<T>): T;

const var1 = x();       // 型推論: Obj<A>
const result = y(var1); // 型推論: A

// 例2：変数のアノテーション（静的宣言）による型の伝播
type Box<T> = { payload: T };
declare function observe<T>(input: Box<T>): T;

const boxA: Box<number> = { payload: 100 };
const boxB = { payload: "hello" } as Box<string>;

const resultA = observe(boxA); // 型推論: number
const resultB = observe(boxB); // 型推論: string
```

## ジェネリクス用識別子
### 一覧
| トークン | 記述例 | 説明 |
| :--- | :--- | :--- |
| `typeof` | `typeof value` | JSの変数や関数の定義から型を抽出する |
| `extends` | `<T extends string>` | 型の可動域を制限する（制約）、または型の条件分岐（三項演算子）の条件式として使用する |
| `keyof` | `keyof T` | オブジェクト型からプロパティ名の一覧をユニオン型（`"id" \| "name"` など）として抽出する |
| `infer` | `extends (infer U)[]` | 三項演算子の条件式の`extends`右側で、パターンマッチングで型を推論(抽出) |
| `=` | `<T = string>` | ジェネリクスの型引数が省略された際や、推論できなかった際のデフォルト型を指定する |
| `in` | `[K in keyof T]` | マップドタイプ内で、ユニオン型の要素を順番に反復処理して新しいオブジェクトのキーを展開する |
| `as` | `[K in keyof T as NewKey]` | マップドタイプ内で、キーの名前を別の名前に変換（再マッピング）したり、条件によって除外したりする |
| `readonly` | `readonly [K in keyof T]` | オブジェクトのプロパティの書き換え（再代入）を禁止する |
| `?` | `[K in keyof T]?: T[K]` | オブジェクトのプロパティを省略可能にする |
| `-` / `+` | `-readonly [K in keyof T]-?` | マップドタイプで元の型が持つ `readonly` や `?` を強制削除（`-`）または付与（`+`）する |

### 詳細
#### keyof
```ts
// keyof
type User = {
  id: number;
  name: string;
  email: string;
};
type UserKey = keyof User; // type UserKey = "id" | "name" | "email";

const key1: UserKey = "name"; // OK
const key2: UserKey = "id";   // OK
const key3: UserKey = "age";  // エラー


// keyof + extends
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

const user = { id: 1, email: "test@example.com" };
getProperty(user, "email"); // OK
getProperty(user, "password"); // エラー
```

#### infer詳細
- 変数を展開し終えた後のコードを文字列としてとらえて、パターンマッチをして型を抽出
```ts
type UnpackArray<T> = T extends (infer U)[] ? U : T;
type A = UnpackArray<string[]>; // => string
type B = UnpackArray<number>;   // => number （一致しなかったのでそのまま）

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type ResponseType = Promise<{ id: number; name: string }>; // APIレスポンスなどの型, ここが型の定数のようなもの
type Data = UnwrapPromise<ResponseType>; // => { id: number; name: string }
```

#### その他
- `typeof`で関数を指定する際は、`[[Call]]`全体のアロー記法による定義に変換されるため注意

#### NoInfer<T>(※ ver5.4~)
- 指定した対象を暗黙の推論に組み込まない
```ts
// NoInferがないと弾きたいxを弾けない例
function createOptions<T extends string>(validOptions: T[], defaultOption?: NoInfer<T>) { /* */ }

createOptions(["a", "b", "c"], "x");
```

# tsの欠陥解決と、冗長回避
## アンビエント宣言
- `declare`
- 対象の識別子は、外部環境に既に存在している という事実を強制的に宣言

```ts
declare var myGlobalVar: string;
declare function ga(command: string, ...fields: any[]): void;

// 外部モジュールの型を定義
declare module 'my-legacy-library' {
  export function doSomething(value: number): string;
  export const version: string;
}
// すべてany扱いにする
declare module 'my-legacy-library';

// 全ての .png ファイルをモジュールとして扱えるようにする
declare module '*.png' {
  const src: string;
  export default src;
}

// 既存のグローバル空間の拡張
interface Window {
  myCustomApi: {
    init(): void;
  };
}
```

## satisfies
1. `satisfies`の左辺に対して、右辺の型のルールを守っているかチェック
2. 通った場合、左辺の型を、左辺から推論した新たな詳細な型に確定させる

- プロパティの値からプロパティ(主に`push`のような)を呼ぶような場合の冗長性を解消
1. オブジェクトのプロパティの値をユニオンで指定
2. プロパティを呼ぶ際、値に型ガードをかける
3. そこから更に内プロパティを呼ぶ

```ts
type ConfigRule = Record<string, string | string[]>;

const myConfig = {
  routes: ["/home", "/about"],
  theme: "dark",
} satisfies ConfigRule; // 推論結果を固定: { routes: string[]; theme: string; }
```


# 組み込み
## 仕様
- コンパイラの裏側にある`lib.d.ts`という巨大な型定義ファイル群（数万行に及びます）にすべて記述されている

## 型一覧表
### ECMAScript
| グローバルオブジェクト / 関数 | 用意されている主な型定義 | TypeScript固有の挙動・注意点（コンパイラの評価事実） |
|---|---|---|
| Array | `Array<T>` / `ReadonlyArray<T>` | 初期化時の要素、または代入元の型から `T` が推論され、内部メソッドのシグネチャ（例: `push(...items: T[])`）に `T` が一括で適用されます。 |
| Promise | `Promise<T>` / `Awaited<T>` | `new Promise<T>` の `resolve` 引数、または非同期関数の戻り値から `T` が確定し、`then(onfulfilled: (value: T) => U)` の評価によって後続の戻り値が `Promise<U>` へと連鎖的に推論されます。 |
| JSON | `JSON` | メソッドの戻り値が `JSON.parse(text: string): any` と定義されているため、パース結果に対する型推論は働かず、常に `any` 型としてコンパイル時評価を通過します。 |
| Map, Set | `Map<K, V>` / `Set<T>` | コンストラクタ引数（例: `new Map([["a", 1]])`）から型引数が推論されます。引数が空の場合は `Map<any, any>` にフォールバックされるため、明示的な型指定 `<K, V>` が要求されます。 |
| Object | `Object` | すべてのオブジェクトの基底型ですが、任意のプロパティアクセスは型エラーになります。動的キーの評価には `Record<string, unknown>` 等のインデックスシグネチャの定義が必要です。 |
| Math, Date, RegExp | `Math` / `Date` / `RegExp` | ジェネリクスを持たず、プロパティやメソッドの引数・戻り値（例: `Math.abs(x: number): number`）がすべて静的な型として固定されています。 |
| Error | `Error` / `TypeError` など | コンパイラオプション `useUnknownInCatchVariables` が有効な場合、`catch (e)` ブロックの変数 `e` は自動的に `unknown` 型として推論され、`Error` 型への暗黙的推論は行われません。 |

### Web APIs
| グローバル関数 / 定数 | 用意されている主な型定義 | TypeScript固有の挙動・注意点（コンパイラの評価事実） |
|---|---|---|
| fetch | `Promise<Response>` | 戻り値は `Promise<Response>` に固定されています。後続の `Response.json()` メソッドの戻り値も `Promise<any>` として定義されており、レスポンス内容に基づく型の推論は行われません。 |
| document | `Document` / `HTMLElement` / `Event` | `getElementById(elementId: string): HTMLElement | null` のように、DOM取得メソッドの戻り値は常に `null` とのユニオン型として静的に評価されます。 |
| window | `Window` | `lib.dom.d.ts` において定義されるインターフェースであり、グローバルスコープ上の変数や関数はすべてこのインターフェースのプロパティとして型解決されます。 |
| localStorage / sessionStorage | `Storage` | `getItem(key: string): string | null` として定義されており、保存時の値の型に関わらず、取得時の推論は常に `string | null` に固定されます。 |
| setTimeout / setInterval | `number` | `lib.dom.d.ts` 環境下では戻り値が `number` 型として評価されます（Node.jsの型定義 `@types/node` がプロジェクトに混入している場合、`NodeJS.Timeout` 型との間で推論の衝突・分岐が発生します）。 |
| console | `Console` | `console.log(...data: any[]): void` のように、引数に任意の型を受け入れるように可変長引数（Rest parameters）として静的に定義されています。 |

## ユーティリティ一覧表
| 目的 | ユーティリティ | 実装 | 説明 |
| :--- | :--- | :--- | :--- |
| 全オプショナル化 | `Partial<T>` | `{ [P in keyof T]?: T[P]; }` | 型 `T` のすべてのプロパティに対し `?` 修飾子を付与したオブジェクト型を生成する。 |
| 全必須化 | `Required<T>` | `{ [P in keyof T]-?: T[P]; }` | 型 `T` のすべてのプロパティから `?` 修飾子を除去したオブジェクト型を生成する。 |
| 全読取専用化 | `Readonly<T>` | `{ readonly [P in keyof T]: T[P]; }` | 型 `T` のすべてのプロパティに対し `readonly` 修飾子を付与したオブジェクト型を生成する。 |
| 辞書型生成 | `Record<K, T>` | `{ [P in K]: T; }` | 型 `K` の各要素をプロパティキーとし、型 `T` をプロパティ値とするオブジェクト型を生成する。 |
| プロパティ抽出 | `Pick<T, K>` | `{ [P in K]: T[P]; }` | 型 `T` から型 `K` に該当するプロパティキーとその値を抽出したオブジェクト型を生成する。 |
| プロパティ除外 | `Omit<T, K>` | `Pick<T, Exclude<keyof T, K>>` | 型 `T` から型 `K` に該当するプロパティキーを除外したオブジェクト型を生成する。 |
| ユニオン要素除外 | `Exclude<T, U>` | `T extends U ? never : T` | ユニオン型 `T` の構成要素のうち、型 `U` に割り当て可能な型を除外（`never` として評価）した型を生成する。 |
| ユニオン要素抽出 | `Extract<T, U>` | `T extends U ? T : never` | ユニオン型 `T` の構成要素のうち、型 `U` に割り当て可能な型のみを抽出した型を生成する。 |
| Nullish除外 | `NonNullable<T>` | `T & {}` | 型 `T` から `null` および `undefined` を除外した型を生成する。 |
| 戻り値型抽出 | `ReturnType<T>` | `T extends (...args: any) => infer R ? R : any` | 関数型 `T` のシグネチャから戻り値の型（`R`）を推論して抽出する。 |
| 引数型抽出 | `Parameters<T>` | `T extends (...args: infer P) => any ? P : never` | 関数型 `T` のシグネチャから引数型のタプル型（`P`）を推論して抽出する。 |

# スコープやファイル
## スコープ
- 変数や関数と同じように`import`, `export`が可能
## .d.ts
- グローバル変数のアンビエント宣言など、実行コードは書かないファイル
  - 対応する.jsファイルをトランスパイルしない
  - ファイル内のトップレベル宣言は、暗黙的にアンビエント宣言される

# package
- @types/node: Node.jsの組み込みモジュールAPIの.d.ts