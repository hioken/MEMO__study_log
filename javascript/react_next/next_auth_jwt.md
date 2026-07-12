# 前提
## 通常のJWTセッション
* JWTをSSOTとして認証する: JWTに有効期限を含む認証に必要な全ての情報を詰め込む

# Auth.js
## エンドポイント
### 概要
* `/api/auth/*へのすべてのHTTP GET|POSTをAuth.jsの内部ルーターへ委譲
### デフォルト
* `api/auth/signin`: 認証フローのトリガー, idPへのリダイレクト
* `api/auth/callback/[provider]`: idPからの認可コード受領, トークン交換の処理
* `api/auth/session`: CSRからのセッション状態取得
* `api/auth/signout`: セッションCookieの破棄
## 設定
### `NextAuth()`: 3つのインターフェースメソッドを持つオブジェクトを生成
#### プロパティ
* `handlers`: Route Handers
  * GET, POSTとして直接インポートするための、Web標準リクエスト, レスポンスハンドラ
* `auth`: RSC&Server Actions, エッジランタイム
  * リクエストコンテキストからJWE Cookieをデコードし、セッション状態を評価
* `signIn`/`signOut`: Server Actions
  * 認証フローのトリガー/セッション破棄 を呼び出すためのミューテーション関数
#### その他
* `NextAuthConfig`型: 型推論の基盤
* 環境変数`AUTH_SECRET`: `NextAuth()`で検知され、JWE暗号化の対称鍵として使用される
#### コード例
###### src/auth.ts
```ts
import NextAuth, { NextAuthConfig } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

// 1. 設定オブジェクトの静的定義
export const authConfig: NextAuthConfig = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    // 複数のOIDC/OAuthプロバイダを配列として追加可能
  ],
  // セッション戦略の明示的指定（デフォルトで"jwt"ですが状態管理仕様を確定させるため記述）
  session: {
    strategy: "jwt",
  },
};

// 2. ファクトリ関数によるインスタンス化と、4つのインターフェースのエクスポート
export const {
  handlers, // コンテキストA: Route Handlers用
  auth,     // コンテキストB/C: Server Components / ミドルウェア用
  signIn,   // Server Actions用 (ログインミューテーション)
  signOut,  // Server Actions用 (ログアウトミューテーション)
} = NextAuth(authConfig);
```
###### ルーティングの委譲(`app/api/auth/[...nextauth]/route.ts`)
```ts
import { handlers } from "@/src/auth";

// 3. Web標準リクエストハンドラのバインディング
export const { GET, POST } = handlers;
```

## Tokenの扱いや拡張
* auth.jsは、idPやUserInfoEpか受け取った大量のデータを、一部を覗いて破棄する
  * Cookieのサイズとセキュリティを考慮して
  * name, email, imageのみ残る

## セッション
### 共通
* Cookie: `next-auth.session-token`
### デフォルト
#### 認証
* JWEを用いたステートレスなセッション戦略を採用する
* ログイン成功時にJWEを生成
#### チャンキング
* ステートレス(JWE)は、Cookieのサイズ上限(4KB)の影響を受ける
* 超える場合はデータを分割する(`next-auth.session-token.n`)
### Prisma
#### 概要
* ステートフルに切り替わる
* JWE+Cookieではなく、Prisma経由のDB I/O処理を採用
* セッション管理のみJWEにすることも可能
#### 必須スキーマ
* `User`: 承認済みのアイデンティティデータ
* `Account`: OAuthプロバイダ側のアカウント情報を表現(各種TokenやID)
* `Session`: 現在アクティブな認証セッション(有効期限, 認証token等)
* Userが他二つの親テーブルに当たる
#### 認証
* CookieにはJWEの代わりに不透明なランダムな文字列
* 上記の文字列と`Session`モデルの`sessionToken`が一致
### Stateless vs Stateful
* ステートレス: JWEが傍受された場合、期限が切れるまで不正アクセスを拒絶できない
* ステートフル: I/Oの処理時間がかかる
* ステートフル: Middleware上で検証が不可
### クライアントでのセッション管理
* `SessionProvider` + `useSession`で、クライアント側からセッション情報を取得できる

## 関数/主要オブジェクトのプロパティ
### 1. コアモジュール (`next-auth`)
| API / プロパティ | 引数/戻り値/値 | 種類 | 実行コンテキスト | 役割・仕様概要 |
| :--- | :--- | :--- | :--- | :--- |
| `NextAuth()` | 引数: `NextAuthConfig`<br>戻り値: `{handlers, auth, signIn, signOut}` | 関数 | Server / Edge | 認証構成を元に、OIDCフローと独自セッション(JWE)生成を紐づける統合インターフェースを生成するファクトリ。 |
| `NextAuthConfig` | 値: `Object` | 型 | Server / Edge | IdP設定や、OIDCから独自JWEへのデータ詰め替え処理（コールバック）等の静的定義。 |
| `CredentialsSignin` | 値: `Error Class` | クラス | Server / Edge | Credentials認証失敗時のスロー用エラー。 |

### 2. インターフェースオブジェクト (`NextAuth()` の戻り値)
| API / プロパティ | 引数/戻り値/値 | 種類 | 実行コンテキスト | 役割・仕様概要 |
| :--- | :--- | :--- | :--- | :--- |
| `handlers` | 値: `{ GET: Function, POST: Function }` | オブジェクト | Server (Route Handlers) | OIDCコールバック受領など、認証プロセスのWeb標準リクエスト処理を委譲。 |
| `auth()` | 引数: `NextRequest \| undefined`<br>戻り値: `Promise<Session \| null> \| Function` | 関数 | Server (RSC) / Edge | Next.jsが発行した独自JWE(Cookie)を復号・評価し、アプリ用セッションを取得。ミドルウェア兼用。 |
| `signIn()` | 引数: `provider?: string, options?: Object`<br>戻り値: `Promise<void>` | 関数 | Server (Actions) | Server ActionsからOIDC認可フローを開始するミューテーション。 |
| `signOut()` | 引数: `options?: Object`<br>戻り値: `Promise<void>` | 関数 | Server (Actions) | Next.jsが発行した独自JWE(Cookie)を破棄するミューテーション。 |

### 3. クライアントサイドモジュール (`next-auth/react`)
| API / プロパティ | 引数/戻り値/値 | 種類 | 実行コンテキスト | 役割・仕様概要 |
| :--- | :--- | :--- | :--- | :--- |
| `SessionProvider` | 引数: `{ children, session? }` | コンポーネント | Client | JWEから評価済みのセッション状態をReact Contextで供給。 |
| `useSession()` | 戻り値: `{ data: Session \| null, status: string, update: Function }` | フック | Client | CSRにおけるセッション状態・フェッチ状態の抽出。 |
| `signIn()` | 引数: `provider?, options?, authParams?`<br>戻り値: `Promise<SignInResponse>` | 関数 | Client | CSRログイン処理・IdPへのリダイレクト開始。 |
| `signOut()` | 引数: `options?`<br>戻り値: `Promise<SignOutResponse>` | 関数 | Client | 独自JWEを破棄するためのAPIコール。 |
| `getSession()` | 引数: `options?`<br>戻り値: `Promise<Session \| null>` | 関数 | Client | CSRでの非同期セッションフェッチ。 |
| `getCsrfToken()`| 戻り値: `Promise<string>` | 関数 | Client | CSRFトークン取得。 |

### 4. JWT操作モジュール (`next-auth/jwt`) ※OIDCの生トークンではなく、Next.jsが「独自に生成したJWE」を操作するAPI群。
| API / プロパティ | 引数/戻り値/値 | 種類 | 実行コンテキスト | 役割・仕様概要 |
| :--- | :--- | :--- | :--- | :--- |
| `getToken()` | 引数: `{ req, secret, ... }`<br>戻り値: `Promise<JWT \| null>` | 関数 | Server / Edge | リクエストからNext.js独自のJWEを抽出・復号。 |
| `encode()` | 引数: `{ token, secret, ... }`<br>戻り値: `Promise<string>` | 関数 | Server / Edge | 抽出・詰め替え後のデータを、独自JWEとして暗号化。 |
| `decode()` | 引数: `{ token, secret, ... }`<br>戻り値: `Promise<JWT \| null>` | 関数 | Server / Edge | 独自JWE文字列の復号化。 |

### 5. `NextAuthConfig` の主要プロパティ
| プロパティ / 型 | 引数/戻り値/値 | 種類 | 役割・仕様概要 |
| :--- | :--- | :--- | :--- |
| `providers` | 値: `Array<Provider>` | 配列 | IdPの構成定義。 |
| `secret` | 値: `string` | 文字列 | 独自JWE生成/復号用のマスターキー。 |
| `session.strategy` | 値: `"jwt" \| "database"` | 文字列 | 独自セッションの保持方式（JWEに全て封入するか、IDのみCookieで他はDBか）。 |
| `callbacks.jwt` | 引数: `{ token, user, account, profile, trigger }`<br>戻り値: `Awaitable<JWT>` | 関数 | **OIDC完了直後の介入フック**。IdPからの生トークン等から必要なデータのみを抽出し、独自JWEの箱へ詰め替える。 |
| `callbacks.session`| 引数: `{ session, token, user }`<br>戻り値: `Awaitable<Session>` | 関数 | **独自JWE読み出し時の介入フック**。JWE内に退避したデータを、アプリ側で利用可能な変数(Session)として表へ引き渡す。 |
| `callbacks.signIn` | 引数: `{ user, account, profile, email, credentials }`<br>戻り値: `Awaitable<boolean \| string>` | 関数 | OIDC完了直後、独自セッションを発行する前のログイン可否判定。 |
| `callbacks.redirect`| 引数: `{ url, baseUrl }`<br>戻り値: `Awaitable<string>` | 関数 | コールバック後リダイレクト先検証。 |
| `events` | 値: `Record<string, Function>` | オブジェクト | ライフサイクル非同期副作用（ログ等）。 |

### 6. データモデルの基本型 (TypeScript)
| 型名 | 引数/戻り値/値 | 役割・仕様概要 |
| :--- | :--- | :--- |
| `Session` | 値: `{ user: User, expires: string, ... }` | 独自JWEを復号・評価後、アプリ側へ公開される最終的なセッション型。 |
| `User` | 値: `{ id?, name?, email?, image?, ... }` | IdP(Userinfo等)から抽出されたユーザー基本情報の型。 |
| `Account` | 値: `{ access_token?, id_token?, ... }` | **OIDCフローで直接取得した生トークン群**（そのままでは破棄されるデータ）。 |
| `Profile` | 値: `Record<string, any>` | OIDCフローで取得した生のプロファイル/クレーム。 |
| `JWT` | 値: `Record<string, any>` | Next.jsが**独自発行する内部セッション(JWE)ペイロード**の型。 |