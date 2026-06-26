# module
## cache
- `next/cache/*`: cache制御
- 前提
  - client: 最初にprefetchしたviewを使い回し、このcacheがある限り自分からSRCを取得しない
  - server: clientから要求されるか、後述の関数を使わない限り、自発的にSRCをclientに送る事はない
- キャッシュ破棄系の関数は、RSC Payloadを行う(つまりclient側のキャッシュも無効にする)

| 関数 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `revalidatePath` | `path: string`<br>`type?: 'page' | 'layout'` | `void` | 指定したパスのデータキャッシュをオンデマンドで無効化し、パージする。 |
| `revalidateTag` | `tag: string` | `void` | 指定したタグに関連付けられたデータキャッシュをオンデマンドで無効化し、パージする。 |
| `unstable_cache` | `cb: Function`<br>`keyParts?: string[]`<br>`options?: { tags?: string[], revalidate?: number | false }` | `Promise<T>`<br>*(※Tはcbの戻り値)* | 非同期関数の実行結果をキャッシュする（リクエスト間・デプロイ間で永続化）。 |
| `unstable_noStore` | なし | `void` | キャッシュへのアクセスをオプトアウトし、対象コンポーネントを動的レンダリングに強制する。 |
| `cacheLife` | `profile: string | object` | `void` | `'use cache'`宣言内で使用し、キャッシュの有効期限やライフサイクルプロファイルを設定する。 |
| `cacheTag` | `...tags: string[]` | `void` | `'use cache'`宣言内で使用し、オンデマンドパージ（`revalidateTag`）用のタグをキャッシュに付与する。 |

## font
- `next/font/*`: ビルド時に静的assetと一緒にホスティングし、パフォーマンスを上げる
  - import *a from 'next/font/*b'に一致する場合
  - bからaフォントをダウンロードする
  - フォントを生成する関数(以後fontFnと呼称)を返す
- fontFnに対して引数にオプションのオブジェクトを渡すことで、cssModuleとして使える値が返る

## navigation
- `next/navigation`
| 関数 / メソッド | 実行環境 | 分類 | 主な役割・説明 |
| :--- | :--- | :--- | :--- |
| `useRouter()` | クライアント | フック | ルーターオブジェクトを取得する（移行や操作用） |
| `router.push(href)` | クライアント | メソッド | 指定したURLへ履歴を追加して遷移する |
| `router.replace(href)` | クライアント | メソッド | 現在の履歴を上書きして指定したURLへ遷移する |
| `router.refresh()` | クライアント | メソッド | 状態を保持したまま、現在のルートをサーバー側で再フェッチする |
| `router.back()` | クライアント | メソッド | ブラウザの履歴を1つ戻る |
| `router.forward()` | クライアント | メソッド | ブラウザの履歴を1つ進む |
| `router.prefetch(href)` | クライアント | メソッド | 指定したURLのデータをバックグラウンドで事前に取得する |
| `usePathname()` | クライアント | フック | 現在のURLのパス名（例: `/dashboard`）を取得する |
| `useSearchParams()` | クライアント | フック | 現在のURLのクエリパラメータ（`?key=value`）を取得する |
| `useParams()` | クライアント | フック | 動的ルートのパラメータ（例: `[id]` の値）を取得する |
| `redirect(path)` | サーバー / クライアント | 関数 | 処理を中断し、指定したパスへ即座にリダイレクトする（307） |
| `permanentRedirect(path)` | サーバー / クライアント | 関数 | 恒久的なリダイレクトを行う（308） |
| `notFound()` | サーバー / クライアント | 関数 | 意図的に404エラーを発生させ、`not-found.tsx`を表示する |
| `useSelectedLayoutSegment()` | クライアント | フック | 現在のレイアウトの1つ下の階層のルートセグメント名を取得する |
| `useSelectedLayoutSegments()` | クライアント | フック | 現在のレイアウトより下のすべての活動中のルートセグメント名を配列で取得する |

# lib
## front
### clsx
- 引数をjoin(' ')する
- 引数がオブジェクトの場合、値がtrueのkeyを文字列としてjoinする
