# system
## App Router (page + Route Handler)
### 概要
* viewとapiのエンドポイントのURIが、ディレクトリ構造によって決定する仕組み
* `route.ts`と`page.tsx`は同じディレクトリに存在できない(URIが被る)
  * 通常はapiはapi/ディレクトリをapp配下に咬ませて分ける
* App Router(view): `page.tsx`と、一部の他の`layout.tsx`などのファイルだけが公開される
* Route Handler(api): `route.ts`だけが公開される
#### pageコンポーネント
- `page.tsx`へのパスがそのままurlになる
- パラメータ関連のpropsが渡される

| props | 値（例） | 型 | 説明 |
| :--- | :--- | :--- | :--- |
| `params` | `{ slug: 'hello-world' }` | `Promise<{ [key: string]: string \| string[] \| undefined }>` | 動的ルートセグメントから抽出されたURLパスパラメータ。 |
| `searchParams` | `{ page: '2', q: 'next' }` | `Promise<{ [key: string]: string \| string[] \| undefined }>` | 現在のURLのクエリ文字列（?以降）のパラメータ。 |
#### layoutコンポーネント
- `children`の定義が必須
- 高い階層の`layout.tsx`の`children`に、一番近い階層の`layout.tsx`が入る、`layout.tsx`がなく、その階層に`page.tsx`があれば代入される
### Route Handlers
### Route Groups`(groups)`
- FSR(FileSystemRouting)内で`()`を使うとurlに影響を与えることなく、ファイルをグループ化できる
  - urlに影響を与えない = その上の階層の一部として扱われる
  - しかし、url以外は別階層として扱われるため、`loading.tsx`の影響範囲の伝搬を止めることが出来る
  - 一応`layout.tsx`にも同じことができるが、それをするくらいなら`page.tsx`にその内容を書いた方がよい
### Dynamic Route Segment`[segment]`
- FSR内で`[]`を使うと、urlにpath parameterを受け取るセグメントを追加できる
- RSC: pageコンポーネントの`props`の`params`プロパティとしてオブジェクトで受け取る
- RCC: `useParams()`で受け取る(`戻り値.segment`)
### Dynamic Catch-all Segments`[...segment]`
* 深くネストされたurlを`Promise`としてパラメータとして受け取る
  * `segment/a/b`: `params.segment` = `['a', 'b']`
* `[[...segmentt]]`で指定した場合、Optionalとなり、パラメーター無しを許可(`undefined`)

## file system routingとPages Router
* file system routing: 旧システム(Pages Router, API Routes)と現行システム(App router)を総称した名称

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

## Error Boundary
- Next.jsのコンポーネントは、jsx領域の更に外を、デフォルトのError Boundaryでラップしている
- 追加で、`global-error.tsx`, `error.tsx`を読み込むと、対応したErrorBoundaryが対象の範囲を囲う
#### デフォルトBoundary
- 開発環境ではerrorオーバーレイ、本番環境では簡素なフォールバックUIを表示させる
- `next/navigation`の特定の関数から`throw`された例外を補足

| function | throw | catch |
| :--- | :--- | :--- |
| `redirect()` | 遷移用の特殊エラー(`NEXT_REDIRECT`) | エラーを捕捉し、指定URLへHTTP 307（一時的）リダイレクトを実行する |
| `notFound()` | 404用の特殊エラー(`NEXT_NOT_FOUND`) | エラーを捕捉し、直近の `not-found.tsx` をフォールバックUIとして描画する |
| `permanentRedirect()` | 恒久遷移用の特殊エラー(`NEXT_REDIRECT`) | エラーを捕捉し、指定URLへHTTP 308（恒久的）リダイレクトを実行する |
| `forbidden()` | 403用の特殊エラー(`NEXT_FORBIDDEN`) | エラーを捕捉し、直近の `forbidden.tsx` をフォールバックUIとして描画する |
| `unauthorized()` | 401用の特殊エラー(`NEXT_UNAUTHORIZED`) | エラーを捕捉し、直近の `unauthorized.tsx` をフォールバックUIとして描画する |

#### global-error.tsx
- 対象: `app/layout.tsx`
- 動作: Reactエンジンの破棄を受け入れてから代替UIを表示するため、`<html>`から記述する必要がある
#### error.tsx
- 対象: `page.tsx`
- 動作: RCCに依存(`"use client"`)
- 復帰: propsとして`reset()`が提供(補足したerror状態を破棄し、ラップした範囲の再レンダリングを行う)

# DB
## ORM
### Prisma
* 別ファイル
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

# proxy.ts
## 概要
* ver15以前は`middleware.ts`
* CDNのエッジノート上で動作するEdge Runtimeで実行される
  * Node.jsのネイティブモジュールetcは一切使えない
* WebAPIsの一部をサポートしている、これによりNode.jsの機能をWebAPIsで代用できる
  * `crypto`: `crypto.subtle`で代用できる 
* `default export`を実行ハンドラとしてバインディングする
* ルートor`src/`に配置する
* 引数: `NextRequest`or`Request`, 戻り値: `NextResponse`or`Response`
* `export const config = { ... }` の内部で規定の設定が可能

## HTTP操作
* HTTP操作は、Node.js標準の`http.IncomingMessage`ではなく、ブラウザのFetchAPIをベースに拡張したもの
* `NextRequest`:
  * Web標準の`Request`を継承
  * `req.cookies`によるCookieパース機能
  * `nextUrl`（`URL` クラスのラッパー）による現在のリクエストURLの評価・操作
* `NextResponse`:
  * Web標準の`Response`を継承
  * `redirect`, `rewrite`
  * `next`（処理を後続のNext.jsルーターへ引き渡し）

## WebAPIs
### 1. Node.js機能の代用として使われるWeb API
| API | Node.js | 機能 |
| :--- | :--- | :--- |
| `crypto.subtle`, `crypto.getRandomValues` | `crypto` モジュール | ハッシュ生成 |
| `fetch`, `Request`, `Response`, `Headers` | `http`, `https` モジュール | HTTPリクエストの発行、レスポンスの生成、ヘッダのミューテーション |
| `URL`, `URLSearchParams` | `url`, `querystring` モジュール | URLのパース、クエリパラメータの抽出・エンコード・ミューテーション |
| `TextEncoder`, `TextDecoder` | `Buffer` クラス | UTF-8文字列とバイナリ（`Uint8Array`）間のシリアライズ/デシリアライズ |
| `ReadableStream`, `WritableStream` 等 | `stream` モジュール | ペイロードのチャンク分割、バックプレッシャー制御、ストリーミングI/O |
| `btoa()`, `atob()` | `Buffer.from().toString('base64')` | ASCII文字列のBase64エンコードおよびデコード |

### 2. その他のWeb標準API (Node.jsの代替が主目的ではないもの)
| API | 機能 |
| :--- | :--- |
| `AbortController`, `AbortSignal` | 非同期操作に対するキャンセル・タイムアウト制御 |
| `Blob`, `File` | バイナリデータのイミュータブルなカプセル化とMIMEタイプの保持 |
| `FormData` | `multipart/form-data` ペイロードの構築およびキーバリューのパース |
| `structuredClone()` | 循環参照を含むJavaScriptオブジェクトの同期的なディープコピー |
| `setTimeout()`, `clearTimeout()` 等 | イベントループにおけるマクロタスクの遅延実行と破棄制御 |
| `console` | 標準出力 (`stdout`) および標準エラー (`stderr`) への同期/非同期ロギング |
| `Event`, `EventTarget` | Web標準準拠のイベントディスパッチとリスナーのインターフェース |

## Next API
### 1. NextRequest (リクエストの評価・抽出)
| API / プロパティ | 戻り値 / 型 | 役割・仕様概要 |
| :--- | :--- | :--- |
| `nextUrl` | `NextURL` クラス | 標準の`URL`クラスを拡張 |
| `nextUrl.clone()` | `NextURL` クラス | 現在のURLオブジェクトのディープコピーを生成 |
| `cookies` | `RequestCookies` インスタンス | リクエストヘッダの `Cookie` 文字列をパースした読み取り専用API |
| `cookies.get()` | `{ name: string, value: string } \| undefined` | 指定したキーのCookieオブジェクトを取得 |
| `cookies.getAll()`| `Array<{ name, value }>` | リクエストに含まれるすべてのCookieを配列として取得 |
| `cookies.has()` | `boolean` | 指定したキーのCookieが存在するか |
| `ip` | `string \| undefined` | クライアントのIPアドレス(local: `undefined`) |
| `geo` | `{ country?, city?, region?, latitude?, longitude? }` | CDNエッジから提供されるクライアントの地理情報。デプロイ環境に依存。 |

### 2. NextResponse (レスポンスの生成・ミューテーション)
* すべて `NextResponse` クラスの静的メソッド（ファクトリ）として呼び出す

| 静的メソッド | 引数 | 戻り値 / 型 | 役割・仕様概要 |
| :--- | :--- | :--- | :--- |
| `NextResponse.next()` | `options?: { request?: { headers?: Headers } }` | `NextResponse` インスタンス | 処理を中断せず、後続のNext.jsへリクエストをそのまま引き継ぐ |
| `NextResponse.redirect()` | `url: string \| URL \| NextURL`, `init?: number \| ResponseInit` | `NextResponse` インスタンス | 指定URLへの強制遷移レスポンスを生成(default: `307 (Temporary Redirect)`) |
| `NextResponse.rewrite()` | `url: string \| URL \| NextURL`, `init?: ResponseInit` | `NextResponse` インスタンス | ブラウザのURLバーを維持したまま、指定した別パス（または外部URL）のコンテンツをプロキシして返却 |
| `NextResponse.json()` | `body: any`, `init?: ResponseInit` | `NextResponse` インスタンス | `Content-Type: application/json`ヘッダを持つJSONペイロードレスポンスを早期リターン |

### 3. NextResponse インスタンスにおけるミューテーション機能
* `next()`, `redirect()`, `rewrite()` 等で生成されたインスタンスに対して、後続またはクライアントへ返す状態を操作

| API / プロパティ | 引数 / 戻り値 | 役割・仕様概要 |
| :--- | :--- | :--- |
| `cookies.set()` | 引数: `name`, `value`, `options?` | `Set-Cookie`ヘッダをレスポンスに注入、クライアントにCookieの保存/上書きを指示 |
| `cookies.delete()`| 引数: `name` | `Max-Age=0` の `Set-Cookie` を注入し、クライアントの該当Cookieを即座に破棄させる。 |
| `headers.set()` | 引数: `name`, `value` | HTTPヘッダを上書きまたは新規追加する。`NextResponse.next()` への適用時は、後続サーバーで参照可能 |

## config
| プロパティキー | 許容される値の型 | 役割・仕様概要 |
| :--- | :--- | :--- |
| `matcher` | `string \| Array<string \| MatcherObject>` | `proxy.ts` を起動するURLパスを定義、文字列（パス表記/正規表現）の配列 or 特定のヘッダ/クエリの有無を条件に含むオブジェクトを指定 |
| `regions` | `string \| Array<string>` | エッジ関数のデプロイ先リージョンを制限、Vercel等の対応CDNでのみ有効。指定しない場合はユーザーに最も近いエッジで実行 |
| `unstable_allowDynamic` | `Array<string>` | Edge Runtimeで禁止されている動的コード評価を例外的に許可する、依存パッケージがエッジでクラッシュする際の回避策 |

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

# setting / meta etc
## lint
- `/eslint.confg.mjs`
- reactの機能が拡張されている
- コードのエラーではなくルールが統一されているかチェックできる
- 設定次第で自動修正や、vscodeやCI/CDとの連携などの拡張機能を使える

## meta
### 概要
* Config-based: コード内でオブジェクトをexport
* File-based: 特定の名前のファイルを配置する
* 全てRSCで解決
### Config-based
* `layout.tsx`, `page.tsx`ファイルから、メタデータオブジェクトor生成関数をexport
* 静的メタデータ: `metadata`定数をexport
* 動的メタデータ: `generateMetadata`関数を用いて生成したオブジェクトをexport
```ts
// 静的メタデータ(app/layout.tsx or app/page.tsx)
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js 16 アプリ',
  description: 'Next.js 16のメタデータのテスト',
};

// 動的メタデータ(例: app/blog/[id]/page.tsx)
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await fetchPost(params.id);
  return {
    title: post.title,
    description: post.summary,
  };
})
```
### File-based
| ファイル規約 | サポートされる拡張子 (静的) | 動的生成の拡張子 | 役割と対象スコープ |
| :--- | :--- | :--- | :--- |
| `favicon` | `.ico` | - | ルートのみ配置可。サイト全体のファビコン。 |
| `icon` | `.ico`, `.jpg`, `.jpeg`, `.png`, `.svg` | `.js`, `.ts`, `.tsx` | 各セグメントに配置可。アプリアイコン。複数サイズ設定可能。 |
| `apple-icon` | `.jpg`, `.jpeg`, `.png`, `.svg` | `.js`, `.ts`, `.tsx` | 各セグメントに配置可。iOSデバイス用のホーム画面アイコン。 |
| `opengraph-image` | `.jpg`, `.jpeg`, `.png`, `.gif` | `.js`, `.ts`, `.tsx` | 各セグメントに配置可。SNSシェア時のOGP画像 (`og:image`)。 |
| `twitter-image` | `.jpg`, `.jpeg`, `.png`, `.gif` | `.js`, `.ts`, `.tsx` | 各セグメントに配置可。X (Twitter) カード用画像。 |
| `robots.txt` | `.txt` | `.js`, `.ts` | ルートのみ配置可。クローラーのアクセス制御。 |
| `sitemap` | `.xml` | `.js`, `.ts` | ルートのみ配置可。検索エンジン用サイトマップ。 |
| `manifest` | `.json`, `.webmanifest` | `.js`, `.ts` | ルートのみ配置可。PWA（プログレッシブウェブアプリ）設定。 |


# 未学習
* use cache
