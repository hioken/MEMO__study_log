# 言語仕様
## 説明
- Jsというのは、コアのECMScriptと実行環境ごとの拡張機能を総称した者
## 拡張機能
| 実行環境          | 使われる拡張機能       | 機能の説明                                                                |
|-------------------|------------------------|---------------------------------------------------------------------------|
| 共通          | ECMScript               | Jsのコア機能、変数の宣言等。                                                     |
| ブラウザ          | Web APIs               | DOM操作、イベントリスナー、AJAX、`fetch`、`localStorage`など、ブラウザ特有の機能。  |
| Node.js           | Node.jsモジュール群    | サーバーサイド向けのファイル操作（`fs`）、HTTP通信（`http`）、プロセス管理（`process`）など。別名commonjs。 |
| Deno              | Deno標準ライブラリ     | セキュアで最新の環境。HTTPサーバーやファイル操作、型定義（TypeScript）をネイティブでサポート。 |
| Electron          | Web APIs + Node.js    | ブラウザとNode.jsを組み合わせ、デスクトップアプリを開発するための環境。                |
| Google Apps Script| GoogleサービスAPI     | Google Workspace（スプレッドシートやGmailなど）と連携するためのAPI群。               |
| React Native      | React Native API      | モバイルアプリ用。UIコンポーネント（`View`, `Text`）、ネイティブモジュール呼び出しなど。  |

# ECMAScriptとグローバルオブジェクト
## 概要
- **ECMAScript単体では動作できない**:
  - ECMAScriptはJavaScriptの言語仕様を定義したもので、単体では実行環境を持たない。
  - 実行するには、実行環境がグローバルオブジェクトを設定する必要がある。

- **グローバルオブジェクトが必要な理由**:
  - ECMAScript仕様では、グローバル変数や関数は必ずグローバルオブジェクトのプロパティとして登録される。
  - 実行環境がこのオブジェクトを作成しないと、JavaScriptコードは動作しない。

- **例: ECMAScriptの仕様に基づく動作**
```javascript
var globalVar = "Hello, World!";
console.log(globalThis.globalVar); // "Hello, World!"
```

## バージョン
| ECMAScriptバージョン (公開年) | ESM関連の主な機能・特徴 | 概要・構文例 |
| :--- | :--- | :--- |
| **ES2015 / ES6**<br>(2015年) | ESM仕様の初導入（構文の標準化） | 構文が定義され、静的解析が可能に。<br>`import { func } from './mod.js';`<br>`export const data = 1;` |
| **ES2020**<br>(2020年) | **Dynamic Import**（動的インポート）<br>**`import.meta`** の導入 | 必要に応じた非同期・動的なモジュール読み込みが可能に。<br>`import('./mod.js').then(...)`<br>モジュールのURLなどのメタ情報を取得。<br>`console.log(import.meta.url);` |
| **ES2022**<br>(2022年) | **Top-level `await`** | `async` 関数で囲まなくても、モジュールのトップレベル（直下）で直接 `await` が使用可能に。<br>`const res = await fetch(url);` |
| **ES2024**<br>(2024年) | **Import Attributes**（インポート属性） | JSONなどの非JavaScriptリソースを安全にインポートするための属性指定。<br>`import data from './data.json' with { type: 'json' };` |

# ソースコードの扱い
## コンパイル
- ES6以降では、実行しながら、何度も使用される関数等をコンパイルする仕様

## ASTの作成
- JSエンジンはソースコードをパースしてASTを作成する
- これには動作フローは含まれておらず、定義や呼び出しをパースしてツリー構造にするだけ
