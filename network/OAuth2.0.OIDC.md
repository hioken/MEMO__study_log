# 概要
## 仕組み
* `OIDC = OAuth + IDToken + UserInfoエンドポイント`
* IDTokenとUserInfoは両方ともクライアントが利用する
* このIDTokenを使って認証を行う
* つまりOIDCはIDToken認証
## ロール
### 必須
※OIDC(OAuth)
* EndUser(ResourceOwner): EUser
* RelyingParty(Client): RP
* idProvider(認可サーバー): idP
### 必須ではない
* UserInfoEndPoint(ResourceServer): UIEp
  * 提供されるJSONの名前: `UseInfo Claims`

# OAuthとの違い
## フロー(グラントタイプ)
### 対応表(OAuth: OIDC)
* 認可コードグラント: 認可コードフロー
* インプリシットグラント: インプリシットフロー
* クライアントクレデンシャルグラント: -
* リソースオーナーパスワードクレデンシャルグラント: -
* ハイブリッドフロー: ハイブリッドフロー
## Scope
* scopeの値が仕様で規定されている(`openid`)

| 値 | 取得できる情報 |
| --- | --- |
| openid | **必須** OpenID Connectのリクエストであることを表す |
| profile | プロフィール情報へのアクセス |
| email | email, email_verifiedへのアクセス |
| address | addressへのアクセス |
| phone | phone_number, phone_number_verifiedへのアクセス |
## シーケンス
* トークンレスポンスにIDTokenが含まれる
* RP(Client)でIDTokenを検証し、既存のUserならその時点で認証を完了する

# 共通クレーム
## IDToken必須要素
* 一部クレームは、同一EUserのIDToken, AccessToken, UserInfoClaimsにおいて値を共有している
* `iss` (ISSuer)
  * 役割: IDトークンの発行者を表します。
  * 詳細: URLの形式、通常はIDプロバイダのURL
    * `public`: 全てのクライアントに同一の値
    * `pairwise`: クライアントごとに異なる値
* `aud` (AUDience)
  * 役割: IDトークンの発行を受けるリライング・パーティ（RP）のクライアントIDが入ります。
  * 詳細: 文字列の配列、単一の場合は文字列でも可
* `sub` (SUBject)
  * 役割: エンドユーザーの識別子
* `iat` (Issued AT)
  * 役割: JWTの発行時間 UNIXタイム
* `exp` (EXPiration time)
  * 役割: IDトークンの有効期限 UNIXタイム
* `nonce`
  * 役割: リプレイアタック防止のために用いられるランダムな文字列です。
  * 詳細: クライアントからの認証リクエストに含まれる `nonce` と全く同じ値が、発行されるIDトークンに含められる
## その他
* `jti`(JwT Id)
* `auth_time`(AUTHenticationTIME)
  * 役割: エンドユーザーがidPで実際に認証プロセスを行った日時
* `amr`(Authentication Methods Reference)
  * 役割: ユーザーがどのような方法で認証されたかを示す配列
* `acr`(Authentication Context class Reference)
  * 役割: 認証の強度レベル, 認証の達成要件を示す識別子

# IDToken
## 概要
* 使用場所: RP
* 目的: EUser認証
* 発行: idP
* 取得タイミング: トークンレスポンス

## 形式
### 概要
* JWT(JSON Web Token)

| 種類 | 説明 |
| --- | --- |
| ユーザー ID (sub) | エンドユーザーを識別するための ID。 |
| ID トークンの有効性を示す情報 | 有効期限や発行日時など |
| ID トークンのやり取りに関する情報 | トークン発行者 ID、トークン受領者 ID、 |
| ID トークンのフォーマット (JWT) に関する情報 | トークンの形式、署名方式 |
| ID トークンの署名 | 改ざんを防ぐための署名 |

### JWTの詳細
#### Header
```json
{
  "typ": "JWT",
  "alg": "RS256"
}
```
#### Payload
```json
{
  "iss": "https://accounts.google.com",
  "aud": "6727653....ibqog5.apps.googleusercontent.com",
  "sub": "103567684956724214211",
  "iat": 1563792930,
  "exp": 1563796530,
  "nonce": "0394852-3190485-2490358"
}
```
* `iss` (ISSuer)
* `aud` (AUDience)
* `sub` (SUBject)
* `iat` (Issued AT)
* `exp` (EXPiration time)
* `nonce`
#### Signature
- 公開鍵方式, RS256が一般的
googleの公開鍵の例
```json
{
  "keys": [
    {
      "alg": "RS256",
      "n": "uObuBVbjcjxgv8cfRc35ftqPY7YkwilrQwkkRw......JdKd5ol7w",
      "use": "sig",
      "kid": "3494b1e786cdad092e423766bbe37f54ed87b22d",
      "e": "AQAB",
      "kty": "RSA"
    },
    {
      "e": "AQAB",
      "kty": "RSA",
      "alg": "RS256",
      "n": "vFfCjiB67cRoJE-zyhZJyjDAUbdAd18Jt69Z......NCEOl-Zy1ul_w",
      "use": "sig",
      "kid": "60f4060e58d75fd3f70beff88c794a775327aa31"
    }
  ]
}
```

## 検証
### 説明
* 認可コードフローの場合はスキップ可能
* sub: EUserの識別子として利用
* iss: IDプロバイダのURL
* aud: 自身のClientID
* exp
* lat: 許容範囲内か
* nonce: 2,3番目の認証リクエストに含まれたnonceの値と、IDTokenのnonceの値
## nonce(Number used ONCE)検証
### 概要
* リプレイ攻撃を防ぐ
* フローごとのメカニズムは、各フローので解説

# UserInfoEndPoint
## 説明
* 認証には関係ない領域
  * 認証以外の目的でユーザー情報を利用する際に利用される
* OAuthの仕様として組み込まれている
* HTTPMethodはGET or Post
* AuthorizationヘッダーにBearerトークンとしてAccessTokenをセットする
* レスポンスに`sub`クレームを含む、IDTokenの`sub`と比較して入れ替えを検知できる

## リクエスト/レスポンス例
```http
GET /userinfo HTTP/1.1
Host: server.example.com
Authorization: Bearer SlAV32hkKG
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "sub": "248289761001",
  "name": "Jane Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "preferred_username": "j.doe",
  "email": "janedoe@example.com",
  "picture": "http://example.com/janedoe/me.jpg"
}
```

# フロー(OAuthグラントとの比較)
## トークンレスポンス例
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache
{
  "access_token": "SlAV32hkKG",
  "token_type": "Bearer",
  "refresh_token": "8xLOxBtZp8",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ.ewogImlzcyI6ICJodHRwOi8vc2VydmVyLmV4YW1wbGUuY29tIiwKICJzdWIiOiAiMjQ4Mjg5NzYxMDAxIiwKICJhdWQiOiAiczZCaGRSa3F0MyIsCiAibm9uY2UiOiAibi0wUzZfV3pBMk1qIiwKICJleHAiOiAxMzExMjgxOTcwLAogImlhdCI6IDEzMTEyODA5NzAKfQ.ggW8hZ1EuVLuxNuuIJKX_V8a_OMXzR0EHR9R6jgdqrOOF4daGU96Sr_P6qJp6IcmD3HP99Obi1PRs-cwh3LO-p146waJ8IhehcwL7F09JdijmBqkvPeB2T9CJNqeGpe-gccMg4vfKjkM8FcGvnzZUN4_KSP0aAp1tOJ1zZwgjxqGByKHiOtX7TpdQyHE5lcMiKPXfEIQILVq0pc_E2DzL7emopWoaoZTF_m0_N0YzFC6g6EJbOEoRoSK5hoDalrcvRYLSrQAZZKflyuVCyixEoV9GfNQC3_osjzw2PAithfubEEBLuVVk4XUVrWOLrLl0nx7RkKU8NXNHq-rvKMzqg"
}
```
## 認可コードフロー
* IDTokenがAccessTokenにくっつくだけ
* response_type: code
### nonce
* 認可コードの入れ替えに防ぐ
1. 認可リクエスト直前: nonceを生成、ブラウザのsession etcに一時保存
2. 認証リクエスト時: nonceを認可サーバーへ送る
3. 認可レスポンス時: 認可コードにnonceを紐づける
4. トークンレスポンス時: 認可コードを基にIDTokenにnonceを設定
5. トークン取得後: IDTokenのnonceとクライアントのsessionのnonceを比較

## インプリシットフロー
* **非推奨**
* IDTokenがAccessTokenにくっつくだけ
* response_type: id_token, id_token token
### nonce
* IDTokenの入れ替えを防ぐ
1. 認可リクエスト直前: nonceを生成、ブラウザのsession etcに一時保存
2. 認証リクエスト時: nonceを認可サーバーへ送る
3. 認証レスポンス時: IDTokenにnonceを紐づける
4. トークン取得後: IDTokenのnonceとクライアントのsessionのnonceを比較

## ハイブリットフロー
* **非推奨のため詳細は割愛**
* response_type: code id_token, code token, code id_token token
* コンフィデンシャルクライアントとパブリッククライアントの両方で運営されているサービス向け
* 認可コードフローとインプリシットフローを切り替える

## インプリシット, ハイブリットフロー非推奨に伴う代替アーキテクチャ
### BFF(Backend For Frontend)
* OIDCのためだけのシンプルなバックエンドサーバーを設ける
### パブリック認可コードフローへの統一
* ハイブリットフローが必要だったモデルは、コンフィデンシャルクライアントもパブリッククライアントと同様のPKCEを用いた認可コードフローを行う

# OpenID Configuration
## 説明
* エンドポイント, レスポンスタイプ, スコープetcの情報をJSONとして提示している
* 普及しなかった OpenID Connect Discovery という仕様の中で遅疑されている
* `[issuer]/.well-known/openid-configration`として定義されている

## クレーム
### googleの例
```json
// googleの例
{
  "issuer": "https://accounts.google.com",
  "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
  "device_authorization_endpoint": "https://oauth2.googleapis.com/device/code",
  "token_endpoint": "https://oauth2.googleapis.com/token",
  "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo",
  "revocation_endpoint": "https://oauth2.googleapis.com/revoke",
  "jwks_uri": "https://www.googleapis.com/oauth2/v3/certs",
  "response_types_supported": [
    "code",
    "token",
    "id_token",
    "code token",
    "code id_token",
    "token id_token",
    "code token id_token",
    "none"
  ],
  "subject_types_supported": [
    "public"
  ],
  "id_token_signing_alg_values_supported": [
    "RS256"
  ],
  "scopes_supported": [
    "openid",
    "email",
    "profile"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_post",
    "client_secret_basic"
  ],
  "claims_supported": [
    "aud",
    "email",
    "email_verified",
    "exp",
    "family_name",
    "given_name",
    "iat",
    "iss",
    "name",
    "picture",
    "sub"
  ],
  "code_challenge_methods_supported": [
    "plain",
    "S256"
  ],
  "grant_types_supported": [
    "authorization_code",
    "refresh_token",
    "urn:ietf:params:oauth:grant-type:device_code",
    "urn:ietf:params:oauth:grant-type:jwt-bearer"
  ]
}
```

### 詳細
* `Issuer`
* `~endpoint`, `~uri`: 各種エンドポイント/uri
* `~s_supported`: サポートしているxxx一覧

### 各種サポート
* `response_types_supported`: レスポンスタイプ
* `subject_types_supported`: subクレームのタイプ
* `id_token_signing_alg_values_supported`: IDTokenの署名アルゴリズム
* `scopes_supported`: OIDCのスコープ
* `token_endpoint_auth_methods_supported`: クライアント認証方法(ClientID, ClientSecretの指定方法)
  * `client_secret_post`: body
  * `client_secret_base`: AuthorizationヘッダーのBasic認証形式
* `claims_supported`: 全スコープのIDTokenもしくはUserInfoClaimsのプロフィールクレーム一覧
* `code_challenge_methods_supported`: PKCEのcode_challengeタイプ
* `grant_types_supported`: フロー/グラントタイプ

### 各種endpoint
#### フロー用
* `authorization_endpoint`: 認可リクエスト 必須
* `token_endpoint`: トークンリクエスト 準必須
* `userinfo_endpoint`: 認証後、ユーザー情報のリクエスト
* `jswks_uri`: 公開鍵を取得できるurl 必須
#### クライアント/セッション管理
* `registration_endpoint`: `redirect_uris`パラメータを送り、クライアントをidPに動的に登録 推奨
* `end_session_endpoint`: `id_token_hint`パラメータで対象のtokenを送り、対象EUserをログアウトさせる
* `check_session_iframe`: バックグラウンドで、idP側のログインセッションの継続を監視するURL
##### トークン管理
* `revocation_endpoint`: 発行済みのアクセス/リフレッシュトークンを強制的に無効化
* `introspection_endpoint`: 受け取ったAccessTokenの情報(有効, 権限)
* `device_authorization_endpoint`: テレビ等、ブラウザ(GUI)を持たないデバイスでの認可用
* `pushed_authorization_request_endpoint`: 認可リクエストのパラメータを事前にバックエンド通信でidPに送信し、安全に認可を開始する
##### ドキュメント
* `service_documentation`: 開発者向けガイド
* `op_policy_uri`: クライアントに求めるプライバシーポリシーetc
* `op_tos_uri`: 利用規約