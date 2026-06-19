# エラーハンドリング
## try文にエラーを投げる条件を書いておく
```js
try {
  const response = await fetch("");
  if (!response.ok) {
    throw new Error();
  }
} catch(e) {
  console.error("error: ", e)
}

// タイムアウト二も対応
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // ❶ fetch処理
    const response = await fetch(url, { signal });

    // ❷ タイムアウトをクリア（fetchが成功したら）
    clearTimeout(timeoutId);

    // ❸ response.okをチェック
    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // ❹ fetchエラー or タイムアウトエラーをキャッチ
    console.error("エラー:", error);
    throw error;
  }
}

fetchWithTimeout("https://jsonplaceholder.typicode.com/todos/1", 3000)
  .then(data => console.log("成功:", data))
  .catch(error => console.error("最終エラー処理:", error));

```


# 記述テクニック
## 命名規則
- `_prop`: _から始まるプロパティはプライベート変数として扱って欲しいというアピール
## 基礎
### チェーンメソッド
- オブジェクトの戻り値をthisにすることで、複数のメソッドを繋げて書ける
### コールバック関数
- 関数に関数を渡す
```js
function callback() {
  console.log('call backed');
}
function fn(cb) {
  cb()
}

fn(callback);
```
### 引数の数を合わなくてもいい事を忘れない
- 超過/不足があってもバグだ出ない変数なら、パフォーマンスが良くない引数の数を合わせる処理をするより、そのまま渡してしまった方がよい場合もある

### プライベート変数
- (**2024年現在は#variableが主流**)モジュールのクラスを、WeakMapを使ってプライベート変数にする
  - WeakMapを用いる事で、インスタンスの破棄と共に、wm内のキーも参照されていないと判定されて削除される
```js
const wm = new WeakMap();

export class Person {
    constructor(name) {
        // this._name = name;
        wm.set(this, {
            name
        });
    }

    hello() {
        console.log(`hello ${wm.get(this).name}`);
    }
}
```

## データ管理
### MapとSetの合わせ技
- 一つのプロパティをMapにして、その中にsetを複数いれて、必要なデータを管理する

### Proxy / Reflectの活用
#### 両方
- プロパティが見つからなかった時のデフォルト値を、`undefined`から変更する
- 値を変更しようとした時にエラーにする
#### Reflect
- 指定オブジェクトの機能を、違うオブジェクトを`this`として使用する(`get`)

## 非同期
### 非同期処理をグループ化
- コールバック関数を用いて、一つの関数にまとめる

### Promise
- Promise.resolve().then(() => {}) ジョブキューにタスクを詰める事になる

### 効率化
- Promise.all等で、なるべく少ないイベントループで終わらせると処理が早くなる


## DOM
### 要素の移動
- 既にDOM上にある要素を、Node追加系メソッドの引数にする

### イベントデリゲーション
- 伝播するイベントリスナーは、なるべく親要素にまとめる
- 重複定義を防げる

### 最適化
- `requestAnimationFrame`の活用

### UI制御
- UIロジックはdoMの寿命に合わせると安全