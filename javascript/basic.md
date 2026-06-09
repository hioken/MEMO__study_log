# CoreBasic
## 基礎
| 名称                | 説明                                                                                   |
|----------------------------------|---------------------------------------------------------------------------------------|
| 暗黙的な型変換 (implicit type coercion)        | 違う型同士で演算を行う際、型変換が行われる                                 |
| ホイスティング (Hoisting)        | ver変数や関数宣言を最初にメモリ内に保存(スコープの先頭に持ち上げる)。                                 |
| プロトタイプチェーン (Prototype Chain) | オブジェクトが他のオブジェクトを継承し、プロパティやメソッドを共有する仕組み。               |
| thisバインディング (this Binding) | 呼び出し方により`this`が何を指すかが変わるJavaScript特有の仕組み。                      |
| 即時実行関数 (IIFE: Immediately Invoked Function Expression) | 定義と同時に実行される関数で、スコープ汚染を防ぐ用途で使われる。                       |
| 厳格モード (Strict Mode)          | `use strict`でエラーチェックを厳密にし、曖昧な挙動を防ぐモード。                        |
| グローバルオブジェクト (Global Object) | 環境ごとに異なるが、ブラウザでは`window`、Node.jsでは`global`として存在。               |
| グローバル汚染 (Global Pollution) | 不要なグローバル変数やオブジェクトを追加して競合やバグを引き起こす問題。                 |
| カリー化 (Currying)               | 関数の引数を部分適用する形で分割し、順次呼び出す形で実行するテクニック。                  |
| コンテキスト (Execution Context)  | コードが実行される環境情報で、`グローバル`、`関数`、`eval`の3種類がある。               |
| イベントバブリング (Event Bubbling) | DOMイベントが子要素から親要素へ伝播する挙動。`stopPropagation`で制御可能。              |

## 非同期関連
| 名称                | 説明                                                                                   |
|----------------------------------|---------------------------------------------------------------------------------------|
| 非同期処理 (Asynchronous Processing) | タスクを並行して処理する仕組み。代表的な手法はコールバック、`Promise`、`async/await`。     |
| イベントループ (Event Loop)       | 非同期処理を管理する仕組み。タスクキューからイベントを順次取り出して処理。               |
| コールバック (Callback)           | 非同期タスク完了時に実行する関数。ネストが深くなりやすく、`Promise`で置き換え可能。        |
| プロミス (Promise)                | 非同期処理の状態を管理するオブジェクト。`pending`、`fulfilled`、`rejected`の3状態を持つ。  |
| async/await                      | `Promise`を使った非同期処理を同期的な記述で書ける構文。                                 |
| マイクロタスク (Microtask)        | 非同期処理のタスクキューより優先度の高いタスク。`Promise`の処理が該当。                  |
| タスクキュー (Task Queue)         | イベントループで処理される非同期タスクが順番に格納されるキュー。                        |

## グローバルオブジェクト
### 概要
- グローバルオブジェクトは、JavaScriptのどのスコープからもアクセス可能な特別なオブジェクト。
- ビルトインオブジェクト（例: `Object`, `Array`）やグローバル関数（例: `setTimeout`, `console`）を管理する。
- 環境ごとに異なる形で提供される。
  - ブラウザ環境: `window`（または `globalThis`）
  - Node.js環境 `global`（または `globalThis`）

### 仕様
- トップレベルに定義した関数とvar変数(非推奨)は、グローバルオブジェクトのプロパティとして登録される
- グローバルオブジェクトの参照はRubyのクラス参照に似ている
  - Rubyでは、全てのトップレベルのコードが`Object`クラスに囲まれているように、JavaScriptではすべてのトップレベルコードがグローバルオブジェクト（例: `window`）に囲まれていると捉えられる。
  - ブラウザ上のJavaScriptで`window`を参照するのは、Rubyでクラス内から自分自身のクラスを呼び出す感覚に近い。
    - 例えば、Rubyのクラス内で`self`を使う感覚で、JavaScriptではグローバルオブジェクト（ブラウザでは`window`）を参照できる。
  - 例えば、`const window = {};`で囲まれたコード内で`window`を利用しているようなイメージ。

### `globalThis`の利用
- ECMAScript 2020（ES11）で導入。
- 環境に依存せず、グローバルオブジェクトを参照可能。

```javascript
globalThis.myValue = 42;
console.log(globalThis.myValue); // 42
```

## フォーマット
### 説明
- 他言語やサーバーとやり取りする時に使うフォーマット
- 普段は文字列として振舞い、jsで簡単にオブジェクトに変換できる
### json
- 配列やオブジェクトリテラルが使える
- オブジェクトリテラルを使う場合、プロパティも文字列にする必要がある
- シングルクォーテーションが使えない


## strictモード
- onにする条件
  - スクリプトスコープで`use strict`を記述
  - モジュールスコープ内
  - classブロック内

| 項目                     | Strictモード (`"use strict"`) | 非Strictモード (通常のスクリプト) |
|--------------------------|-----------------------------|------------------------------|
| 暗黙のグローバル変数    | × `ReferenceError` (`foo = 10;` はエラー) | ○ `window.foo` に登録される |
| `this` の挙動（グローバル） | × `undefined` | ○ `window`（ブラウザ） |
| `this` の挙動（関数内） | × `undefined` | ○ `window`（ブラウザ） |
| `delete` で変数削除      | × `SyntaxError` | ○ `delete obj.prop` はOK |
| `eval` 内の変数の影響   | × 外部のスコープに影響なし | ○ `eval` 内の変数が外部に影響する |
| `with` ステートメント    | × `SyntaxError` | ○ 使用可能 |
| 同じ名前のパラメータ     | × `SyntaxError` (`function(a, a) {}` はエラー) | ○ 許可される |
| `arguments` の変更      | × 変更不可 (`arguments[0] = 100;` は無効) | ○ 変更可能 |
| `arguments.callee`      | × `TypeError` | ○ 使用可能 |
| 予約語の変数名使用      | × `SyntaxError` (`let public = 1;`) | ○ 許可される（※ただし非推奨） |


# Basic
## Scope
### 順序
1. グローバルスコープ
2. スクリプトスコープ
3. ブロックスコープ, 関数スコープ
### ブロックスコープ
- Jsでは`{}`でスコープを区切る事ができる
### 参照範囲
- Jsでは外部(レキシカルLexical)スコープが参照可能
- そのスコープで参照しようとした変数や関数がない場合、一つ外のスコープを参照する
  - つまり同名の定義がされていた場合、より内側のスコープのものが参照される

## 変数
### 種類
| 特徴              | const                                      | let                               |
|-------------------|--------------------------------------------|-----------------------------------|
| **再代入**        | 不可                                       | 可能                              |
| **再宣言**        | 不可                                       | 不可                              |
| **初期化**        | 必須                                      | 不要                      |
| **値の変更**      | 不可(参照型の内部変更は可能)                     | 値そのものを自由に変更可能        |
| **スコープ**      | ブロックスコープ（{}内で有効）              | ブロックスコープ（{}内で有効）     |
### TDZ(Temporazy Dead Zone)
- 変数の宣言ロジック
1. 処理がスコープに入ると、処理内のlet, const宣言を先に検知し、同名変数参照時に外部を参照しなくなる(TDZ)
2. 処理が宣言行に移ると始めて初期化される
- この1と2の間で先に変数を呼び出してしまうと、外部に同名変数があったとしても参照されずエラーになる
- コード例
```js
let a = 1;
function fn1() {
  // let a = 2;
  console.log(a);
  let a = 3;
}
fn1();

```
### 宣言方法
```js
let a = 1, b = 2;
let [c, d] = [1, 2];

const obj = {prop: 1};
let {prop} = obj;
```

## Object
### プリミティブ型
#### 一覧
| データ型         | リテラル例                           | 説明                                                                                       |
|------------------|-------------------------------------|------------------------------------------------------------------------------------------|
| 数値型 (Number)   | 42, 3.14, NaN, Infinity            | 整数や浮動小数点数を表す。特殊値`NaN`や`Infinity`も含む。                                     |
| 文字列型 (String) | 'hello', "world"                   | テキストデータを表す。文字列は`''`または`""`で囲む。                                           |
| 真偽値型 (Boolean)| true, false                        | 真(`true`)または偽(`false`)の論理値を表す。                                                    |
| 未定義型 (Undefined) | undefined                         | 値が割り当てられていないことを示す。                                                         |
| Null型 (Null)     | null                               | 意図的に値が存在しないことを表す。                                                           |
| シンボル型 (Symbol)| Symbol('id')                      | ユニークな識別子を生成するための型。主にオブジェクトのプロパティキーとして利用。                 |
| ビッグイント型 (BigInt) | 123n, BigInt(123)                | 任意の大きさの整数を表す型。`n`を末尾に付けることで表現。                                       |

#### 基本仕様
- プリミティブ型に対して、[ラッパーオブジェクト](#ラッパーオブジェクト)のメソッドを実行すると、以下のロジックで処理が行われる
1. ラッパーオブジェクトを生成
2. ラッパーオブジェクトから指定のメソッドが呼び出す
3. 呼び出しに成功した場合は戻り値、失敗した場合は`undefined`を返す
4. ラッパーオブジェクトを破棄

#### メソッド
| データ型 | メソッド名 | 引数 | 戻り値 | 説明 |
|----------|------------|------|--------|------|
| **String** | `slice` | (`start`, `end`) | 指定範囲の文字列 | `start` から `end` の手前までを取得 |
|          | `substring` | (`start`, `end`) | 指定範囲の文字列 | `start` > `end` の場合は自動で入れ替え |
|          | `substr` | (`start`, `length`) | 指定範囲の文字列 | `start` から `length` 文字を取得（非推奨） |
|          | `replace` | (`pattern`, `replacement`) | 置換後の文字列 | `pattern` にマッチした部分を `replacement` に置換 |
|          | `replaceAll` | (`pattern`, `replacement`) | 置換後の文字列 | `pattern` にマッチするすべての部分を `replacement` に置換 |
|          | `toUpperCase` | なし | 大文字に変換した文字列 | すべての文字を大文字に変換 |
|          | `toLowerCase` | なし | 小文字に変換した文字列 | すべての文字を小文字に変換 |
|          | `trim` | なし | 前後の空白を除去した文字列 | 前後のスペースを削除 |
|          | `trimStart` | なし | 先頭の空白を除去した文字列 | `trimLeft` のエイリアス |
|          | `trimEnd` | なし | 末尾の空白を除去した文字列 | `trimRight` のエイリアス |
|          | `charAt` | (`index`) | 指定位置の1文字 | `index` 位置の文字を取得 |
|          | `charCodeAt` | (`index`) | 指定位置のUnicode値 | `index` 位置の文字の Unicode コードを返す |
|          | `includes` | (`searchString`, `position`) | `true` or `false` | `searchString` が含まれるか判定 |
|          | `startsWith` | (`searchString`, `position`) | `true` or `false` | `searchString` で始まるか判定 |
|          | `endsWith` | (`searchString`, `length`) | `true` or `false` | `searchString` で終わるか判定 |
|          | `repeat` | (`count`) | 繰り返した文字列 | `count` 回繰り返す |
|          | `split` | (`separator`, `limit`) | 配列 | `separator` で分割し、配列で返す |
|          | `padStart` | (`targetLength`, `padString`) | 埋めた文字列 | `targetLength` に達するまで `padString` で埋める |
|          | `padEnd` | (`targetLength`, `padString`) | 埋めた文字列 | `targetLength` に達するまで `padString` で埋める |
| **Number** | `toFixed` | (`digits`) | 文字列 | 小数点以下 `digits` 桁で丸めた文字列を返す |
|          | `toExponential` | (`digits`) | 文字列 | 指定した桁数で指数表記に変換 |
|          | `toPrecision` | (`precision`) | 文字列 | 指定した精度で丸めた文字列を返す |
|          | `toString` | (`radix`) | 文字列 | 指定した進数の文字列を返す |
|          | `valueOf` | なし | 数値 | 数値をそのまま返す |
| **Boolean** | `toString` | なし | 文字列 | `"true"` または `"false"` を返す |
|          | `valueOf` | なし | 真偽値 | `true` または `false` をそのまま返す |
| **BigInt** | `toString` | (`radix`) | 文字列 | 指定した進数の文字列を返す |
|          | `valueOf` | なし | `BigInt` | `BigInt` をそのまま返す |
| **Symbol** | `toString` | なし | 文字列 | `Symbol` を文字列として表現 |
|          | `valueOf` | なし | `Symbol` | `Symbol` をそのまま返す |
|          | `description` | なし | 文字列または `undefined` | `Symbol("desc")` の `"desc"` を取得 |

#### シンボル
- 一意の値を返すデータ
- `Symbol()`の戻り値
- 引数で名前付けを行うことが出来る
  - この際、名前が重複していても実際の値は違うため、あくまでラベル付けというだけ

### オブジェクト型基礎
#### 派生一覧
| **データ型**   | **リテラル例**      | **説明** |
|--------------|-----------------|-------------------------------|
| **Object**   | `{ key: "value" }` | **すべてのオブジェクトの基底**となる型。任意のキーと値を持つ。 |
| **Array**    | `[1, 2, 3]`       | **順序付きのデータの集合**。インデックス番号で要素を管理。 |
| **Function** | `function() {}`   | **関数オブジェクト**。実行可能なコードブロックを持つ。 |
| **Date**     |                   | **日時を扱うオブジェクト**。日時計算やフォーマット変換が可能。 |
| **RegExp**   | `/\d+/`           | **正規表現を扱うオブジェクト**。文字列のパターンマッチに使用。 |
| **Error**    |                   | **エラー情報を表すオブジェクト**。例外処理に利用。 |
| **Map**      |                   | **キーと値のペアを保持するオブジェクト**。キーは任意の値を使用可能。 |
| **Set**      |                   | **重複のない値の集合を扱うオブジェクト**。順序を保持。 |
| **WeakMap**  |                   | **キーにオブジェクトのみを使用可能な Map**。ガベージコレクションの影響を受ける。 |
| **WeakSet**  |                   | **オブジェクトのみを要素に持つ Set**。ガベージコレクションの影響を受ける。 |
| **WeakRef**  |                   | **オブジェクトのみを要素に持つ 単一オブジェクト**。ガベージコレクションの影響を受ける。 |
| **Promise**  |                   | **非同期処理の結果を表すオブジェクト**。成功/失敗の状態を持つ。 |
| **Proxy**    |                   | **オブジェクトの動作をカスタマイズできるオブジェクト**。 |
| **Reflect**  |                   | **オブジェクトの操作をメソッド化した API**（`Reflect.get()` など）。 |

#### 基本仕様(Object)
- プロパティとディスクリプターのセットを複数保持できるオブジェクト
  - プロパティに型の区別はなく、全て文字列として扱われる
  - 正確には特殊なケースでシンボルもプロパティとして扱える
- valueを呼び出す際は、`obj.prop`または、`obj['prop']`で呼び出す
  - []の値が数値の場合、暗黙的な型変換が行われる
```js
// 宣言
let obj = {
  prop1: 'value',
  prop2: function() {
    console.log('prop2');
  }
};

// プロパティへのアクセス
obj.property; obj['property'];

// 定義されている変数を使った省略記法
// 引数等でも可能
const name = "Alice";
const obj = { name }; // { name: "Alice" } と同じ

```
- メソッド構文を使うことで、プロトタイプチェーン上で特殊な扱いを受けるメソッド関数を定義出来る
- ECMAや拡張機能機能から、特殊なオブジェクト型を作成できるFunctionが多く提供されている
- メソッド

| **メソッド名**                                | **引数**                         | **説明** |
|---------------------------------------------|---------------------------------|---------|
| `Object.${keys \| values}`                  | `obj`                           | `Symbol` を含まない `key` \| `value` の配列を取得 |
| `Object.entries`                            | `obj`                           | `[key, value]` のペア配列を取得 |
| `Object.fromEntries`                        | `Array<[key, value]>`           | 配列からオブジェクトを作成（`entries` の逆） |
| `Object.assign`                             | `target, ...sources`            | オブジェクトをコピー（浅いコピー） |
| `structuredClone`                           | `obj`                           | オブジェクトを深くコピー（`deep copy`） |
| `Object.create`                             | `proto, propertiesObject?`      | 指定した `proto` を持つオブジェクトを作成 |
| `Object.${get \| set}PrototypeOf`           | `obj` \| `obj, proto`           | プロトタイプ (`__proto__`) を 取得 \| 変更（`set` は非推奨） |
| `Object.getOwnProperty${Names \| Symbols}`  | `obj`                           | 通常のキー \| `Symbol` のキー一覧を取得 |
| `Object.getOwnPropertyDescriptors`         | `obj`                           | プロパティの詳細情報（`writable`, `enumerable` など）を取得 |
| `Object.define${Property \| Properties}`    | `obj, key, descriptor` \| `obj, propsObject` | プロパティの詳細設定を変更（1つ \| 複数） |
| `Object.${freeze \| seal \| preventExtensions}` | `obj`                           | **変更制限**: `freeze`（変更不可）\|`seal`（追加・削除不可）\|`preventExtensions`（追加不可） |
| `Object.is${Frozen \| Sealed \| Extensible}` | `obj`                           | オブジェクトの状態をチェック（`freeze` されているか \| `seal` されているか \| 拡張可能か） |
| `Object.hasOwn`                             | `obj, key`                      | 指定したキーがオブジェクト自身に存在するかを安全に確認 |
| `Object.groupBy`                            | `array, callback`               | 配列の要素を指定したキーごとにグループ化 |



### ディスクリプター
#### 概要
- プロパティに設定できるオプション
#### 説明
- `value`: 値
- `writable`: 値の変更の可否
  - `true` or `false`
- `configurable`: プロパティの削除 + ディスクリプタの変更の可否
  - `true` or `false`
- `enumerable`: 列挙可能性
  - `true` or `false`
  - プロトタイプチェーン上の位置に関係なく、プロパティ一覧を参照する処理に含めなくする
  - ただし一部処理には無効(`Object.getOwnPropertyNames()`, `Object.getownPropertyDescriptors()`, `Reflect.ownKeys()`, `in`, `for of`)
- `get`: `.`及び`[]`でプロパティが取得された際の処理
  - `undefined` or `function`
- `set`: プロパティに対して`=`を行った際の処理
  - `undefined` or `function`
- getter, setterは内部メソッド`[[get]]`, `[[set]]`の中で呼ばれる
#### 操作
- 取得: `Object.getOwnPropertyDescriptor(obj, "prop")`
- 編集: `Object.defineProperty` or `Object.defineProperties`
```js
const obj = {};
Object.defineProperty(obj, "key", {
  value: "value",
  writable: false,
  enumerable: true
});
console.log(obj.key);
obj.key = "new value"; // 無視される
```
### 派生オブジェクト1
#### 簡易比較
| 特性 | Object | Array | Map | Set |
|------|--------|-------|-----|-----|
| 順番の保証 | なし（ES6以降は順序保持だが、`number`キーは順序制御される） | あり（インデックス順） | あり（挿入順） | あり（挿入順） |
| 値の重複 | 可能 | 可能 | 可能 | 不可 |
| 値単体の取得 | キー指定 | キー指定 | キー指定 | 不可 |
| 全てのキー取得 | `Object.keys(obj)` | `Object.keys(arr)` | `map.keys()` | 不可 |
| 全ての値取得 | `Object.values(obj)` | `Object.values(arr)` | `map.values()` | `set.values()` |
| Objectのメソッド | 使用可能 | 使用可能 | 不可 | 不可 |

※[ループ文](#各オブジェクトの対応)

#### オブジェクト(Object)
[オブジェクト型基礎](#オブジェクト型基礎)

#### マップ(Map)
- プロパティの型に制限がない({}をキーにしたりもできる)
- `Object.prototype`を継承していない
- メソッド

| **メソッド名** | **引数**                 | **戻り値**                  | **説明** |
|--------------|---------------------|----------------------|---------|
| `set`        | `キー, 値`           | `Mapオブジェクト`    | 指定したキーに対応する値を設定 |
| `get`        | `キー`               | `値` または `undefined` | 指定したキーに対応する値を取得 |
| `has`        | `キー`               | `true` または `false` | 指定したキーが存在するかを確認 |
| `delete`     | `キー`               | `true` または `false` | 指定したキーのエントリーを削除 |
| `clear`      | `なし`               | `なし`               | すべてのエントリーを削除 |
| `size`       | `なし`               | `エントリーの数`      | エントリーの数を取得 |
| `keys`       | `なし`               | `Iterator`           | すべてのキーを `Iterator` で返す |
| `values`     | `なし`               | `Iterator`           | すべての値を `Iterator` で返す |
| `entries`    | `なし`               | `Iterator`           | `[キー, 値]` のペアを `Iterator` で返す |

#### 配列(Array)
- `[v1, v2]`リテラルを持ち、それをそれぞれ0~nの**プロパティとして**保存できるオブジェクト
- `length`プロパティの値を弄る事で、配列のサイズを変えれる(減らす場合は後ろから削除される)
- スプレッド構文`...`で展開可能
- メソッド

| **メソッド名**         | **引数**                         | **戻り値**                                  | **説明** |
|----------------------|--------------------------------|--------------------------------|---------|
| `push` \| `unshift`  | `要素`                         | `新しい配列の長さ`            | **破壊 :** 配列の末尾 \| 先頭 に要素を追加 |
| `pop` \| `shift`     | `なし`                         | `削除された要素`              | **破壊 :** 配列の末尾 \| 先頭 から要素を削除し、その値を返す |
| `includes`          | `要素`                         | `true` または `false`         | **非破壊 :** 指定した要素が配列に含まれるかを確認 |
| `indexOf` \| `lastIndexOf` | `要素, 開始位置（省略可）` | `インデックス` または `-1`    | **非破壊 :** 指定した要素の最初 \| 最後 のインデックスを返す |
| `splice`           | `開始位置, 削除数, 追加要素`    | `削除された要素の配列`        | **破壊 :** 配列を変更し、削除した要素を返す |
| `slice`            | `開始位置, 終了位置`           | `新しい配列`                  | **非破壊 :** 配列の一部を抽出して新しい配列を返す |
| `concat`           | `配列`                         | `新しい配列`                  | **非破壊 :** 配列を結合して新しい配列を返す |
| `forEach`          | `コールバック関数`             | `なし`                         | **非破壊 :** 各要素に対してコールバック関数を実行 |
| `map`              | `コールバック関数`             | `新しい配列`                  | **非破壊 :** 各要素を変換した新しい配列を生成 |
| `filter`           | `コールバック関数`             | `新しい配列`                  | **非破壊 :** 条件に一致する要素を抽出して新しい配列を生成 |
| `find` \| `findIndex` | `コールバック関数`          | `要素` または `インデックス` または `-1` | **非破壊 :** 条件に一致する最初の要素 \| そのインデックス を返す |
| `findLast` \| `findLastIndex` | `コールバック関数`  | `要素` または `インデックス` または `-1` | **非破壊 :** **後ろから** 条件に一致する最初の要素 \| そのインデックス を返す |
| `reduce`           | `コールバック関数, 初期値`     | `単一の値`                     | **非破壊 :** 要素を集約して単一の値を生成 |
| `sort`             | `比較関数（省略可）`          | `ソート後の配列`               | **破壊 :** 配列を並べ替える |
| `toSorted`         | `比較関数（省略可）`          | `新しいソート済み配列`         | **非破壊 :** 元の配列を変更せずにソート |
| `reverse`          | `なし`                         | `反転後の配列`                 | **破壊 :** 配列の要素を反転 |
| `toReversed`       | `なし`                         | `新しい逆順配列`               | **非破壊 :** 元の配列を変更せずに逆順の配列を返す |
| `splice`           | `開始位置, 削除数, 追加要素`    | `削除された要素の配列`        | **破壊 :** 配列を変更し、削除した要素を返す |
| `toSpliced`        | `開始位置, 削除数, 追加要素`    | `新しい配列`                  | **非破壊 :** 元の配列を変更せずに一部を削除・置換した新しい配列を返す |
| `flat`             | `階層の深さ（省略可）`         | `フラット化した配列`           | **非破壊 :** 配列をフラット化 |
| `join`             | `区切り文字（省略可）`         | `文字列`                       | **非破壊 :** 配列を文字列に変換して返す |
| `toString`         | `なし`                         | `文字列`                       | **非破壊 :** 配列をカンマ区切りの文字列に変換 |


#### セット(Set)
- 重複した値を許可しない
- 値単体を取り出す機能がない
- 実際にはオブジェクト型のためにキーを持っているが、持っていないような振る舞いを目指している
- `Object.prototype`を継承していない
- メソッド

| **メソッド名** | **引数**               | **戻り値**                  | **説明** |
|--------------|-----------------|----------------------|---------|
| `add`        | `値`             | `Setオブジェクト`    | 指定した値をセットに追加 |
| `has`        | `値`             | `true` または `false` | 指定した値がセット内に存在するかを確認 |
| `delete`     | `値`             | `true` または `false` | 指定した値をセットから削除 |
| `clear`      | `なし`           | `なし`               | すべての要素を削除 |
| `size`       | `なし`           | `セットの要素数`     | セットの要素数を取得 |
| `keys`       | `なし`           | `Iterator`           | 値の `Iterator` を返す（`values()` と同じ動作） |
| `values`     | `なし`           | `Iterator`           | すべての値を `Iterator` で返す |
| `entries`    | `なし`           | `Iterator`           | `[値, 値]` のペアを `Iterator` で返す |

### 派生オブジェクト2
#### 関数(Function)
- [後述](#関数オブジェクト)

#### ラッパーオブジェクト
- プリミティブ型の`__proto__`と同一の`prototype`を持つコンストラクタを`new`で呼び出すと生成できる
- プリミティブ型を操作したい時に便利なメソッドが揃っている
```js
const upper = (new String('str')).toUpperCase;
```

#### Proxy
- 特定のオブジェクトに対して、crud時の操作等に変更を加えれるようにしたオブジェクト
- newの第一引数に対象オブジェクト, 第二引数に`handler`オブジェクトを渡す
- **注意点** `Proxy`からの`getter, setter`で`Reflect`の`getter, setter`メソッドを使う時は`bind`ではなく`get, set`の第三引数(`this`の固定)に`proxy`を指定する
- handlerのプロパティ一覧

| プロパティ名          | 対象の操作                          | 説明 |
|----------------------|--------------------------------|------------------------------|
| `get`               | `obj.prop`                     | プロパティの取得をトラップする |
| `set`               | `obj.prop = value`             | プロパティの追加・更新をトラップする |
| `has`               | `'prop' in obj`                | `in` 演算子の動作をカスタマイズ |
| `deleteProperty`    | `delete obj.prop`              | プロパティの削除をトラップする |
| `apply`            | `func(...args)`                | 関数呼び出しをトラップする |
| `construct`        | `new obj(...args)`             | `new` キーワードの動作をトラップ |
| `getPrototypeOf`   | `Object.getPrototypeOf(obj)`   | `__proto__` の取得をトラップ |
| `setPrototypeOf`   | `Object.setPrototypeOf(obj, proto)` | プロトタイプの設定をトラップ |
| `defineProperty`   | `Object.defineProperty(obj, key, desc)` | プロパティ定義をトラップ |
| `getOwnPropertyDescriptor` | `Object.getOwnPropertyDescriptor(obj, prop)` | プロパティのディスクリプター取得をトラップ |
| `ownKeys`          | `Object.keys(obj)` / `Object.getOwnPropertyNames(obj)` / `Object.getOwnPropertySymbols(obj)` | オブジェクトのキー一覧取得をトラップ |
| `preventExtensions` | `Object.preventExtensions(obj)` | オブジェクトの拡張禁止をトラップ |
| `isExtensible`     | `Object.isExtensible(obj)`     | オブジェクトが拡張可能かどうかをトラップ |

#### WeakMap, WeakSet, WeakRef
##### 説明
- キーに対して弱参照
  - WeakRefのみ、単一なのでWeakRef自体が弱参照
- 反復不可
##### 弱参照
- GCに「内包している値をこのオブジェクトが参照されている」と見なされない
  - このオブジェクトのみが参照している場合は、メモリから消去される

### 真偽値(truthy, falsy)
- falsy
  - `false`
  - `0`
  - `0n`
  - `null`
  - `undefined`
  - `NaN`

### 内部スロット
| 内部スロット | 説明|
|----------------------------------|---------------------------------------------------------------------|
| **Object**                       |        ==========                                                             |
| [[Prototype]]                    | オブジェクトのプロトタイプを指す。                                 |
|                                  | **アクセス:** `__proto__` または `Object.getPrototypeOf`。        |
| [[Extensible]]                   | オブジェクトがプロパティの追加を許可するかどうかを表すフラグ。     |
|                                  | **操作:** `Object.preventExtensions` で拡張禁止。                |
| [[Get]] / [[Set]]                | プロパティの取得/設定時に呼び出される内部メソッド。               |
| [[DefineOwnProperty]]            | プロパティの定義を処理する内部メソッド（`Object.defineProperty` で利用）。 |
| [[Delete]]                       | プロパティの削除を処理する内部メソッド（`delete obj.prop` で利用）。|
| [[OwnPropertyKeys]]              | 自身が持つプロパティキーのリストを取得する。                       |
|                                  |                                                                     |
| **Function**                     | ==========                                                                    |
| [[FunctionKind]]                 | 関数の種類（`"normal"` / `"classConstructor"`など）を表す。         |
| [[Environment]]                  | 関数が作成された環境（スコープチェーン）。                         |
| [[FormalParameters]]             | 関数の仮引数リスト。                                               |
| [[Code]]                         | 関数の実行コードを保持。                                           |
| [[Call]]                         | 通常の関数呼び出し時に実行される内部メソッド。                     |
| [[Construct]]                    | `new` 演算子で呼び出されたときに実行される内部メソッド。           |
| [[BoundThis]]                    | `Function.prototype.bind` によってバインドされた `this` を保持。   |
| [[BoundArguments]]               | `bind` によって固定された引数のリスト。                            |
| [[Realm]]                        | 関数が属する実行コンテキスト（異なる `iframe` などで異なる Realm を持つ）。|
| [[Strict]]                       | 関数が strict モードかどうかを示すフラグ。                         |
|                                  |                                                                     |
| **Array**                        | ==========                                                                    |
| [[DefineOwnProperty]]            | 配列の長さ（`length`）の更新時に特別な処理を行う。                 |
| [[OwnPropertyKeys]]              | インデックスプロパティと非インデックスプロパティを適切に列挙する内部スロット。 |
|                                  |                                                                     |
| **Map / Set**                    | ==========                                                                    |
| [[MapData]] / [[SetData]]        | MapやSetが保持するデータの内部リスト（キーや値）。                  |
|                                  |                                                                     |
| **Promise**                      | ==========                                                                    |
| [別ファイル](./sync_async_and_webapis.md)      |                             |
|                                  |                                                                     |
| **Generator / Iterator**         | ==========                                                                    |
| [[GeneratorState]]               | ジェネレータの状態（`suspendedStart` / `executing` など）。         |
| [[GeneratorContext]]             | ジェネレータ関数の停止位置やスコープ情報を保持。                   |
|                                  |                                                                     |
| **Proxy**                        | ==========                                                                    |
| [[ProxyTarget]]                  | プロキシがラップしている元のオブジェクト。                          |
| [[Handler]]                      | プロキシの挙動を制御する `handler` オブジェクト。                   |
|                                  |                                                                     |
| **その他の型**                   | ==========                                                                    |
 [[StringData]]              | String オブジェクトが保持する文字列データ。                        |
 [[BooleanData]]             | Boolean オブジェクトが保持する真偽値データ。                       |
 [[NumberData]]              | Number オブジェクトが保持する数値データ。                          |
 [[Description]]             | Symbol が持つ説明文（例: `Symbol("desc")` の `"desc"` 部分）。     |

## Global Utility Objects(NamespaceObjects)
### 説明
- 名称は公式ではない
- 様々な静的メソッドが用意されている

### 一覧
| 名前           | 説明 |
|--------------|--------------------------------|
| `JSON`       | JSON のパース・文字列化を提供 |
| `Math`       | 数学関連のメソッド群 |
| `Atomics`    | `SharedArrayBuffer` の同期処理 |
| `Reflect`    | オブジェクトのメタプログラミング |
| `Intl`       | 国際化（ロケール・日付・通貨）API |
| `WebAssembly` | WebAssembly の API |

### 詳細
#### Reflect
- 過去のObjectメソッドを順次Reflectに移植している
- 元の演算子やObjectメソッドから、利便性を上げる仕様変更がされている

| 演算子                      | Object メソッド                                   | Reflect メソッド                                 | Reflect の仕様 |
|----------------------------|-------------------------------------------------|------------------------------------------------|----------------|
| `obj.prop`                 | なし                                           | `Reflect.get(obj, 'prop', receiver)`            | 例外を投げずに `undefined` を返す |
| `obj.prop = value`         | なし                                           | `Reflect.set(obj, 'prop', value)`               | 成功時 `true` / 失敗時 `false` を返す |
| `'prop' in obj`            | なし                                           | `Reflect.has(obj, 'prop')`                      | `in` 演算子の関数版 |
| `delete obj.prop`          | なし                                           | `Reflect.deleteProperty(obj, 'prop')`           | `delete` 演算子の関数版 |
| なし                       | `Object.getOwnPropertyDescriptor(obj, prop)`   | `Reflect.getOwnPropertyDescriptor(obj, prop)`   | 例外を投げずに `undefined` を返す |
| なし                       | `Object.defineProperty(obj, prop, desc)`       | `Reflect.defineProperty(obj, prop, desc)`       | 成功時 `true` / 失敗時 `false` を返す |
| なし                       | `Object.getPrototypeOf(obj)`                   | `Reflect.getPrototypeOf(obj)`                   | 例外を投げずに `undefined` を返す |
| なし                       | `Object.setPrototypeOf(obj, proto)`            | `Reflect.setPrototypeOf(obj, proto)`            | 成功時 `true` / 失敗時 `false` を返す |
| なし                       | `Object.preventExtensions(obj)`                | `Reflect.preventExtensions(obj)`                | 成功時 `true` / 失敗時 `false` を返す |
| なし                       | `Object.isExtensible(obj)`                     | `Reflect.isExtensible(obj)`                     | `preventExtensions` と対になるAPIとして統一 |
| なし                       | `Object.keys(obj)`                             | `Reflect.ownKeys(obj)`                          | `Symbol` のキーも含めて取得 |
| `new Constructor(...args)` | なし                                           | `Reflect.construct(Constructor, [...args])`     | `apply` のように `new` を柔軟に扱える |
| なし                       | `Function.prototype.apply.call(func, thisArg, argsArray)` | `Reflect.apply(func, thisArg, argsArray)` | `apply` の統一版 |

#### JSON
- `JSON`の取り扱い(Object or String)を切り替える
- `replacer`関数(`(key, value) => {}`): 変換方法の指定
  - `value`を返すと、その`undefined`を返すとそのプロパティを無視する
  - 基本`Object.entries().map()`の引数と同じと考えていいが、ネストされている中にも適応されるため、こっちの方が融通が利く
- `.perse`: String → Object
  - 第二引数: `replacer`関数(省略可能)
- `.stringify`: Object → String
  - 第二引数:
    1. 変換するプロパティを指定
    2. `replacer`関数
    3. 省略した場合は全`enumeble`プロパティが対象
  - 第三引数: インデントのスペース、省略した場合は改行なし


## 関数オブジェクト
### 種類
| 定義の仕方の俗称       | ホイスティング | スコープ              | thisの扱い                 | arguments | new演算子 | prototype | 記述方法                                 |
|------------------------|---------------|-----------------------|----------------------------|-----------|-----------|-----------|----------------------------------|
| 関数宣言 (Function Declaration) | yes           | 関数スコープ/ブロックスコープ | 呼び出し方に応じて変化          | 有        | 可        | 有        | `function 名称(引数) {...}`      |
| 関数式 (Function Expression)   | no            | 関数スコープ/ブロックスコープ | 呼び出し方に応じて変化          | 有        | 可        | 有        | `const 名称 = function(...) {...}` |
| アロー関数 (Arrow Function)     | no            | 関数スコープ/ブロックスコープ | 定義時の親スコープに固定         | 無        | 不可      | 無        | `const 名称 = (...) => {...}`    |
| メソッド (Method)              | no            | オブジェクト内で有効         | 呼び出し元のオブジェクトを参照   | 有        | 不可      | 無        | `{ メソッド名(...) {...} }`       |
| ジェネレーター関数 (Generator Function)| yes           | 関数スコープ/ブロックスコープ | 呼び出し方に応じて変化          | 有        | 不可      | 有        | `function* 名称(...) { yield ... }` |
| 即時実行関数 (IIFE)            | no            | 関数スコープ                | 呼び出し元に依存しない           | 有        | 不可      | 有        | `(function(...) {...})();`       |

### 基本仕様
#### 実行可能とは？
- 内部スロットに`[[Call]]`を持つこと
- さらに`[[Construct]]`を持つと`new`演算子を使える
#### 引数と戻り値
- 引数
  - 優先順位: `[[BoundArguments]]` > 呼び出し時に渡された値 > デフォルト値 > `undefined`
  - 超過分: 無視される(argumentsに保管される)
  - 不足分: エラーにはならず`undefined`が代入される
  - デフォルト値の設定が可能
    - undefinedが渡された時のみ、デフォルト値が優先される
- 戻り値を設定しない場合、undefinedが返る
#### 関数もオブジェクト
- jsでは関数がオブジェクトとして扱われる
  - その為、通常のオブジェクト同様、変数に入れたり、プロパティを設定したりする事が可能
    - `function a`を定義すると、`a`という関数型のオブジェクトでありながら`a()`という関数として定義される
  - 通常のオブジェクト型との違い
    - prototype, call, constructなどの予約識別子がある
    - 実行可能(()を付けると実行する)
- 関数の状態の保持が可能
  - 関数内で定義した変数等がそのまま保存される 
  - 例
```js
function incrementFactory() {
  let count = 0;
  this.increment = function() {
    count++;
    return count;
  }
  return this.increment;
}
const counter = incrementFactory();
counter()
```
- 内部関数は、外部関数が実行されるまで生成されない
  - この仕様と、関数自体をオブジェクトとして渡せる仕様を利用して、動的関数の生成が可能
  - [例](./dynamicFunction.js)
### 予約語
#### this/bind/call+apply
- `this`
  - 関数内で動的に値が決定する特殊な識別子
    - 後述の`[[BoundThis]]`が定義されている場合は、その値で固定される
    - 通常時は、メソッド呼び出し時に`this`の値が呼び出し元(トップレベルだとグローバルオブジェクト)に再定義される
    - アロー関数の場合は上記の処理が遮断され、関数定義時の`this`の値で固定される(`[[BoundThis]]`関係なく固定)
  - **ECMAScript外のWebApis等の関数では一部動作が変わるから注意**
  - `[[BoundThis]]`はECMAScriptで定義されている隠しメカニズムのため、後述の`bind`以外で操作不可
- `bind()`
  - 関数から呼び出して、呼び出し元に以下を加えた関数を返す(破壊的な変更はされない)
  - 第一引数を、`[[BoundThis]]`に定義
  - 第二引数以下を、`[[BoundArguments]]`に定義
- `call()`
  - 第一引数を`[[BoundThis]]`に定義、第二引数を普通の引数として呼び出し元の関数を実行
    - 既に`[[BoundThis]]`がある場合は、第一引数は無視される
  - `apply`というは`call`の第二引数以下をまとめて配列で指定して、呼び出し元で展開するバージョンがあるが、こちらはスプレッド演算子とほぼ同じ挙動でやや非推奨
- `[[BoundThis]]`にプリミティブ型を渡すとラップが起こる

| 引数 | BountThisの中身 |
|----|----|
| obj(通常, 関数, 配列) | 引数そのまま |
| プリミティブ型 | オブジェクト型{型: 値}にラップされる 例: {String: 'a'} |
| プリミティブ型(null, undefined) | strictによって変わる |

#### 一覧
| 名称           | 説明                                                                 |
|----------------|----------------------------------------------------------------------|
| プロパティ           |                                                                  |
| `length`       | 関数が受け取る引数の数を返す（デフォルト値）。                          |
| `name`         | 関数の名前を返す。匿名関数の場合は空文字列。                             |
| `prototype`    | 関数がコンストラクタとして使用される際に、新しいオブジェクトに継承されるプロパティを持つ。 |
| prototype定義識別子                |                                                               |
| `apply`             | 関数を指定した`this`と引数で実行する（`Function.prototype`のメソッド）。 |
| `bind`              | `this`を固定した新しい関数を返す（`Function.prototype`のメソッド）。     |
| `call`              | 関数を指定した`this`と引数で即座に実行する（`Function.prototype`のメソッド）。 |
| 特殊識別子                |                                                                 |
| `arguments`         | 呼び出し時の全引数を配列風オブジェクトで保持（非推奨: アロー関数では利用不可、rest parametersの下位互換）。 |
| `this`              | 呼び出し元に応じて異なる参照先を持つ特別な識別子。                       |

### 詳細
#### メソッド(狭義)
- `[[FunctionKind]]`が`"method"`の関数
- オブジェクトリテラルかクラスブロック内で、メソッド構文で定義されたもの
- `super`を使用可能になる
#### ジェネレーター関数
##### 構造
- Function
  - GeneratorFunction
    - GeneratorFunctionインスタンス(ジェネレーター関数)
  - Generator
    - Generatorインスタンス(ジェネレーター関数の戻り値で作成される特殊オブジェクト)
##### GeneratorFunction関数
- `[[FunctionKind]]`が`"genarator"`の関数
- Generatorオブジェクトを作成するための関数
- 通常関数と異なり、通常関数と同じ目的での`return`等がない
  - Generatorオブジェクトの挙動をそのまま記述し、記述内容を反映させたGeneratorオブジェクトが戻り値になる
- `function*`で宣言する
##### Generatorオブジェクト
- [イテレーター](#イテレーター)用の関数の様な特殊なオブジェクト、通常の実行は不可
- `yield`と特殊`return`の処理
  - `yield value`: `return {value: value, done: false}`
  - `return value`: `return {value: value, done: true}`
    - `value`を省略すると、`undefined`
    - 上記の場合、`return`自体を省略可能
- 通常イテレーターに加えて、以下の制御メソッドが実行可能、また`next()`に停止機能がある [next()詳細](#nextメソッド)
  - `next()`: `yield`を実行し、次の`yield` or `return`直前処理まで処理を進めて**停止**する
  - `return()`: 全ての処理を飛ばして`return`を実行
  - `throw()`: 内部にエラーを送れる
- エラーキャッチ時の挙動: キャッチ処理の後、次の`yield`直前まで処理を実行して停止
- `Function`のプロトタイプチェーン上にあるが、`new`の仕様や通常の実行など、関数としての機能は使えない
- このオブジェクト自体にもイテレーター(`Symbol.iterator`キーの関数)が定義されていて、反復可能

#### アロー関数
- 基本的には無名関数の省略形として使われる
- this, arguments, new, prototype等の関数の予約識別子が使えない
#### 即時関数
- 目的は処理のスコープを区切って、さらにその処理に戻り値を付ける事
- 現在スコープを区切りたい時は、ファイルを変えてモジュールにすることが推奨されるため、わざわざファイルを分けたくないケースでのみ使われる

## コンストラクタ/Prototype/継承
### コンストラクタ
#### 基本仕様
- `this.prop = `のように、new演算子で呼び出してオブジェクトを作るための処理を書いた関数をコンストラクタという
- コンストラクタは一般的に最初の文字を大文字で書く
- インスタンスに共通して持たせたいメソッドを`prototype`に定義することで、共通メソッドとして運用できる
  - インスタンスのプロパティとしてメソッドを定義してしまうと、メモリのオーバーヘッドを起こす
#### 特殊なコンストラクタ/ラッパーオブジェクト
- `String`, `Function`などもJsではコンストラクタ関数扱い
- `Function`コンストラクタは、常にグローバルスコープを参照する特別スコープ扱い
- `new プリミティブ型のコンストラクタ`で[ラッパーオブジェクト](#ラッパーオブジェクト)を生成できる

### Prototype/プロトタイプチェーン
#### 仕様
- 関数型は特殊プロパティ`prototype`を持つ、この参照先はインスタンス化を行う際、後述の`__proto__`に参照先がコピーされる
- 全ての値は、特殊プロパティ`__proto__`を持つ、この参照先に定義されているプロパティは、`__proto__`を持つプロパティからも呼び出せる
- さらに、`__proto__`の`__proto__`等、下の階層のメソッドも参照可能(プロトタイプチェーン)
- Jsでは`String`等は関数(コンストラクタ)扱い、そして文字列等はコンストラクタ関数`String`からインスタンス化した値扱い
  - つまり `'a'.__proto__ === String.prototype`
- あくまでコピーするのは参照情報のため、メモリのオーバーヘッドを防げる
#### super
- `super()`: プロトタイプチェーン上の同名メソッドを呼び出す
  - `[[FunctionKind]]`が`'method'`の関数しか呼び出さない
- `super.prop`: プロトタイプチェーン上のプロパティにアクセスする
#### 補足/応用
- コンストラクタから生成してないオブジェクトの`__proto__`は、全部`Object.prototype`
- 関数の`prototype`の`__proto__`も上記に当たる
  - 再定義しない限りは、`関数.prototype.__proto__ === Object.prototype`になる
- `Object.prototype`の`__proto__`は特別に`__proto__: null`のオブジェクトになっている
  - `Object.prototype === Object.prototype.__proto__`だとループしてしまうから一応当たり前
- 継承元の`prototype`を`__proto__`に持つオブジェクトを継承先の`prototype`に定義することで、継承先の`prototype`を引継ぎつつ独自の`prototype`を作成出来る
```js
B.prototype = Object.create(A.prototype)
```
- 継承の基本形
```js
function ConstrA(prop1) {
    this.prop1 = prop1;
}

function ConstrB(prop1, prop2) {
    fnA.call(this, prop1);
    this.prop2 = prop2;
}

ConstrB.prototype = Object.create(ConstrA.prototype);
```

### class
#### 基本仕様
- コンストラクタのシンタックスシュガーと捉えてほぼ差し支えない
- `[[FunctionKind]]`が`"classConstructor"`の特殊な関数を定義する記述
  - `new`演算子以外で呼べなくなる
  - cunstructor内で使える特別な`super`識別子がある(後述)
- メソッドの特殊仕様:
  - 自動でコンストラクタではなく`prototype`に定義
  - デフォルトで`writable`,`enumerable`が`false`
- `#pravateProp`でプライベート変数が定義可能
- `class`ブロック内の記述
```js
class Constr {
  // プライベート変数の宣言(分かりやすいように明示するだけで必須ではない)
  #privateProp;
  static #staticPrivateVar;

  // new演算子で呼ばれたときの処理
  constructor(arg1, arg2) {
    this.prop = arg1;
    this.#pravateProp = arg2;
  }

  // getterやsetterを定義
  get prop() {
    return this.prop.toLowerCase;
  }

  // prototypeに定義されるメソッド
  method() {
    return 1;
  }

  // 関数自体に定義されるメソッド(Constr.selfMethodで呼び出せる)
  static selfMethod() {
    this.#staticPrivateVar = 1;
    return 1;
  }
}
```
#### class継承
- `extends 継承元`を宣言時に定義して、継承処理を出来る
  - この時通常の継承と違い`継承先.__proto__ = 継承元`も追加で行う
- constructor内で`super()`を呼ぶと、`__proto__`の参照先の`[[Construct]]`を引数を渡して実行
  - この時、`this`を使う前に`super()`を呼び出さないとエラーになる
- 記述方法
```js
// Syntax
class Child extends Parent {
  constructor() {
    super();
  }
}

// 以下とほぼ同じ
function Child() {
  Parent.call()
}

Child.__proto__ = Parent; // ここがcunstructorのsuperが使えない通常の継承にはない
Child.prototype = Object.create(Parent.prototype);
```

## 演算子
### ※必須 Reflectとの関連
- [Reflect](#reflect)
### 基本演算子
- [優先順位](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Operator_precedence)
- Jsの演算子では、暗黙的な型変換を行うため注意が必要
```js
'5' == 5 // true
'5' === 5 // false
```
- `,`演算子: 全ての処理を実行して、最後の式(右辺)の値を返す
- `??`論理演算子: `0`と`""`を`truthy`として扱う`||`

### 特殊演算子 / 特殊キーワード
| 名前            | 説明                                                    | 例                         | 分類               |
|------------------|--------------------------------------------------------|----------------------------|--------------------|
| `typeof`           | 変数や値の型を返す                                      | `typeof "hello" → "string"` | 演算子 (operator)  |
| `delete`           | オブジェクトのプロパティを削除する                       | `delete obj.prop`           | 演算子 (operator)  |
| `void`             | 式を評価して`undefined`を返す                          | `void 0`                    | 演算子 (operator)  |
| `instanceof`       | オブジェクトが特定のクラスかを確認する                  | `obj instanceof Array`      | 演算子 (operator)  |
| `in`               | プロパティがオブジェクトに存在するか確認                | `"key" in obj`              | 演算子 (operator)  |
| `new`              | コンストラクタ関数から新しいオブジェクトを生成          | `new Date()`                | キーワード         |
| `this`             | 現在の実行コンテキストを参照                           | `this.value`                | キーワード         |
| `super`            | 親クラスや親オブジェクトのメソッドやプロパティにアクセス | `super.method()`            | キーワード         |
| `...`            | オブジェクトの展開等 | `...obj`            | 演算子 (operator) \| キーワード         |

### 詳細
#### 代入演算子
- 前方インクリメント(`++variable`)と後方インクリメント(`variable++`)は、見た目は同じだが違う演算子だから注意

#### new演算子
- 処理順
1. 空のオブジェクトを生成して、その__proto__の参照先を関数.prototypeの参照先とする
2. それを呼び出し元として(thisとして)関数を実行
3. 戻り値がプリミティブ型: 上記のthisとして使用していたオブジェクト, 戻り値がオブジェクト型: 生成したthisを返す
- 以下のコードとやっている事は同じ
```js
function new(C, ...args) {
    const _this = Object.create(C.prototype);
    const result = C.apply(_this, args);
    console.log(typeof result);
    if(typeof result === "object" && result !== null) {
        return result;
    }

    return _this;
}
```
#### typeof, instanceof
- それぞれ、データ型、protoの参照先を検証
- `typeof`は通常コードでは再現できない、`instanceof`は`C.prototype === obj.__proto__`
- プリミティブ型も`__proto__`が使えるため、`instanceof`も使用できるが、typeofで書くのが一般的
- オブジェクト型は当然ながら、typeofは全てObjectになってしまうため、`incetanceof`で判断

#### in, hasOwnProperty
- プロパティの定義の有無を調べる
- `in`はプロトタイプチェーンを含む、`hasOwnProperty`は含まない
- `hasownProperty`は`Object.prototype`に定義されている普通のメソッド

#### ...(スプレッド演算子/可変長引数)
| **用途**                           | **説明**                                      |
|------------------------------------|--------------------------------|
| **配列 / 文字列 の展開**           | 配列や文字列の要素を展開する                  |
| **配列 / オブジェクト のコピー**   | シャローコピー（元のデータは変更されない）    |
| **配列 / オブジェクト の結合 / マージ** | 配列の結合・オブジェクトのマージ（後のものが優先される） |
| **関数の引数への展開**             | 配列を関数の引数に展開して渡す                |
| **可変長引数（Rest Parameters）**   | 関数で不特定多数の引数を配列として受け取る    |

### **🔹 コード例**
```js
// 配列 / 文字列 の展開
const arr = [1, 2, 3];
console.log(...arr); // 1 2 3

const str = "hello";
console.log([...str]); // ['h', 'e', 'l', 'l', 'o']

// 配列 / オブジェクト のコピー（シャローコピー）
const arr1 = [1, 2, 3];
const arr2 = [...arr1];
console.log(arr2); // [1, 2, 3]
console.log(arr1 === arr2); // false

const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1 };
console.log(obj2); // { a: 1, b: 2 }
console.log(obj1 === obj2); // false

// 配列 / オブジェクト の結合 / マージ
const a = [1, 2];
const b = [3, 4];
const c = [...a, ...b];
console.log(c); // [1, 2, 3, 4]

const objA = { x: 1, y: 2 };
const objB = { y: 99, z: 3 };
const merged = { ...objA, ...objB };
console.log(merged); // { x: 1, y: 99, z: 3 }

// 関数の引数への展開
const numbers = [4, 8, 2];
console.log(Math.max(...numbers)); // 8

// 可変長引数（Rest Parameters）
function sum(...nums) {
  return nums.reduce((acc, num) => acc + num, 0);
}
console.log(sum(1, 2, 3, 4)); // 10
```



## ループ処理
### 基礎ループ
- `while`: ループが続く条件式のみを制御式にするループ文
- `for`: 3つの制御式を`;`で区切って記述するループ文 `(初期化式; while条件式; ループ後実行処理)`
  - 仕様上は、式の内容の制限はない
    - 関数の実行や`,`演算子等で、複数処理をする事も可能
- ループ毎にスコープが再定義され、変数が更新される
  - つまりループ毎に同名変数を宣言可能 
  - 初期化式内で`let`で定義した変数も、内部処理としてループ毎に再定義される

### オブジェクトループ
#### 各オブジェクトの対応
| ループ文 | Object | Array | Map | Set |
|----------|--------|-------|-----|-----|
| `for...in` | **可能**（プロトタイプ継承分も回る） | **可能** | **不可** | **不可** |
| `forEach()` | **不可** | **可能** | **可能** | **可能** |
| `for...of` | **不可** | **可能** | **可能** | **可能** |

#### for in / forEach() / for of
- 呼び出し可能かつ`enumerable`が`true`のプロパティ一覧を取得してループ
- デフォルトでプロトタイプチェーン上も参照するので、外したい場合は`hasOwnProperty`等を使った条件式が必要
- `for in`: `for (keyが入る変数 in object) {処理}`
- `forEach`: `forEach(callback)` コールバック関数の引数に、値が戻り値として入る
  - `break` / `continue` / `await`の制御が使えない
- `for of`: `for (イテレーターの戻り値が入る変数 in object) {処理}`
  - イテレーターが必須


### イテレーター
#### イテレーター基礎
- Jsではイテレーターを参照する際、`Symbol.iterator`をキーに持つメソッドやその戻り値を参照している
- ECMAは、`Symbol.iterator`プロパティを参照する際、値の`[[FunctionKind]]`の中身が`"generator"`なら、先にその関数を実行して、戻り値(Generatorインスタンス)をプロパティに値に再設定する
- デフォルトでは`String`, `Array`, `Set`, `Map`の`prototype`に定義されている
  - 大体の場合、イテレーターを持つという事は、上記のメソッドがプロトタイプチェーン上にあるという事
- 基本はデフォルトで用意されている上記のものを使うか、イテレーター用のオブジェクトの[Generatorオブジェクト](#generatorオブジェクト)を`Symbol.iterator`に定義する
- `Generatorオブジェクト`を使用せずに`Symbol.iterator`に定義しても、既存演算が正常に動く条件
  - 最低限の条件
    - `next` プロパティを持つ
    - `next` の戻り値の中に`{ done: true }`が含まれ、ループが終了できる
  - 実際の条件
    - `next` プロパティを持つ
    - `next` の戻り値の中に以下の要件を満たした
      - ループ中に返す戻り値1と、ループ終了時に返す戻り値2を適切に制御する
      - 戻り値1は2種以上あっても問題ない
      - 戻り値1(ループ中): `{ value: オブジェクトのコンセプトに応じたvalue, done: false}`
      - 戻り値2(ループ終了時): `{ value: undefined, done: true }`を返す

#### ジェネレーター
- `function* functionName`でジェネレーター関数を作成できる
- [詳細](#ジェネレーター関数)

#### イテレーターの制御対象
- nextメソッド
  - `next()`では、`Symbol.iterator`をキーのオブジェクトの`next`プロパティの関数を実行する
  - 戻り値に`{done: true}`を含む`return`を実行しようとすると、`[[done]]`を`true`にし、以降`{value: undefined, done: true}`しか返さなくなる
  - `next()`を利用する`for of`も実質制御対象
- スプレッド構文
  - イテレーターを配列化
- その他`map`, `set`の多くのメソッド

## エラーと例外処理
### エラー
#### 基礎
- `throw`を実行するとエラー処理が発生する。
- コード実行中にエラーが発生した場合は、自動で`throw`が実行される
- エラー処理の始めてに`catch`に飛べなければエラーとなる
- `throw`の引数 
  - `Error`インスタンス: インスタンスの情報を基に、名前やエラー行等の情報を出力
  - `Error`インスタンス以外: 値をそのまま出力
- `console.error()`: 実際にエラーは起こさないが、コンソール上でエラーを出力する
#### 例外処理
- `try`ブロックでエラーを補足したい範囲を囲み、`catch(e)`ブロックで例外処理を行う
- `finally`ブロック: エラーを`catch`出来なくても必ず実行される
- `catch(e)`の引数には、`throw`の引数がそのまま入る

#### Errorインスタンス
- `Error`クラスを継承することで、カスタムエラーの作成可能

| プロパティ       | 型             | 説明 |
|--------------|--------------|------------------------------|
| `name`      | `string`     | エラーの種類 (`"Error"`, `"TypeError"` など) |
| `message`   | `string`     | エラーメッセージ |
| `stack`     | `string`     | スタックトレース（エラー発生箇所を示す） |
| `cause`     | `any`        | `Error` の原因（オプション, `Error` など） |

# Debug
## デバッガの機能
- break pointの設定
  - 条件付きで設定することもできる
- watch pointの設定: 特定の変数の監視
- step操作
  - `Resume Script Execution`: 停止中のスクリプトを再開。
  - `Step Over`: 現在の行を実行し、次の行に進む。関数の中には入らない。
  - `Step Into`: 現在の行が関数呼び出しの場合、その関数の中に入る。
  - `Step Out`: 現在の関数を抜けて、呼び出し元に戻る。
- コールスタックやScopeの変数等の表示