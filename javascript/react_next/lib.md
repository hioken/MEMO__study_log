# module
`next/font/*`: ビルド時に静的assetと一緒にホスティングし、パフォーマンスを上げる
  - import *a from 'next/font/*b'に一致する場合
  - bからaフォントをダウンロードする
  - フォントを生成する関数(以後fontFnと呼称)を返す
- fontFnに対して引数にオプションのオブジェクトを渡すことで、cssModuleとして使える値が返る

# lib
## front
### clsx
- 引数をjoin(' ')する
- 引数がオブジェクトの場合、値がtrueのkeyを文字列としてjoinする

# BuildInComponents
## next/image
- `<img>`の拡張機能`<Image>`コンポーネントを提供
  - レイアウトのズレ防止
  - 表示領域の小さいデバイスに対する、画像サイズの変更
  - 画像の遅延読み込みをカスタマイズ
  - 最新フォーマットの提供をカスタマイズ

| プロパティ名 | 値の型 | 説明（思い出し用） |
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