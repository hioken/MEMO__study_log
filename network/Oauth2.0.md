# 前提
## 用語
### OAuth
- サードパーティアプリによるHTTPサービスへの限定的なアクセスを可能にする認可フレームワーク
- サードパーティに認証情報を教える必要がない
### 認可フレームワーク
- アクセストークンによって認可を行う
- アクセストークンの発行方法フレームワークとも捉えられる
### 認証系
- クライアントID & クライアントシークレット: クライアント版のユーザーIDとパスワードの様なもの
- Bearerトークン: リクエスト元関係なく使えるtoken

# 全体の流れ
## ロール
- owner: リソースオーナー
- client: クライアントアプリ
- OAuthServer: 認可サーバー
- ResourceServer: リソースサーバー

## OAuthサーバとクライアントの認証情報
- OAuthはクライアントの認証情報 クライアントID, クライアントシークレットを保存する
- セキュアに保存できるか
  - yes: コンフィデンシャルクライアント, サーバーサイドapp
  - no: パブリッククライアント, ブラウザベースappやネイティブapp

## 認可サーバの機能
- リソースオーナーの認証(OAuthに対してのリソースオーナーの認証)
- クライアントのリソースへのアクセスについて、リソースオーナーの同意を得る
- アクセストークンを発行する

# トークン
## アクセストークン
- 要素
  - スコープ(どのリソースにどのような操作を行う事が許可されているか)
  - 有効期限
- Bearerトークン
```
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"mF_9.B5f-4.1JqM",
  "token_type":"Bearer",
  "expires_in":3600,
  "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA"
}
```
## リフレッシュトークン
- 必須ではない
- クライアントから認可サーバに対してアクセストークンの再発行を要求する際に使用される
## 認可コード
- リソースオーナーがクライアントへの権限委譲に同意した証
- ワンタイムパスワード
- クライアントから認可サーバに対してアクセストークンを要求する際に使用される
- 発行手
  - リソースオーナーの認証
  - アクセス権の委譲の同意を得る
  - 生成
  - HTTPリダイレクトを利用してクライアントに送信
  - 認可コードが利用できるのは一度だけ

# エンドポイントと流れ
## エンドポイント
- 認可エンドポイント
- トークンエンドポイント
- リダイレクトエンドポイント
## 基本シーケンス
- RSc: ResourceOwnerClient, OAs: OAuthServer
##### 認可コード発行まで
1. 【ログイン開始要求とリダイレクト指示】
  - Rq.`ROc`→`client`: ログイン要求
  - Rs.`client`→`ROc`: OAsへの302リダイレクト。URLに client_id、redirect_uri、state を含める
2. 【ログイン画面・同意画面の取得】
  - Rq.`ROc`→`OAs`: OAsの認可エンドポイントへGET通信
  - Rs.`OAs`→`ROc`: 200 OK。認証と権限同意のためのHTML画面を返す
3. 【認証情報の送信と認可コードの発行】
  - Rq.`ROc`→`OAs`: ユーザーの認証情報とアクセス同意をPOST通信
  - Rs.`OAs`→`ROc`: clientへの302リダイレクト。URLに code と state を含める
4. 【認可コードの受け渡し（リクエスト）】
  - Rq.`ROc`→`client`: clientの redirect_uri へアクセスし、認可コードを渡す
##### トークンエンドポイント
5. 【トークンリクエスト(アクセストークンの要求)】
  - Rq.`client`→`OAs`: (ROcへの返事を保留したまま) 受け取った code と client_secret を用い、OAsのトークンエンドポイントへPOST通信
  - Rs.`OAs`→`client`: アクセストークンを含むJSONデータを返す
6. 【認可コードの受け渡し完了】
  - Rs.`client`→`ROc`: (5の完了を待ってから) 200 OK。ログイン後の画面などを返す、あるいはホーム画面等へ302リダイレクトする

# グラントタイプ
## 基本仕様
- 認可コード
- インプリシット(Implicit)
- クライアントクレデンシャル(Client Credential)
- リソースオーナーパスワードクレデンシャル(RO Password Credential)

## クライアントの登録
- クライアントの開発者は、リソース提供元の組織に対して事前登録をする
- これにより、clientID, clientSecretの発行を受ける
  - クライアントから認可サーバーに対してのリクエストで使用される
- これらの流れは基本仕様で規定されていない

## 認可コードグラント
### 説明
- コンフィデンシャルクライアント(Confidential Client)に最適化されたグラント
- 実際はPKCEを使うことを前提に、あらゆるクライアントで採用される
- パブリッククライアントでも利用されるため、クライアントシークレットをリクエストに含まずクライアント認証を行わないケースも認められている
- クライアントと認可サーバーで直接通信できるため、セキュア
- リフレッシュトークンの発行が可能

### シーケンス
1. 認可コードの取得
2. アクセストークンの取得
3. リソースへのアクセス

#### 詳細
1. 【OAuthスタートとリダイレクト指示】
  - Rq.`ROc`→`client`: [1] OAuthスタート（画像編集アプリでの操作）
  - Rs.`client`→`ROc`: [2] リダイレクト（OAsの認可エンドポイントへ誘導）
    - `state1`: stateパラメータの値を生成、セッションに紐づける(規定ではないがほぼ必須)
2. 【認可リクエストと認証画面の取得】
  - Rq.`ROc`→`OAs`(認可エンドポイント): [3] 認可リクエスト
    - `state2`: この際stateが渡される
  - Rs.`OAs`(認可エンドポイント)→`ROc`: [4] 認証画面（ログイン画面の提供）
3. 【認証情報の送信と確認画面の取得】（※詳細化された部分）
  - Rq.`ROc`→`OAs`: [5] 認証情報入力（ID/パスワードの送信）
  - Rs.`OAs`→`ROc`: [6] 権限委譲の確認画面（「アクセスを許可しますか？」の画面提供）
4. 【委譲への同意と認可コードの発行】
  - Rq.`ROc`→`OAs`: [7] 委譲への同意（許可ボタンのクリック）
  - Rs.`OAs`→`ROc`: [8] 認可レスポンス（認可コードを含めた、clientのリダイレクトURIへの302リダイレクト）
5. 【認可コードの受け渡し】
  - Rq.`ROc`→`client`(リダイレクトURI): [9] 認可コードを持参してリダイレクトURIへアクセス
    - `state3`: クライアントは、stateを検証
  - レスポンスは保留
6. 【アクセストークンの要求と取得】（サーバー間通信）
  - Rq.`client`→`OAs`(トークンエンドポイント): [10] トークンリクエスト（認可コード＋シークレットを送信）
  - Rs.`OAs`(トークンエンドポイント)→`client`: [11] トークンレスポンス（アクセストークンの発行）
  - (※この直後、保留していた5のレスポンスとして、ROcにログイン完了の画面などを返します)
7. 【リソースへのアクセスとデータ取得】
  - Rq.`client`→`ResourceServer`: [12] リソースへのアクセス（11で得たアクセストークンを提示してAPIを叩く）
  - Rs.`ResourceServer`→`client`: [13] リソースの提供（画像データなどを返す）


### リクエスト/レスポンス
#### 認可リクエスト
- 2-Rq.`ROc`→`OAs`のリクエスト例
```http
GET /authorize
    ?response_type=code
    &client_id=s6BhdRkqt3
    &state=xyz
    &scope=read
    &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcallback

HTTP/1.1
Host: auth.example.com
```

- `response_type`: 認可コードの発行依頼
- `client_id` 
- `state`: クライアントが生成したランダムな値、クロスサイトフォージェリの防止
- `scope`
- `redirect_uri`: クライアントが事前登録の際に登録したリダイレクトURI

#### トークンリクエスト
##### Authorizationヘッダータイプ
- Basicの後: clientID:clientSecretをBase64でエンコードしたもの
```http
POST /token HTTP/1.1
Host: auth.example.com
Authorization: Basic czZCaGRSa3F0M3M0T0NYV2h3Ok1teXNjb3BiN2J3
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcallback
```
##### Bodyタイプ
- 基本仕様では、clientID, clientSecretをbodyに含む形を認めている
- Basic認証のためのAuthorizationヘッダーは不要
```http
POST /token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcallback
&client_id=s6BhdRkqt3
&client_secret=7Fjfp0ZBr1KtDRbnfVdmIw
```
- `grant_type`
- `code`: 認可コード
- `redirect_uri`
- `client_id`
- `client_secret`

#### トークンレスポンス
- トークンリクエストが承諾されると、トークンレスポンスが返る
- リフレッシュトークンと、アクセストークンの有効期限がクライアントに渡される
```http
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"A28TWpKL",
  "token_type":"Bearer",
  "expires_in":3600,
  "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA",
}
```
- `access_token`
- `token_type`
- `expires_in`: アクセストークンの有効期限
- `refresh_token`

#### リソースへのリクエスト
- Authorization Headerの値として`Bearer`という文字列と、アクセストークンの値を設定する


## インプリシットグラント
- 2023年より前から非推奨(認可コードグラント+PKCEが代替)
- パブリッククライアントのためのグラントタイプ
- ClientSecretを安全に保持できないため、クライアントから送信するリクエストにClientSecretを含むことが不可
- 代わりに事前登録したリダイレクトURIにアクセストークンを渡す