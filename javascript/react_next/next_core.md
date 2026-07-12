# アーキテクチャ
## UI生成
### 概要
- UI生成をserberとclientで分ける
### ServerComponents
- Node.jsが使え、フロント関係のreact機能およびjsスクリプトは使用不可
  - railsのerbの様な、サーバー側でパラメータやDBの情報などを直接反映できる
  - イベントリスナーや状態は制御不可
- スクリプトも含めて事前にレンダリングされ、スクリプトはレスポンス時には破棄される
### ClientComponents
- `use client`で指定する
- Node.jsが使用不可で、reactの全ての機能が使用可能
  - DBへの干渉等、Node.jsが絡む処理を直接クライアントでは操作できない
  - reactのほぼ全てのサポートやイベントリスナーに対応
- スクリプトが関連しない箇所のみレンダリングされ、スクリプトはクライアントで実行する
  - レスポンス時に、クライアント側で必要か否かに問わず、RCC内で使用される全てのライブラリ等のパッケージを同時に送る




## AppRouter
### 概要
- railsのroutes.rbのような中央管理ファイルは存在しない
- `app/`配下に作成したフォルダの階層が、そのままURLパスになる
<!-- - 出力: app/users/[id]/ という特定のフォルダへの処理のルーティング（振り分け）。※ [id] のように括弧を使うことで、Railsの :id のような動的パラメータを受け取ります。 -->
### HTTP
- リクエストに対して、page.tsxかroute.tsを即座に起動して返すというシンプルな構造
### レスポンス
- レスポンス内容によってファイルが違う
  - コンポーネント: page.tsx
  - 非コンポーネント: route.ts

## キャッシュ
### 一覧
| キャッシュ名 | 保存場所 | ライフサイクル / 破棄条件 | 役割（一言） |
| :--- | :--- | :--- | :--- |
| **Request Memoization** | Node.js オンメモリ | 1回のリクエスト完了時に自動消滅（破棄不要） | 単一リクエスト内の重複fetchの自動圧縮 |
| **Data Cache** | サーバー ファイルシステム / KVS | 永続（`revalidatePath` または時間経過で破棄） | サーバーを跨いで永続化されるデータ取得結果 |
| **Full Route Cache** | サーバー ファイルシステム | 永続（Data Cacheの破棄と連動して自動再計算） | サーバー側で生成済みのHTML/RSC Payloadの静的化 |
| **Router Cache** | ブラウザ V8メモリ | セッション中（ハードリロードまたはRPCの更新通知でパージ） | ブラウザ側での画面遷移時にUI差分を即時復元 |

### 詳細
#### Request Memoization
- 1回のレンダリングツリー内で複数回呼ばれる同一の fetch を1回のネットワークI/Oに圧縮
- リクエスト完了と共に自動消滅するため、開発者が明示的に破棄（Invalidate）する必要はない

#### Router Cache
- Next.jsのルーターがブラウザのHistory APIをインターセプトする
- 「戻る」が押された際、ブラウザ本体のページ遷移処理をキャンセルし、V8メモリ上に保持しておいたRSC Payloadを使ってReactに即座にDOMを再構築
- JSのプロセスは死なない

## ライフサイクル例
### データの取得、更新フロー
1. RPCの呼び出し
2. 副作用の実行とキャッシュ破壊
3. RSCのインライン再評価
4. RPCの通常処理

# パーツ
## 全体像
```
my-app/
├── public/                 # 🌍 [Static] 静的アセット（ビルドを介さないファイル）
│   ├── images/             # 画像ファイル（/images/... でアクセス可能）
│   └── favicon.ico         # サイトアイコン
│
├── middleware.ts           # 🛡️ [Edge] L7リクエストインターセプト（認証、リダイレクト、i18nなど）
│
├── app/                    # 🚀 ルーティングとアプリケーションのコア
│   ├── layout.tsx          # [Server] 全ページ共通のルートレイアウト（<html>, <body>を定義）
│   ├── page.tsx            # [Server] '/' のエントリーポイント
│   ├── globals.css         # アプリ全体のグローバルスタイル（Tailwindなど）
│   │
│   ├── lib/                # 🛠️ ビジネスロジック・データ層・ユーティリティ
│   │   ├── definitions.ts  # [Type] アプリケーション全体の型定義（TypeScript）
│   │   ├── data.ts         # [Server] DBクエリや外部APIからのデータ取得関数（Fetch）
│   │   ├── actions.ts      # [Server] Server Actions（フォーム送信やDB更新のミューテーション）
│   │   └── utils.ts        # 日付フォーマットやクラス名結合などの純粋な関数
│   │
│   ├── ui/                 # 🎨 汎用的なUIコンポーネント（ルーティングに依存しない要素）
│   │   ├── components/     # ボタン、カード、フォームなどの部品
│   │   │   ├── button.tsx  # [Client] クリックイベントなどを持つUI（先頭に 'use client'）
│   │   │   └── card.tsx    # [Server] 状態を持たない表示専用のUI
│   │   ├── layout/         # ヘッダー、フッター、ナビゲーションバーなど
│   │   └── skeletons.tsx   # [Server] 読み込み中のプレースホルダーUI（Suspenseと併用）
│   │
│   ├── api/                # 🔌 外部向けAPIルート（Webhookや別アプリからの呼び出し用）
│   │   └── route.ts        # [Node.js] '/api' の生HTTPエンドポイント
│   │
│   └── users/              # 👥 '/users' 配下のルーティング
│       ├── layout.tsx      # [Server] users配下専用の共通UI（専用のサイドバーなど）
│       ├── page.tsx        # [Server] '/users' の一覧ページ
│       ├── loading.tsx     # [Server] ページ読み込み時に表示されるUI（自動でSuspenseラップ）
│       ├── error.tsx       # [Client] エラー発生時のフォールバックUI（必ず 'use client'）
│       │
│       └── [id]/           # 動的ルーティング
│           ├── page.tsx    # [Server] '/users/:id' の詳細ページ
│           └── not-found.tsx # [Server] ユーザーが見つからなかった時の404画面
│
├── .env                    # 🔐 環境変数（DB接続文字列、APIキーなど ※Gitには含めない）
├── next.config.js          # ⚙️ [Node.js] サーバー起動時の全体設定（画像ドメイン設定など）
└── tailwind.config.ts      # 🖌️ Tailwind CSSの設定ファイル
```

## UI描写
### Conponents
- ServerComponents(RSC)
  - 最終的に静的なhtmlになる
- ClientComponents
  - JavaScriptのハンドルファイル
- シリアライズ境界
  - RSCからClientCへPropsを渡す行為は、ネットワークを介したRPCやプロセス間通信と同義
  - JSONとしてシリアライズ可能な値のみ渡せる
<!-- ### RPC(リモートプロシージャコール) -->

## バックエンド(API)
### route.ts
  - DOM以外のデータをレスポンスする
  - Reactとは完全に切り離されている
### ServerActionS RPC(Premote Procedure Call)
- UI(RSC Payload)を返すAPI
- ファイルや関数に`"use server"`を宣言すると、UIDが設定される
- ClientCからこの関数を呼び出すと、裏で特殊なヘッダーを持った`fetch`を自動発行
- 関数の戻り値と、VDOM(更新が必要なコンポーネント差分)をレスポンスする

1. layout.tsxにより初期状態からの差分を演算し、レスポンス(VDOM)
2. ClientのReactは、初期と現在のUIの差分と、VDOMをマージ
3. 最終的に出来た差分データと、現在のUIを比較して再レンダリング

## DB
- 採用した一つのORMライブラリに集約される(Prisma, Drizzle ..etc)

## config/共通layout系
### layout.tst
- 共通レイアウト
- 初期レイアウトとして、メモリ内に保存される
### next.config.js
- 設定ファイル
- 完全にサーバー側で管理

# Middlewareと実行プロセス
## 実行プロセス
1. クライアント
2. Edge Runtime
3. Node.js

## ミドルウェア
- nextJsでのミドルウェアとは、middleware.ts(v16移行: ploxy.ts)を指す
- これはNode.jsに到達する前に、`Edge Runtime`(CDN上の軽量なjs環境)に配置される
- ここで必要なミドルウェアライブラリのimportや制御を行う
- `Edge Runtime`ではNode.jsが動いていないため、Node.jsのapiが使えない点に注意

## 実装例
- JWT + WebCryptoAPIの暗号化による認証
- JWTの情報をheaderに追加してnodeに送る
- 認証弾きetcのリダイレクト処理