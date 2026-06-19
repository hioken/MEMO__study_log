# アーキテクチャ
## UI生成
### 概要
- UI生成をserberとclientで分ける
### ServerComponents
- railsのerbの様な、サーバー側でパラメータやDBの情報などを直接反映できる
- イベントリスナーや状態は制御不可
### ClientComponents
- インタラクティブなUI部品
- `use client`で指定する
- reactのほぼ全てのサポートやイベントリスナーに対応

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



# 後で解決
## 1
(RPCの仕組みについて)
Q.
この仕組みだと、特定の現在のUIの条件に応じて返すDOMを変更したくて、バグを絶対起こしたくない場合
PRCを呼ぶclient側のハンドラに条件分岐に使うパラーメータを仕込みつつ、結果が返ってくるまで画面の全てのイベントの受付を拒否するみたいな実装になる？


A.
結論から言うと、**その推論は完全に正しいです。** 特に「絶対にバグ（不整合）を起こしたくない（厳格な一貫性が求められる）」場合、まさにその設計が基本となります。
なぜその実装になるのか、Node.jsとV8のメモリ、および非同期I/Oの観点から解説します。

#### 1. パラメータの仕込みが必須な理由（シリアライズ境界の制約）
前述の通り、Node.js（サーバー）はV8（ブラウザ）のメモリ空間（State）を一切覗き見ることができません。
したがって、サーバー側で「現在のUIの条件に応じたRSC Payload」を計算するためには、RPC（Server Action）の呼び出し時に、**現在のV8メモリ上にあるStateの値をJSON等にシリアライズし、引数として明示的にNode.jsへ渡す**必要があります。

#### 2. イベント受付拒否（Pessimistic Lock）が必要な理由（非同期による競合条件）
RPCを呼び出してからRSC Payloadが返ってくるまでの間には、ネットワークI/Oによるタイムラグが生じます。

もしこの待機中に画面のブロックを行わず、ユーザーがClient Componentを操作してV8上のState（例：別のタブを開く、フォームの値を書き換えるなど）を変更してしまった場合、どうなるか。
遅れて到着したRSC Payloadは、**「RPC呼び出し時点の古いState」を前提に作られたツリー**であるにもかかわらず、**「変更された後の新しいV8上のState」に対してDiffマージ**されようとします。これがUIの不整合（バグ）の直接的な原因となります。

#### 3. Reactにおける実際の実装手段
この非同期のギャップを埋め、ユーザーがご指摘した「イベントの受付拒否」を実装するために、Next.js（React 18以降）では主に以下のAPIを使用します。

* **`useTransition` (悲観的更新):**
RPCの実行をトランザクションとして扱い、実行中かどうかのフラグ（`isPending`）を取得します。このフラグが `true` の間、ボタンの `disabled` 属性を有効にしたり、画面全体にオーバーレイを被せて操作を物理的にブロックします。これが、ご提案いただいた「絶対にバグを起こさない」ための最も確実な実装です。
* **`useOptimistic` (楽観的更新 - 補足):**
逆にUIをブロックしたくない（UXを優先したい）場合は、RPCの完了を待たずにV8のメモリだけを先に「成功した状態」に書き換え、もしRPCからエラーや異なる状態のRSC Payloadが返ってきた場合は、React側で自動的にV8のメモリをロールバックさせるというアプローチも用意されています。

## 2
ormの勉強(prisma)