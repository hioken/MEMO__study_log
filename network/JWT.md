# JWT
## 概要
- JSON Web Token
- RFC7519で規定されている表現形式
- Header, Payload, 署名で構成される
  - ヘッダー、ペイロード部分はBase64URLエンコードされたJSON
  - .で区切られた長い1行
## Header(JOSE Header/JSON OBject Signing and Encryption Header)
- `alt`(Algorithm)
  - 必須
  - 署名orMAC(メッセージ認証コード)の計算に使用される暗号化アルゴリズムの指定
  - IANAに登録されている企画から指定
- `typ`(Type)
  - 任意
  - トークンのメディアタイプ宣言
  - JWTは`JWT`と指定することが推奨されている
## Payload(JWT Claims Set)
### Registered Claims
- 全て任意
- `exp`(Expiration Time): 有効期限 NumericDate
- `nbf`(Not Before): トークンが有効になる日時 NumericDate
- `iat`(Issued At): トークンの発行日時 NumericDate
- `iss`(Issuer): 発行者 String or URI
- `sub`(Subject): 主題(通常はUserID) String or URI
- `aud`(Audience): 受信者 String or Array[string]
- `jti`(JWT ID): トークンの一意識別子 String
### Public Claims
- 自由
### Private Claims
- 合意済みの独自のクレーム
## Signature
- 署名