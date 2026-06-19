# Module
## 環境によるモジュールの違い
### 説明
- `export`で外部に変数または関数を公開
- `import`/`requier`で外部から変数または関数を取り出す

### 表
|モジュール名|動作環境|キーワード|固有拡張子|
|----|----|----|----|
| ESM | Browser/(Node 以降中) | `import` / `export` | `.mjs` |
| CJS | Node | `require` / `export` | `.cjs` |

### 説明
- 拡張子は`.js`で基本問題ないが、複数のモジュールが動いている環境では、拡張子を分けて明示する


## 基礎
### 仕様
- モジュール内でlet定義した変数をexportした場合
  - モジュールの機能では再定義が可能
  - モジュールの機能以外では再定義不可
- モジュールではグローバルコンテキストとは違いモジュールコンテキストとして扱われる
  - モジュールコンテキストがグローバルコンテキストと違う予約語以外の点は2つ
    - グローバルオブジェクトの登録がデフォルトでされないため、トップレベルの`this`が`undefined`
    - スクリプトスコープがモジュールスコープに変更される
  - モジュールにたいしてグローバルオブジェクトを登録することで、グローバルオブジェクトを扱う事自体は可能
- スクリプトスコープと比較した時のモジュールスコープの違い
  - var宣言やfunction宣言の定義先が、グローバルオブジェクトではなくモジュールスコープオブジェクト
  - `strict mode`がデフォルトで有効
- (ESM) `import 'path/to'`でモジュールをただ実行することも可能
- 複数回読み込んでも、一度しか実行しない
- 非同期で読み込む: `import('\to\path`)`で非同期で読み込める

| 機能 / 挙動              | グローバルコンテキスト (通常の `<script>` や `node script.js`) | モジュールコンテキスト (`type="module"` や `import` されたJS) |
|--------------------------|--------------------------------|--------------------------------|
| `export` / `import`      | × **エラー (`SyntaxError`)** | ○ **使える** |
| `require`（Node.js）   | ○ **使える** | × **エラー**（ESM では `import` を使う） |
| `this` の値             | ○ `window`（ブラウザ）<br>○ `global`（Node.js） | △ `undefined` |
| `var` で定義した変数   | ○ **`window` / `global` に追加される** | ○ 追加されない（モジュールスコープ） |
| `let` / `const` で定義した変数 | ○ **スクリプト全体で有効** | ○ **モジュール内だけで有効** |
| `globalThis`             | ○ 使える | ○ 使える |
| `await` をトップレベルで使用 | × エラー (`SyntaxError`) | ○ **OK** (ES2022以降) |
| `arguments`             | ○ 使える（関数内なら） | ○ 使える（関数内なら） |
| `import.meta`           | × **使えない** | ○ **使える**（`import.meta.url` など） |
| `document.currentScript` | ○ 使える | △ **null になる** |
| `new Function("...")`   | ○ 使える | × **`import` は動的に扱えない** |

### HTMLで読み込んだ場合の仕様
- 自動で`defer`が付き、非同期になる


### 記述例(ESM)
- HTMLから呼び出し

```html
<script type="module" src="./path"></script>
```

- jsからのexportとimport

```js
export exportVal = 0;
export function exportFn() {};
export default defaultValue;

import {exportVal as alias, exportFn} from './path/to.js'
import value from `./path/to.js`
import * as moduleA from './path/to.js'
```