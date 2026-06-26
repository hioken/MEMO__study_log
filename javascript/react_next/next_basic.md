# system
## routing/file
### file system routing
- `page.tsx`と、一部の他の`layout.tsx`などのファイルだけが公開される
- `page.tsx`へのパスがそのままurlになる
### layout
- `children`の定義が必須
- 高い階層の`layout.tsx`の`children`に、一番近い階層の`layout.tsx`が入る、`layout.tsx`がなく、その階層に`page.tsx`があれば代入される
### (routing)
- `()`を使うとurlに影響を与えることなく、ファイルをグループ化できる
  - urlに影響を与えない = その上の階層の一部として扱われる
  - しかし、url以外は別階層として扱われるため、`loading.tsx`の影響範囲の伝搬を止めることが出来る
  - 一応`layout.tsx`にも同じことができるが、それをするくらいなら`page.tsx`にその内容を書いた方がよい

## Link & Navigate
### viewport & prefetch
- viewportを監視し、画面内(もしくはホバーされた)`<Link>`を補足する
- prefetch: 補足した`<Link>`先で使うコンポーネントをあらかじめfetchする
- `useRef`と`useIntersection`を使用した`IntersectionObserver`APIにより実装されている
### Nav
1. `e.preventDefault()`によるイベントの掌握
2. History APIによるURL偽装
3. Client-side Router Cacheの照合
4. (RSC Payloadの取得)
5. Reactによる描写

## rendering
### 動静
- RSCで毎回同じクエリが確実に出力されることが推論できるページでは、HTMLごとにbuild時に静的にキャッシュされる
- これは自動では更新されない

## URL
### searchParams
- `page.tsx`の`props`にのみ、Next.jsのルーターから自動的に引数として渡される
- `Promise`(next15~)
- デフォルトの型: `{ [key: string]: string | string[] | undefined }`
```tsx
// /shop?category=shoes&size=27&size=28
{
  category: "shoes",
  size: ["27", "28"],
}
```
### DynamicRoute
- Path Parameterの実装ロジック

## next/dynamic & loading.tsx & suspense
### dynamic
- WebAPIsが使いえない関係で、正常に動作しない`React.lazy`等をNode.js側で正常に動作させるための機能
- `dynamic(cb)`: `lazy(cb)`と同じ使い方ができる
  - ただし、`<Suspense>`で囲わなくていい(自動で囲われた時と同じ挙動をする)
### loading.tsx
- そのディレクトリの`page.tsx`を`<Suspense>`で囲み、代わりに当ファイルをロードする
### Suspense
- 基本的には生Reactと同じ
- RSCエンジンによる拡張により、`throw`ではなく`return Promise`でも動作する

## ServerActions
### 概要
- HTTP通信を、関数の呼び出しインターフェースとしてカプセル化したRPC
- `'use server'`:
  - ファイル内でexportされた全ての関数をServerActionsとしてマークする
  - Client, Serverどちらのコンポーネントからも呼び出せる
  - どちらからも呼び出されていない場合、コンパイル時点で削除される
### コンパイル
1. AST Parsing: `"use server"`ディレクティブの対象ファイル(or関数)をServer Boundaryとしてマーキング
2. Hashing: 各Server Action関数にユニークなハッシュ文字列を割り当てる(Action ID)
3. Dead Code Elimination: client向けのjsバンドルから、対象関数の中身の処理を削除
4. Code Genaration:
  - Client: Action IDを用いてfetchを実行するだけのClient Stubをバンドルに埋め込む
  - Server: Action IdをURLパスとして受け付け、POSTエンドポイントのハンドラーとして、Server Stubをルーティングシステムに登録
### 動作(RPCに当てはめた説明)
1. Client Stub: Tsの型検査はこの時点のインターフェースに行われる
2. Marshaling: 引数をRSCの特殊なペイロードフォーマットに変換し、ActionIDをヘッダー情報に付与
3. Network: fetch APIでリクエストを発行
4. Unmarshaling: ヘッダー`Next-Action`により、Server Stubが起動
5. Procedure
6. Network: 再マーシャリングされた関数の戻り値が返却される(設定によってRSC Payloadも)
### 変換イメージ
```ts
"use server"
export async function myAction(data: string) {
  const secret = process.env.API_KEY;
  return db.save(data, secret);
}
// ↓↓ //

// クライアントのブラウザに送信される実際のJSファイル
export function myAction(data) {
  // コンパイラが自動生成したfetch処理（Client Stub）
  return fetch('/_next/server-action', {
    method: 'POST',
    headers: {
      'Next-Action': 'a1b2c3d4e5f6', // コンパイラが割り当てたAction ID
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify([data]) // マーシャリングの準備
  });
}

// サーバー側でのみ保持・実行されるコード
const actionRegistry = {
  // Action IDと実際の関数（Procedure）のマッピング（Server Stubの役割）
  'a1b2c3d4e5f6': async function original_myAction(data) {
    const secret = process.env.API_KEY;
    return db.save(data, secret);
  }
};
```

# DB
## ORM
### Prisma
### Drizzle ORM
## Type Query Builder
### Kysely(kanel)
## API
### Supabase Client
## DBDriver
### Postgres.js
- `postgres()`: 引数にコネクションプール等を含む接続情報を渡すと、sql関数を返す
- `sql<T[]>()`:
  - (str): `Promise`で引数のクエリを実行、結果をオブジェクト化, 型をTにアサーションしたオブジェクトを戻り値として返す
  - (obj): オブジェクトをinsert/updateの内容として展開

# BuildInComponents
## next/Link
| プロパティ | 値の型 | 説明 |
| :--- | :--- | :--- |
| `href` (必須) | `string \| UrlObject` | 遷移先パス。`typedRoutes`有効時は`Route<T>`型で静的検査され、タイポはコンパイルエラーになる。 |
| `replace` | `boolean` | `true`で`history.replaceState`を使用（ブラウザの履歴スタックに追加しない）。 |
| `scroll` | `boolean` | 遷移後にページ上部へスクロールするか。ハッシュリンクの場合はその要素へスクロール。 |
| `prefetch` | `boolean \| null` | 本番環境でのプリフェッチ制御。`null`(デフォルト)はviewport交差時のみ（App Router）。 |
| `shallow` | `boolean` | `true`で`getServerSideProps`等をスキップしURLのみ更新（主にPages Router用）。 |
| `passHref` | `boolean` | `Link`直下にカスタムコンポーネントを置く際、子へ`href`を注入する（子側の`forwardRef`必須）。 |
| `legacyBehavior` | `boolean` | `true`でv12以前の挙動に戻す（`Link`内で手動で`<a>`タグをネストする必要があるケースに使用）。 |
| `locale` | `string \| false` | i18n機能使用時、現在のロケール以外の特定のロケールを指定して遷移させる場合に利用。 |

## next/image
- `<img>`の拡張機能`<Image>`コンポーネントを提供
  - レイアウトのズレ防止
  - 表示領域の小さいデバイスに対する、画像サイズの変更
  - 画像の遅延読み込みをカスタマイズ
  - 最新フォーマットの提供をカスタマイズ

| プロパティ名 | 値の型 | 説明 |
| :--- | :--- | :--- |
| **src** (必須) | `string \| StaticImport` | 画像のパス、または `import` した画像オブジェクト。 |
| **alt** (必須) | `string` | アクセシビリティ・SEO用の代替テキスト（空文字も可）。 |
| **width** | `number \| string` | 画像の横幅（ピクセル数）。`fill` 未指定時は必須。 |
| **height** | `number \| string` | 画像の縦幅（ピクセル数）。`fill` 未指定時は必須。 |
| **fill** | `boolean` | 親要素（要 `position: relative` 等）いっぱいに広げる。 |
| **priority** | `boolean` | `true` で最優先読み込み（LCP画像に指定、遅延読み込み無効）。 |
| **quality** | `number` (1〜100) | 画質。デフォルトは `75`。 |
| **placeholder** | `'blur' \| 'empty'` | 読み込み中の表示。`blur` でぼかし画像を表示。 |
| **blurDataURL** | `string` | `placeholder='blur'` かつ静的インポートでない時のぼかし用データURI。 |
| **loading** | `'lazy' \| 'eager'` | 読み込みタイミング。通常は自動で `lazy`（遅延）になるため指定不要。 |
| **unoptimized** | `boolean` | `true` でサイズや形式の自動最適化を完全に無効化。 |
| **loader** | `Function` | カスタムURLを生成する関数（独自の画像配信用）。 |

# nextHooks
## params(next/navigation)
### url
- RCC上でしか動かない
- `usePathName()`
  - 戻り値: string
  - useState
  - 現在のURLのうち、ドメインとクエリパラメータを除外したパス名を厳密な文字列として返すフック
- `useSearchParams()`
  - 戻り値: ReadonlyURLSearchParams
  - useState
  - クエリパラメータをオブジェクトで取得する
  - このオブジェクトの`set`, `delete`メソッドはerrorを返すように設定されている(tsの`readonly`も定義されている)
### useRouter
- 戻り値: AppRouterInstance(router)
- useRef

| method | arg | arg詳細 | 説明 |
| :--- | :--- | :--- | :--- |
| `push` | `href`, `options?` | `string`, `{ scroll?: boolean }` | 指定URLへ遷移し、履歴スタックを追加する |
| `replace` | `href`, `options?` | `string`, `{ scroll?: boolean }` | 指定URLへ遷移し、現在の履歴を上書きする |
| `refresh` | なし | - | 現在のルートのデータを再取得し、画面を更新する |
| `prefetch` | `href`, `options?` | `string`, `{ kind?: PrefetchKind }` | バックグラウンドで遷移先のルートを事前取得する |
| `back` | なし | - | ブラウザの履歴を1つ戻る |
| `forward` | なし | - | ブラウザの履歴を1つ進む |