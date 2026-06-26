## pipeline
- 以下の削減
  - システムコール
  - パケット数
- 命令文をbyteの隙間なく送る事で、命令を次々に実行させる
- レスポンスを命令を処理し終わるまで貯めて、返す
- リクエストもレスポンスも個別で扱われるが、IPデータグラムとしては一まとまりで扱われる

## RPC(Remote Procedure Call)
### 概要
- ネットワーク越しの処理を、まるでローカル関数を呼ぶように実行できる技術の総称
- TypeScriptの型を途切れさせないなどのメリットがある
### Stub
1. client stub: clientがclient stub関数を呼び出す
2. marshaling: client stabの引数をネットワークで送信できる形式に変換・梱包
3. network: OSを通じて、梱包されたデータをサーバへ送信
4. unmarshaling: server stubがデータを解答
5. server: server stubがprocedure(実際の関数)を実行
6. network: 結果を返却