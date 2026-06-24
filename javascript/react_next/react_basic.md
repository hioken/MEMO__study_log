# 用語
- SSR: Server Side Rendering
- RSC: React Server Component

# アーキテクチャ
## 仮想DOMとReconciliation（差分描画）
- 状態の変化に合わせてUIを再計算する問題を解決
- DOMを再現したJSネストされたオブジェクト
- 仮想DOM内で演算を行い、最終的に導き出された差分のみをDOMとして描画する
## レンダリングフェーズとコミットフェーズ
### Render
- コンポーネントを呼び出して、戻り値で仮想DOMを生成する
- このフェーズでは単純なDOM操作のみを行う
### Commit
- 実際のDOMへの適応

## 宣言的UIのパラダイム
- 開発者が直接DOMを操作しない
- 状態を引数で取得し、UIを返す関数

## 開発者目線での雑メモ
### 設計
- htmlをノード毎に関数化しているだけ
- 親ノードが子ノードを呼び出していく設計

# コンポーネント
## JSX/TSXの評価と変換プロセス
- J(T)SX: java(type)scriptの糖衣構文
- `_jsx()`: コンポーネントの正体、React要素を返す
- React要素: 仮想DOMの最小要素
```jsx
const element = <div id="app">Hello, React!</div>;
// ↓↓
import { jsx as _jsx } from "react/jsx-runtime";
const element = _jsx("div", { id: "app", children: "Hello, React!" });
```
```js
// _jsx() の戻り値のイメージ（React要素）
{
  $$typeof: Symbol(react.element), // React要素であることを証明する識別子（XSS攻撃などを防ぐための内部仕様）
  type: "div",                     // HTMLタグ名（文字列）、またはReactコンポーネント（関数自体）
  key: null,                       // リスト描画時の差分計算（Reconciliation）を最適化するためのキー
  ref: null,                       // 実際のDOMノードへの直接アクセスを保持するための参照
  props: {                         // 属性やイベント、そして子要素（children）
    id: "app",
    children: "Hello, React!"
  }
}
```

## コンポーネント
### 概要
- コンポーネント: 開発者が定義した要素を定義する関数
- コンポーネントの関数シグネチャ
  - `(props: PropsType) => JSX.Element | null`
- 複数のタグを書く場合、何かで囲わないといけない
- 空フラグメント: 空のフラグメントで囲うことで上記を回避

記述例
```tsx
function Button() {
  const handleClick = () => {
    alert('pushed');
  }

  return <button type="button" onClick={handleClick}>クリック</button>
}

export default Button;
```

### Props（一方向データフロー）
- コンポーネントの親から子へ渡されるデータの集合体
- 受け取ったpropsは完全な読み取り専用
- 親から子にデータを渡したい場合、親を変更する関数をpropsのプロパティとして子に渡す
- 属性名のみ渡すと`true`が渡る
- 生jsに近い渡し方
  - プロパティ名を書かずに`{}`で囲んで値を渡すことで、オブジェクトリテラルの省略記法と似た指定ができる
  - オブジェクトリテラル内のスプレッド構文による展開が行える
- `children`: 型定義ルールに則って、子要素全てが入っているプロパティ
```tsx
<Child count={10} flg />
```

```ts
// React内部の型定義（イメージ）
type ReactNode = 
  | string 
  | number 
  | boolean 
  | ReactElement
  | Iterable<ReactNode>
  | null 
  | undefined;
```

### Context（コンポーネントツリーを跨ぐデータ伝播）
- 孫要素に直接データを届けるため、孫要素が親要素以上を直接参照する仕組み
  - Provider: ツリーの階層で、下の全ての階層にこのデータを提供するスコープ宣言
  - Consumer: `useContext`そのスコープ内にある子孫コンポーネントは、中間の階層を全て飛ばせる

## CSS
- 直接`import`できる
### module.css
- コンポーネントにimportする
- `import変数.class定義`を、要素のclassNameの値に指定する

# Hooks
## 概要
- Hooksシステム: コンポーネント関数の状態やライフサイクルを保持する仕組み
- コンポーネントごとに、Hooksの呼び出し結果をインデックスベースのデータ構造でメモリ内のFiberノードに保持している
- `use`が付く関数
- 確実に呼ぶために、トップレベルでのみ呼び出せる
  - Hooksが前回と全く同じ順番で呼び出される前提のシステムのため、条件によって呼び出されない位置に記述できない
## 組み込みHooks
### useState
#### 説明
- 戻り値: `state`(クロージャ), `setter`(クロージャ更新関数)のタプルが返る
- `setter`: 以下の処理を非同期キューに予約
  - 引数が`state`と違うプリミティブ型の値、もしくは参照先が違うオブジェクトをさしている場合、更新し、再レンダリング
    - オブジェクトのプロパティだけ更新したものを引数に渡しても、更新されないので注意
  - 関数の場合は、第一引数に実行時点での`state`を受け取り、関数の戻り値を次の`state`とする


### useReducer
- `reduce`の様な挙動、複雑なロジックを用いる時や、前回の状態に依存した更新を行う
- 現在の状態とアクションを受け取り、`Reducer`を利用する

### 内部仕様
- 比較は`Object.is()`による同値判定を行っている
  - 参照するアドレスが一致していると、内容が変わっている構造体でも同値判定をし、更新しない
- `setState`を呼び出しても、状態変数の値は即座に書き換わらず、キューの追加(更新の予約)を行う

## カスタムHooks
- 状態管理や副作用のロジックのみを抽出し、別のHooksを呼び出す関数
```jsx
// カスタムフックの例（慣例として必ず "use" から始める）
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    /* リサイズイベントの登録などの副作用 */
  }, []);
  return width; // UIではなくデータや関数のみを返す
}

const MyComponent = () => {
  const width = useWindowWidth(); // ロジックの再利用
  return <div>現在の幅は {width}px です</div>;
};
```

## 副作用（Side Effect）と外部同期
### 概要
- 副作用: レンダリングに関係ない事
  - Reactを通さずにDOM操作を実行, 外部システムに影響を与えるetc
- useEffect: 副作用をレンダリングフェーズから切り離し、外部システムと同期するためのAPI
- **副作用はレンダリングの後に動作するため、副作用内でstateを変更すると無限ループになる可能性がある**

### 関数
#### useEffect / useLayoutEffect
- `(cb, [dep])`
- 非同期でコールバック関数を実行
  - ブラウザが画面を描写した後/前
  - 第二引数を前回の呼び出しと今回で比較して、変わっていたら
- コールバック関数が別の関数を返した場合は、以下のタイミングで実行
  - コンポーネントがアンマウントされるとき
  - 次回の`useEffect`のコールバックが実行される直前

#### useRef
- `current`プロパティに`useRef`の引数を持つオブジェクトを生成
- 要素に`ref`属性をつけると、`current`に現在の状態のelementが入る
- `ref`要素が再レンダリンされると同期して`current`も更新される
- `ref`要素が再レンダリングされない限り、`current`はコンポーネントが再レンダリングされようと更新されない
- 用途は二つ
  - DOMに直接アクセスし、描写が変わらない操作(focus()やplay())を行う
  - `ref`要素は使わずに、値が変わっても再レンダリングしたくない値を管理する
###### 詳細(refプロパティ) ※ここは詳細に調べていないため、誤情報の可能性もある
- JSXのrefプロパティに`useRef`で作成したオブジェクトを渡す
- `__jsx()`のプロパティ
- コミットフェーズ終了後、生成したDOMノードが`ref.current`に代入される

## バッチ更新
- Reactは同じイベントループ内の複数のstate更新をまとめて処理する（バッチ更新）
  - 古いstateを参照したまま連続で更新すると、後の更新が前の更新を上書きして期待通りにならないことがある


# 組み込みコンポーネント
## Suspense & lazy
### 概要
- 動的ロードのAPI
### Suspense
- 全ての子コンポーネントがレンダリングできていない場合`fallback`を代わりに描写する
- `fallback`: 待機中に表示する`ReactNode`
- `children`: 最終的に表示する`ReactNode`
  - `Promise`の`throw`を含むことが前提
- 子コンポーネントの`throw Promise`を`catch`して、解決を待つ
- ネスト時のルール
  - 自分から見て上の階層で、一番近い階層のSuspenseが`catch`する

### React.lazy
- `lazy(return Promiseのcb)`
- `lazy`自体はReact用の遅延ロード用オブジェクトを返す
- このオブジェクトが評価された時、`lazy`の引数が実行され、戻り値の`Promise`が`throw`される 
- `Promise`が解決すると、`.default`を読み込む
- 読み込んだ関数に、`props`を引数として与える


<!-- ## 依存配列（Dependency Array）の評価基準 -->
<!-- ## forwardRef / useImperativeHandle -->

<!-- # React Router -->
<!-- nextに関係なさそうだからスキップ -->

<!-- 
# 評価のキャッシュと最適化
## React.memo（コンポーネントのメモ化）
## useMemo（値のメモ化）
## useCallback（関数のメモ化）

# 特殊なコンポーネントとAPI
## Fragment
## Suspense / Error Boundary
## Portal -->

# 基本仕様や設定
## files
- package.json: ライブラリ
- eslint.confg.js: フォーマット設定ファイル
- index.html → main.jsx: トップビュー/トップコンポーネント
- App.jsx: トップコンポーネント

## eslint.config.js
### 概要
- 設定オブジェクト配列を`export default`する
- 構成要素
  - ignores: 無視するディレクトリ(ここだけconfigの第一引数として露出している)
  - files: 適応するファイル指定
  - leaguageOptions: 言語のパース設定(コンパイラの解析設定)
  - plugins
  - rules: ルール追加

```js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 1. 無視するディレクトリの指定
  { ignores: ['dist', 'build'] },

  // 2. メインの設定オブジェクト
  {
    // 適用するファイルを指定（Reactのコンポーネントは .tsx）
    files: ['**/*.{ts,tsx}'],
    
    // 3. 言語のパース設定
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser, // ブラウザ環境のグローバル変数(window等)を許可
      parserOptions: {
        ecmaFeatures: { jsx: true }, // JSX構文をパースできるようにする
      },
    },
    
    // 4. プラグインの登録
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    
    // 5. ルールの適用
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      
      // React 17以降の新しいJSX変換を使う場合は必須の設定
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // 開発環境用のルール（コンポーネントの再描画関連）
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
```

### 言語パース設定ケース
- A. TSの型情報を活用した高度なLintを行いたい
- B. 最新のECMA構文を使いたい
- C. 一部のファイル群だけ、実行環境やモジュールシステムを切り替えたい

### 有用rules
- `'react/prop-types': 'off'`: React標準の型チェックをオフ
- `react-hooks/~`: hooks関連のガード等