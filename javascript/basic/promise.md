## 前提
```js
fetch('Task1') // ① 通信1 Promise1
  .then(cb1)   // ② cb1 = () => fetch('Task2') Promise2
  .then(cb2)   // ③ cb2 = () => fetch('Task3') Promise3
```
## 頭おかしくなった時のメモ
- `then(cb1)`の直接の戻り値ではなく、`cb1`の戻り値が`then(cb2)`に反映されるのは同期的におかしいことに気づいてくれ

## fetchアルゴリズム
### step1. C++バインディングの呼び出し
V8の実行コンテキストはJsから抜け、Ca::ののバインディング関数に制御を移す
### step2. `v8::Promise::Resolver`の生成とヒープ確保
- C++API`v8::Promise::Resolver.New()`などの呼び出し
- Jsのヒープ領域に`Promise 1`をアロケート
### step3. C++コンテキストの構築
- HTTP通信の状態を管理管理するためのC++構造体をメモリ上に生成
  - リクエスト先の情報
  - `v8::Promise::Resolver`の参照
### step4. libuvへの非同期I/Oの登録
- ネットワークを行うためにlibuvのAPIを呼び出す
- libuvはOSのノンブロッキングI/O機構に対して、ソケット通信の開始を指示
- libuvのハンドラ(イベントループの監視対象)の内部データとして、3-C++コンテキストの参照を紐づける
  - これにより、OSから完了通知が来た時に`Promise 1`まで辿れる
### step5. Jsスレッドへの制御返却と`Promise 1`のリターン

## PerformPromiseThenアルゴリズム
`then(cb2)`実行時の内部
### step1. `Promise 2`を生成
- `[[PromiseState]]`: `"pending"`
- `[[PromiseFulfillReactions]]`: `[]`
- `[[PromiseRejectReactions]]`: `[]`
### step2. `PromiseReaction`レコードの生成
- V8は`Promise 1`が完了した時に二つのレコードをメモリ上に作成
- `PromiseCapability`
  - `Promise 2`への参照
  - `resolve`, `reject`のポインタ
- `PromiseReaction`
  - `[[Type]]`: `Fullfill`
  - `[[Handler]]`: `cb1` ユーザーが定義したコールバック関数へのポインタ
  - `[[Capability]]`: `PromiseCapability`への参照
### step3. `Promise 1`の状態チェック
- V8は`then`の呼び出し元である`Promise 1`の内部スロット`[[PromiseState]]`を見に行く
- `pending` or `fulfilled`|`reject`
### pending: 4. `[[PromiseFulfillReactions]]`へのポインタ追加
- 2-`PromiseReaction`への参照を、`Promise 1`の`[[PromiseFulfillReactions]]`リストの末尾にpush
### pending: 5. コールスタックからのポップと`Promise 2`の返却
- V8は同期実行を完了、コールスタックから等コンテキストを破棄、呼び出し元スコープへ`Promise 2`の参照を戻り値として返却
### fullfilled|reject: 4. マイクロタスクキューへのエンキュー処理
- `HostEnqueuePromiseJob`へ分岐

## Promise解決手順
### stage 1. 完了通知と`PromiseReactionJob`のエンキュー
- `Promise 1`の状態を書き替えてキューにジョブを積む
#### step1. OSの完了通知とC++コールバックの呼び出し
- OSが通信完了を検知し、libuvのイベントループに通知
- libuvは通信開始時に紐づけておいたC++のコールバック関数をキック、レスポンスデータを渡す
#### step2. `FulfillPromise`アルゴリズム実行
- `FullfillPromise(Promise1, value)`で`Promise 1`のメモリ操作
  - `[[PromiseResult]]`にレスポンスデータを書き込む
  - `[[PromiseState]]`を`"fulfilled"`に書き替える
#### step3. `TriggerPromiseReactions`とジョブ生成
- `Promise 1`の状態確定に連動して、V8は内部スロットの`[[PromiseFulfillReactions]]`リストを読み取る
- リスト内の書く`PromiseReaction`レコードを取り出し、`PromiseRactionJob`(実行関数の`cb1`と解決先の`Promise 2 Capability`がパッケージ)をメモリに生成
#### step4. マイクロタスクキューへエンキュー、リストをクリア
- V8は`HostEnqueuePromiseJob`を呼び出し、1-3-`PromiseReactionJob`をマイクロタスクキューにPush
- `Promise 1`の`[[PromiseFulfillReactions]]`リストを`undifined`にする

### stage 2
- Jsのメインスレッドの再開
- Promise同士のポインタを繋ぎなおす
#### step5 ジョブのデキューとcb1の同期実行
- イベントループがマイクロタスクキューから`PromiseReactionJob`をpopし、V8のコールスタックに積む
- `cb1`が同期的に実行
- `cb1`がfetch想定のため、fetchアルゴリズムで`Promise X`をアロケート
#### step6 `ResolvePromise`の呼び出し
- V8はstep3でジョブに持たせていた`Promise 2`を解決しようとする
- `ResolvePromise(Promise 2, Promise X)`アルゴリズムが動作
  - V8は戻り値である`Promise X`を評価し、それが`thenメソッドを持つオブジェクトであること`を検知
#### step7 `promiseResolveThenableJob`のエンキュー
- V8は`Promise 2`を即座に解決しない
- `promiseResolveThenableJob`とい内部ジョブを生成、マイクロタスクキューにpush
  - `Promise 2` を解決（または拒否）するための内部関数（`Capability`）を、`Promise X` の内部リスト（`[[PromiseFulfillReactions]]` 等）に登録する
#### step8 同化完了
- `promiseResolveThenableJob`をpop
  - `Promise X.then(resolve Promise 2, reject Promise 2)`
  - `PerformPromiseThen`アルゴリズムがここでも走る
  - `Promise X`の`[[PromiseFulfillReactions]]`リストに`Promise 2`を解決する`PromiseReaction`レコードが追加
#### 補足
- `Promise X`の解決手順は、`then`の戻り値が非`Promise`だった時の"安全な"バージョン
- 安全の意味:
  - `Promise 2`の解決を許可するのに1tick使う
  - これは`Promise 2`の同化先が`then`を持っていればなんでも許可されてしまう仕様の穴を埋めるため

## 行程
### step1. 同期フェーズ
1. V8は`fetch`アルゴリズムで`Promise 1`を生成
2. `PerformPromiseThen`アルゴリズムで`Promise 2`を生成
3. `PerformPromiseThen`アルゴリズムで`Promise 3`を生成
### step2. 非同期フェーズ
- Promise解決手順に則り、キューを解決していく