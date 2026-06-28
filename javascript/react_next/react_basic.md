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


# Class Component & Error Boundary
## Class Component
### 概要
- クラスコンポーネントを描写する時、内部的に`new`演算子を使って、インスタンスを生成する
- コンポーネントが存在する間、同一のオブジェクトとしてメモリ上に保持される
  - 再レンダリングが起きても、インスタンス自体は破棄されない
### 関数一覧
| method | args | 説明 |
| :--- | :--- | :--- |
| `constructor` | `props` | インスタンスの生成、`this.state`の初期化、メソッドのバインドを行う。 |
| `render` | なし | UI（React要素）を生成して返す。副作用を含まない純粋関数として実装する必須メソッド。 |
| `componentDidMount` | なし | コンポーネントの初回マウント（DOM挿入）直後に1度だけ実行される。API通信やDOM操作を行う。 |
| `componentDidUpdate` | `prevProps, prevState, snapshot` | 再レンダリング（DOM更新）直後に実行される。propsやstateの変更に依存した副作用処理を行う。 |
| `componentWillUnmount` | なし | コンポーネントがDOMから削除される直前に実行される。タイマーやイベントリスナーの破棄を行う。 |
| `shouldComponentUpdate` | `nextProps, nextState` | レンダリングの実行要否を真偽値で返す。デフォルトは`true`。パフォーマンス最適化に用いる。 |
| `static getDerivedStateFromProps` | `props, state` | マウント時および更新時の`render`直前に実行される。propsの変化に依存してstateを更新するオブジェクトを返す。 |
| `getSnapshotBeforeUpdate` | `prevProps, prevState` | `render`後、DOMに反映される直前に実行される。スクロール位置などの現在のDOM状態を取得し、`componentDidUpdate`に渡す。 |
| `static getDerivedStateFromError` | `error` | 子孫コンポーネントでのエラー発生時に実行される。フォールバックUIを表示するための新しいstateを返す。 |
| `componentDidCatch` | `error, info` | 子孫コンポーネントでのエラー発生時に実行される。エラーログの記録や外部サービスへの送信を行う。 |
| `setState` | `updater, [callback]` | stateの更新をキューに追加し、再レンダリングをReactに要求する。 |
| `forceUpdate` | `[callback]` | `shouldComponentUpdate`の評価をスキップし、強制的にコンポーネントを再レンダリングする。 |

### プロパティ一覧
| プロパティ | 種類 | 説明 |
| :--- | :--- | :--- |
| `this.props` | インスタンス | 親から渡される読み取り専用のデータオブジェクト。変更不可。 |
| `this.state` | インスタンス | コンポーネント内部で管理する状態オブジェクト。直接代入による変更は厳禁（初期化時のみ可）。 |
| `this.context` | インスタンス | 後述の`contextType`で紐づけたContextの現在の値を保持する。Prop Drillingを回避してデータを参照する際に使用。 |
| `defaultProps` | スタティック | `props`が未指定（`undefined`）の場合に適用されるデフォルト値を定義するオブジェクト。 |
| `displayName` | スタティック | React DevToolsなどのデバッグUI上で表示されるコンポーネントの識別名を上書きする文字列。 |
| `contextType` | スタティック | 特定のReact Contextオブジェクトをクラスに紐づけ、`this.context`経由での参照を有効にする。 |

### ライフサイクル&state更新イメージ
```jsx
import React from 'react';

class LifecycleAndStateDemo extends React.Component {
  constructor(props) {
    super(props);
    // ① 複数のプロパティを持つStateを定義
    this.state = { count: 0, status: 'アクティブ' };
    console.log('[1] constructor: 初期化');
  }

  componentDidMount() {
    console.log('[3] componentDidMount: 初回マウント完了');
  }

  componentDidUpdate() {
    // ⑤ 更新後のState全体をログ出力し、statusが消えずに維持されているか観測
    console.log('[5] componentDidUpdate: 現在のState ->', this.state);
  }

  componentWillUnmount() {
    console.log('[6] componentWillUnmount: コンポーネント破棄');
  }

  // ② Stateの更新メソッド（一部のプロパティのみ上書き）
  handleIncrement = () => {
    console.log('--- ボタンクリック ---');
    // countだけを更新（statusは自動的にシャローマージされて維持される）
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    console.log('[2 / 4] render: 描画実行');
    return (
      <button onClick={this.handleIncrement}>
        {this.state.status} : {this.state.count}
      </button>
    );
  }
}
```

### 再レンダリング
- 再レンダリング条件: stateが全く同じ値に更新されたとしても、再レンダリングされる
- 再レンダリングの阻止: `React.memo()`でなく`shouldComponentUpdate`および`ReactPureComponent`
- 強制再レンダリング: `this.forceUpdate()`で`shouldComponentUpdate`を無視して`render()`を実行

## Error Boundary
### White Screen of Death
- Reactはレンダリングの途中でエラーが出ると、ツリー全体を破棄する
- Reactの仕組み的に、コンポーネントの呼び出しはコールチェーンのようにその場で実行しているわけではないので、tryでcatchできない
### Error Boundary
- `getDerivedStateFromError()`を使用してエラーハンドリングを行えるクラスコンポーネント
#### 簡易ロジック説明
```jsx
import React from 'react';

class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // ① 平常時か、エラー発生時かを判定するためのState
    this.state = { hasError: false };
  }

  // ② Reactエンジンがエラーを検知した時に自動的に呼び出すメソッド
  static getDerivedStateFromError(error) {
    // エラーが起きたという事実をStateに反映させる
    return { hasError: true };
  }

  render() {
    // ③ Stateの状態によって「返すUI」を分岐させる
    if (this.state.hasError) {
      // エラー発生時は、ツリーを破棄する代わりにこの代替UIを返す
      return <h1>UIの崩壊を食い止めました。</h1>;
    }

    // 平常時は、このコンポーネントで「囲んだ中身（子）」をそのまま返す
    return this.props.children;
  }
}
```
#### 実装例
``` tsx
// ErrorBoundary
import React, { ReactNode, ErrorInfo } from 'react';

// ① PropsとStateの型定義
interface Props {
  children: ReactNode;
  fallback: ReactNode; // エラー画面を親から注入できるようにする（汎用化）
}

interface State {
  hasError: boolean;
  error?: Error; // 実際のエラー内容も保持しておく
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // ② UI復帰のための状態更新（純粋関数）
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // ③ 副作用（ログ送信など）のための事後処理
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 例：SentryやDatadogなどの監視サービスへエラーログを送信
    console.error("監視サーバーへ送信:", error);
    console.error("コンポーネントのスタックトレース:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // 汎用性を高めるため、固定のタグではなくPropsで受け取ったUIを返す
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;



// 呼び出し側
<ErrorBoundary fallback={<div>システムエラーが発生しました。</div>}>
  <MyComplexComponent />
</ErrorBoundary>


// react fiberの動作イメージ
function handleError(root, error) {
  
  // 1. ツリーを遡って Error Boundary を探す
  const boundary = findErrorBoundary(root);

  if (boundary) {
    // 【ルートA】Error Boundary が見つかった場合
    // 代替UI（フォールバック）を描画して復帰する
    renderFallbackUI(boundary, error);
  } else {
    // 【ルートB】Error Boundary が見つからなかった場合（デフォルト）
    // 💥 ここで意図的に「White Screen of Death」を引き起こす！
    unmountEntireTree(root); 
    throw error; // ブラウザのコンソールに赤いエラーを吐き出す
  }
}
```


<!-- ## Error Boundary -->
<!-- ### 前提/概要 -->
<!-- - レンダリング処理中にJsエラーが発生した際、Reactは対象コンポーネントの内部状態を破損したとみなす -->
<!-- - 破損状態でのレンダリング継続を防ぐため、Reactはコンポーネントツリー全体をアンマウントする -->
<!-- - 上記の全体クラッシュを防ぐのがError Boundary -->
<!-- - 自信の子コンポーネントツリーで発生したJsエラーを補足し、fallback UIを表示する特別なReactコンポーネント -->

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