# 前提
## 通常のJWTセッション
* JWTをSSOTとして認証する: JWTに有効期限を含む認証に必要な全ての情報を詰め込む

# NextAuth.js
## 仕様
* JWEの対称: 鍵環境変数`NEXTAUTH_SECRET`
* Cookie: `next-auth.session-token`
## セッション
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

## Stateless vs Stateful
* ステートレス: JWEが傍受された場合、期限が切れるまで不正アクセスを拒絶できない
* ステートフル: I/Oの処理時間がかかる
* ステートフル: Middleware上で検証が不可