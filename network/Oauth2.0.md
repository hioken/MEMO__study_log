# 前提知識
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
### ネットワーク
- スキーム: `http://`などURLの先頭に置くプロトコルの明示など
- カスタムスキーム: アプリ専用の独自スキーム
  - URLを受け取った時、OS処理を横取りし、対応したアプリがあるか調べる
- Locationヘッダー: httpリダイレクトのヘッダー

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
- RSc: ResourceOwnerClient, OAs: OAuthServer, Cli: Client
##### 認可コード発行まで
1. 【ログイン開始要求とリダイレクト指示】
  - Rq.`ROc`→`Cli`: ログイン要求
  - Rs.`Cli`→`ROc`: OAsへの302リダイレクト。URLに client_id、redirect_uri、state を含める
2. 【ログイン画面・同意画面の取得】
  - Rq.`ROc`→`OAs`: OAsの認可エンドポイントへGET通信
  - Rs.`OAs`→`ROc`: 200 OK。認証と権限同意のためのHTML画面を返す
3. 【認証情報の送信と認可コードの発行】
  - Rq.`ROc`→`OAs`: ユーザーの認証情報とアクセス同意をPOST通信
  - Rs.`OAs`→`ROc`: clientへの302リダイレクト。URLに code と state を含める
4. 【認可コードの受け渡し（リクエスト）】
  - Rq.`ROc`→`Cli`: clientの redirect_uri へアクセスし、認可コードを渡す
##### トークンエンドポイント
5. 【トークンリクエスト(アクセストークンの要求)】
  - Rq.`Cli`→`OAs`: (ROcへの返事を保留したまま) 受け取った code と client_secret を用い、OAsのトークンエンドポイントへPOST通信
  - Rs.`OAs`→`Cli`: アクセストークンを含むJSONデータを返す
6. 【認可コードの受け渡し完了】
  - Rs.`Cli`→`ROc`: (5の完了を待ってから) 200 OK。ログイン後の画面などを返す、あるいはホーム画面等へ302リダイレクトする

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
  - Rq.`ROc`→`Cli`: [1] OAuthスタート（画像編集アプリでの操作）
  - Rs.`Cli`→`ROc`: [2] リダイレクト（OAsの認可エンドポイントへ誘導）
    - `state1`: stateパラメータの値を生成、セッションに紐づける(規定ではないがほぼ必須)
2. 【認可リクエストと認証画面の取得】
  - Rq.`ROc`→`OAs`: [3] 認可リクエスト
    - `state2`: この際stateが渡される
  - Rs.`OAs`→`ROc`: [4] 認証画面（ログイン画面の提供）
3. 【認証情報の送信と確認画面の取得】（※詳細化された部分）
  - Rq.`ROc`→`OAs`: [5] 認証情報入力（ID/パスワードの送信）
  - Rs.`OAs`→`ROc`: [6] 権限委譲の確認画面（「アクセスを許可しますか？」の画面提供）
4. 【委譲への同意と認可コードの発行】
  - Rq.`ROc`→`OAs`: [7] 委譲への同意（許可ボタンのクリック）
  - Rs.`OAs`→`ROc`: [8] 認可レスポンス（認可コードを含めた、clientのリダイレクトURIへの302リダイレクト）
5. 【認可コードの受け渡し】
  - Rq.`ROc`→`Cli`: [9] 認可コードを持参してリダイレクトURIへアクセス
    - `state3`: クライアントは、stateを検証
  - レスポンスは保留
6. 【アクセストークンの要求と取得】（サーバー間通信）
  - Rq.`Cli`→`OAs`: [10] トークンリクエスト（認可コード＋シークレットを送信）
  - Rs.`OAs`→`Cli`: [11] トークンレスポンス（アクセストークンの発行）
  - Rs.`Cli`→`ROc`: (保留していた5のレスポンスとして、ROcにログイン完了の画面などを返します)

### リクエスト/レスポンス
#### 認可リクエスト
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
### 説明
- 2023年より前から非推奨(認可コードグラント+PKCEが代替)
- パブリッククライアントのためのグラントタイプ
- ClientSecretを安全に保持できないため、クライアントから送信するリクエストにClientSecretを含むことが不可
  - トークンリクエスト&レスポンスを行わない、代わりに事前登録したリダイレクトURIにアクセストークンを渡す
- リフレッシュトークンが発行されない

### シーケンス
1. 【OAuthスタートとリダイレクト指示】
  - Rq.`ROc`→`Cli`: [1] OAuthスタート（画像編集アプリでの操作）
  - Rs.`Cli`→`ROc`: [2] リダイレクト（OAsの認可エンドポイントへ誘導）
    - `state1`: stateパラメータの値を生成、セッションに紐づける(規定ではないがほぼ必須)
2. 【認可リクエストと認証画面の取得】
  - Rq.`ROc`→`OAs`(認可エンドポイント): [3] 認可リクエスト
    - `state2`: この際stateが渡される
  - Rs.`OAs`(認可エンドポイント)→`ROc`: [4] 認証画面（ログイン画面の提供）
3. 【認証情報の送信と確認画面の取得】
  - Rq.`ROc`→`OAs`: [5] 認証情報入力（ID/パスワードの送信）
  - Rs.`OAs`→`ROc`: [6] 権限委譲の確認画面（「アクセスを許可しますか？」の画面提供）
4. 【委譲への同意とアクセストークンの直接発行】
  - Rq.`ROc`→`OAs`: [7] 委譲への同意（許可ボタンのクリック）
  - Rs.`OAs`→`ROc`: [8] 認可レスポンス（引換券ではなく、本物の**アクセストークン**を直接含めた、clientのリダイレクトURIへの302リダイレクト）
5. 【アクセストークンの受け渡し完了】
  - Rq.`ROc`→`Cli`: [9] **アクセストークン**を持参してリダイレクトURIへアクセス（ここでclientが直接トークンを受け取る）
    - `state3`: クライアントは、stateを検証
  - Rs.`Cli`→`ROc`: 200 OK。ログイン後の画面などを返す

### リクエスト/レスポンス
#### 認可レスポンス
```http
HTTP/1.1 302 Found
Location: http://client.example.com/callback
          #access_token=2YotnFZFEjr1zCsicMWpAA
          &token_type=bearer
          &scope=read
          &state=xyz
          &expires_in=3600
```
- `access_token`
- `token_type`
- `scope`
- `state`
- `expires_in`

## クライアントクレデンシャルグラント
### 説明
- アクセストークンの権限が、エンドユーザー単位ではなくアプリ単位
  - つまり、ROwner = Client
- クライアントがコンフィデンシャルクライアントであることが前提
- リフレッシュトークンの採用は非推奨

### シーケンス
1. 【トークンリクエスト/レスポンス】
  - Rq.`Cli`→`OAs`: [1] トークンリクエスト
  - Rs.`OAs`→`Cli`: [2] トークンレスポンス

### リクエスト/レスポンス
#### トークンリクエスト
```http
POST /token HTTP/1.1
Host: auth.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
scope=read
```
- `grant_type`
- `scope`
- **これらに加えてBasic認証のclientID, clientSecretを送付**

## リソースオーナーパスワードクレデンシャルグラント
### 説明
- ROwnerの認証情報がClientを介して認可サーバーに送られる
- よって、ClientがROwnerと同じ組織である場合に限る
- リフレッシュトークンが発行可能
- 事前登録(ClientID, ClientSecret)が任意
- **Clientはトークンリクエスト完了後、ROwnerの認証情報を直ちに破棄することが強く推奨される**

### シーケンス
1. 【認証情報の直接提供（リクエスト）】
  - Rq.`ROc`→`Cli`(ログイン用エンドポイント等): [1] ユーザー名、パスワード（ユーザーがclientの画面に直接入力して送信）
2. 【アクセストークンの要求と取得】（サーバー間通信）
  - Rq.`Cli`→`OAs`(トークンエンドポイント): [2] トークンリクエスト（ROcから受け取ったユーザー名とパスワードをそのままOAsへPOST通信）
  - Rs.`OAs`→`Cli`: [3] トークンレスポンス（パスワードが正しければアクセストークンを返す）
3. 【ログイン完了（レスポンス）】
  - Rs.`Cli`→`ROc`: (2の完了を待ってから) 200 OK。ログイン後の画面などを返す

### リクエスト/レスポンス
#### トークンリクエスト
```http
POST /token HTTP/1.1
Host: auth.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=password
&username=johndoe
&password=A3ddj3w
&scope=read
```
- `grant_type`
- `username`&`password`: ROwnerの認証情報
- `scope`
- 加えて、事前登録を行っている場合、Baxic認証のClientID, ClientSecretを送付

## リフレッシュトークンによる再発行
### 説明
- クライアントクレデンシャルグラントと同じ要領で、リフレッシュトークンとBasic認証によるアクセストークンの更新を行う
- リフレッシュトークンも更新する場合、古いトークンは破棄される

## 認可コードグラント+PKCE
### PKCE(ピクシー): Proof Key for Code Exchange
- カスタムスキームの重複があった際の、認可コードの横取りを防ぐ仕組み
- 入れ替わりが発生した際、アクセストークンを発生させない
##### パラメータ
- `code_verifler`: 長さが43~128文字からなるランダムな文字列
- `code_challenge`: code_veriflerに対して次のcode_challenge_methodの計算をほどこして算出された値
- `code_challenge_method`: 値はplain or S256
  - plain: `code_challenge = code_verifler`
  - S256: `code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verfler)))`

### 説明
- パブリッククライアント向けの推奨グラントタイプ

### シーケンス
1. 【OAuthスタートとリダイレクト指示】
  - ~
2. 【認可リクエストと認証画面の取得】
  - Rq.`ROc`→`OAs`: [3] 認可リクエスト
    - **PKCE1: code_challenge, code_challenge_methodを認可エンドポイントに伝える**
    - **PKCE2: 上記を認可サーバーが保存する**
  - Rs.`OAs`→`ROc`: [4] 認証画面
3. 【認証情報の送信と確認画面の取得】
  - ~
4. 【委譲への同意と認可コードの発行】
  - ~
5. 【認可コードの受け渡し】
  - ~
6. 【アクセストークンの要求と取得】
  - Rq.`Cli`→`OAs`: [10] トークンリクエスト
    - **PKCE3: パラメーターにcode_varifierを追加**
    - **PKCE4: 認可サーバーはcode_varifierを検証**
  - Rs.`OAs`→`Cli`: [11] トークンレスポンス
  - Rs.`Cli`→`ROc`

### リクエスト/レスポンス
#### 認可リクエスト
```http
GET /authorize
  ?response_type=code
  &client_id=s6BhdRkqt3
  &state=xyz
  &scope=read
  &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcallback
  <!-- ここから追加要素 -->
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
HTTP/1.1
Host: auth.example.com
```