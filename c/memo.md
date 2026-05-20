# 用語
- トークン: 句

# 有用テクニック
### 構造化バッファ・ポインタ配列法 (Structured Buffer & Pointer Array)
* 用途: 可変長文字列（または可変長データ）の集合を、メモリ断片化を避けて2次元配列のように効率よく管理する
* 運用する構造体や配列、変数の数: 配列2つ（またはそれらをまとめた構造体1つ）
* メンバの内容や配列、変数の運用方法等:
* `string_pool[]`: すべての文字列を、末尾の `\0`（ヌル文字）も含めて1列に隙間なく詰め込むための巨大な単一文字配列
* `string_offsets[]`: `string_pool` の中に格納された各文字列の先頭アドレスを保持するポインタ配列

```c
#define TOTAL_POOL_SIZE 4096
#define MAX_ELEMENTS 100

char string_pool[TOTAL_POOL_SIZE];
char *string_offsets[MAX_ELEMENTS];
```

### コンテキストオブジェクト伝播法 (Context Object Propagation)
* 用途: 直前の処理結果や共通の状態（ステート）を連続して引き継ぎ、グローバル変数に頼らず高レイヤーのようなパイプライン処理を行う
* 運用する構造体や配列、変数の数: 構造体1つ（インスタンス変数は1つを使い回す）
* メンバの内容や配列、変数の運用方法等:
* `last_status`: 直前の関数処理が成功したか、あるいはエラーコードを格納するメンバ
* `accumulator`: 処理を通じて変化・蓄積していくメインのデータメンバ
* `config_flags`: 連続する関数群の挙動を制御する設定値
* この構造体のポインタ（`Context *`）を、一連のすべての関数の第1引数としてバケツリレー（伝播）させる

```c
typedef struct {
    int last_status;
    double accumulator;
    unsigned int config_flags;
} PipelineContext;

PipelineContext ctx = {0, 0.0, 0x01};
```

### 動的配列内包構造体 (Flexible Array Member)
* 用途: ヘッダ情報と可変長データを単一のメモリブロック（1回のmalloc）にまとめ、ポインタ管理の手間とメモリ断片化を最小化する
* 運用する構造体や配列、変数の数: 構造体1つ、変数は動的確保した構造体ポインタ1つ
* メンバの内容や配列、変数の運用方法等:
* `data_length`: 内包されている可変長データの実際のサイズを記録するメンバ
* `dynamic_payload[]`: 構造体の最末尾に配置する、要素数を空にした配列（C99規格）。構造体全体のサイズには含まれず、`malloc` 時に追加で確保したメモリへの窓口となる

```c
typedef struct {
    int data_length;
    char dynamic_payload[]; // 末尾に配置。サイズ指定は空
} PackedPacket;

PackedPacket *packet = malloc(sizeof(PackedPacket) + 512); // 追加で512バイト確保
```

### 不透明ポインタカプセル化法 (Opaque Pointer / Handle)
* 用途: 構造体の具体的なメンバ構成をソースファイル（.c）内に隠蔽し、利用側にはポインタ（ハンドル）のみを扱わせることで、高レイヤー言語のような強固なカプセル化（オブジェクト指向）を実現する
* 運用する構造体や配列、変数の数: 不完全型の構造体宣言1つ（ヘッダ側）、実体定義1つ（ソース側）、ポインタ変数1つ
* メンバの内容や配列、変数の運用方法等:
* ヘッダ側では構造体の名前だけを宣言し、中身は一切見せない
* ソース（.c）側で初めて内部メンバ（ID、内部ステート、リソースポインタ等）を定義する
* 利用者は構造体のサイズを知り得ないため、直接メンバを触ることも静的に実体を確保することもできず、必ず専用の生成関数が返すポインタ（ハンドル）経由で運用する

```c
// --- user_session.h (ヘッダファイル) ---
typedef struct UserSession UserSession; // 名前だけの宣言（不完全型）

// --- user_session.c (ソースファイル) ---
struct UserSession {
    int session_id;
    char user_name[32];
    void *internal_token;
}; // 実際の構造（メンバ）はここで定義
```

### タグ付き共用体 (Tagged Union / Variant)
* 用乎: 同じメモリ領域を複数の異なる型（int, float, ポインタ等）で共有させ、現在のデータ型を安全に識別しながら動的なマルチ型変数を運用する
* 運用する構造体や配列、変数の数: 構造体1つ（内部に列挙型と共用体を内包する）
* メンバの内容や配列、変数の運用方法等:
* `active_type`: 現在どの型としてデータを保持しているかを示す列挙型（enum）メンバ
* `storage`: 異なるデータ型を重ね合わせた共用体（union）メンバ
* `active_type` の値を確認（switch文等）してから `storage` 内の対応する型メンバにアクセスすることで、型安全性を確保しながらメモリを極限まで節約する

```c
typedef enum { TYPE_INT, TYPE_FLOAT, TYPE_PTR } DataType;

typedef struct {
    DataType active_type;
    union {
        int int_val;
        float float_val;
        void *ptr_val;
    } storage;
} VariantValue;

VariantValue var;
```

# 基礎雑メモ
## 宣言・定義系
### 宣言
- プロトタイプ宣言(関数の宣言)の引数では、引数名は省略可能
- 変数で宣言のみを行うには`extern`を付ける
- メイン関数の外で定義 = グローバル変数
- 配列は、1データ型あたりのサイズ(byte) * 配列の要素数、メモリを確保する
- 配列の初期化
  - 通常: しない(さっきまでメモリに入っていたデータ)
  - 一部代入: する(残りを全て0)
### 定義
- `戻り値の型 関数名(型名 引数名) {}` 引数とか、逐一型宣言が必須
- `void`型以外は戻り値の明示が必須
- 引数でポインタポインタ型を書く時の書き方
  - `int** p`
  - `int* p[]`
- 配列のポインタ型(厳密には、int×N型のポインタ)
  - `int p[][N]`
### モジュール化
| 規模・役割 | 推奨される場所 | 理由 |
| :--- | :--- | :--- |
| **小道具 (1〜5行程度)** | **ヘッダに `static inline`** | 速度重視。コピペ（埋め込み）されても無害。 |
| **複雑なロジック (10行〜)** | **`.c` ファイルに実体** | 巨大なコードをあちこちにコピペすると重くなるため。 |
| **巨大なシステム** | **複数の `.c` と `.h`** | 変更したときに、そのファイルだけコンパイルすれば済む。 |

## 構文系
### 条件分岐
- `if`が1行ならブロックいらない

## データ系
### 仕様
- `0`と`\0`は内部的には一緒、書き方の違い
- 型の構成要素
  - サイズ
  - アライメント
  - 演算ルール
- 配列のポインタへの退化（Array-to-pointer decay
  - 配列を丸ごと指定すると、ほとんどの処理で配列の先頭のアドレスに変換される
### キャスト
- `char`も`int`もメモリ内部の扱いは変わらない、出力する時に型に合わせて変換するだけ、よって以下のようなことが可能
  - 数文字から`'0'`を引いて文字数値を数値に変換する(to_i系)
  - 特定の計算をして、大文字化、小文字化等の操作

## スコープ・定数系
### スコープ
- ローカル変数: ほぼブロック
- forのカウント変数: ループ内
- `static`ローカル: ブロック(メモリ永久)
- `static`グローバル: ファイル(メモリ永久)
### 定数
| 特徴 | `#define` | `const` | `enum` |
| :--- | :--- | :--- | :--- |
| **処理のタイミング** | **プリプロセッサ** (コンパイル前) | **コンパイラ** (コンパイル時) | **コンパイラ** (コンパイル時) |
| **正体** | 単なるテキスト置換 | 読み取り専用の**変数** | 関連する**整数の定数リスト** |
| **型チェック** | なし（ただの字句） | **あり**（厳密） | **あり**（整数として扱われる） |
| **スコープ** | 定義以降、ファイル全体 | 定義されたブロック内 `{ }` | 定義されたブロック内 `{ }` |
| **デバッグ情報** | **なし**（数字に化ける） | **あり**（変数名が見える） | **あり**（列挙名が見える） |
| **メモリ確保** | なし（即値として埋め込み） | 通常あり（最適化で消える事も） | なし（即値として扱われる） |
| **自動連番** | なし（手動で書く） | なし | **あり**（0, 1, 2...と自動付与） |

### マクロ
| 特徴 | マクロ関数 (`#define`) | `inline` 関数 |
| :--- | :--- | :--- |
| **正体** | 単なる文字列の「置き換え」 | 本物の「関数」 |
| **型チェック** | **なし** (どんな型でも受け取れてしまう) | **あり** (安全) |
| **引数の評価** | 複数回評価されるリスクあり (副作用に弱い) | 一度だけ評価される (安全) |
| **デバッグ** | ステップ実行ができず、非常に困難 | ステップ実行が可能で容易 |
| **汎用性** | 擬似的に「テンプレート」のような挙動が可能 | 型が固定される (C11以降は `_Generic` で対応可) |

- 厳密には、マクロが指すのは`#define`, `__FILE__`, `__LINE__`の三つ

## 標準入力
### FILE構造体
- ファイル記述子
- バッファ: 読み書き用のデータを一時的に溜めておく領域
- 現在の読み書きポインタ

### 処理
`fopen`
1. `open`システムコール
2. OSがファイル記述子を返す
3. バッファ用のメモリ確保
4. ファイル記述子をFILE構造体のポインタに返す

`fputs`
1. `fputs`で渡した文字列を、FILE構造体のバッファに`memcpy`
2. バッファの限界or`\n`まで、ため込む
3. `write`システムコール

`fgets`
1. バッファが空なら`read`システムコール
2. `\n`までを取得

`fclose`
1. flush: 書き込みモード時、バッファの残りを強制書き出し(`write`システムコール)
2. `close`システムコール
3. 使っていたメモリを解放

### コマンドライン
- `-a file.txt`を渡した例
1. `['.', '/', 'a', '.', 'o', 'u', 't', '\0']`, `['-', 'a', '\0']`, `['f', 'i', 'l', 'e', '.', 't', 'x', 't', '\0']` という3つのcharの塊が、メモリのどこかに展開される。

2. `["./a.out"へのアドレス, "-a"へのアドレス, "file.txt"へのアドレス, NULL]` が並んだ、アドレス型（ポインタ）の塊がメモリのどこかに展開される。

3. この「アドレス型の塊」の先頭（"./a.out"へのアドレスが格納されている場所）が、`argv`に渡る。

## メモリ管理
### malloc
- vs `array[n]`: `free`をするまでメモリを確保し続ける点が違う
- ポインタを見失わないように注意

## ファイル分割
- `#ifndef`と`#efine`でヘッダの重複includeを避ける


# 高レイヤーから移行雑メモ
- 変数にも関数にも宣言が必須
- `void`型以外は戻り値の明示が必須
- セミコロン `;` 忘れは許されない
- 型推論なし。すべて型名を指定
- 真偽値は `0`（偽）かそれ以外（真）。`bool` は `<stdbool.h>` が必要
- 文字列比較は `==` 不可。`strcmp` を使う
- 文字列終端の `\0` を考慮したバッファ確保
- 配列の要素数保持は自前。境界チェックなし
- 整数同士の割り算は小数点切り捨て
- `malloc` したら `free` が絶対
- ポインタ操作ミスは即セグフォ（強制終了）
- 構造体ポインタへのアクセスは `->`
- 例外処理（try-catch）なし。戻り値で判定
- `#include` ガードをヘッダーに書く
- データはbyte単位で見て、配列はbyte * 要素数を確保したメモリ領域、およびその住所を指したものだと考える事
- 構造体は値渡し
- コンパイル型はシンボルテーブルを一括で作るため、動作順だけではなく、文法上から作られるルールもある事に注意
  - 例: 配列の情報など


# 基礎構文
## 1. 制御構文：選択文（分岐）
### 一覧
| 構文名 | 書式例 | 説明 |
| :--- | :--- | :--- |
| **if文** | `if (条件) { ... }` | 条件が真の場合にブロック内を実行する |
| **else句** | `else { ... }` | ifの条件が偽の場合に実行する（単独使用不可） |
| **else if句** | `else if (条件) { ... }` | 前の条件が偽で、新たな条件が真の場合に実行する |
| **switch文** | `switch (変数) { ... }` | 変数の値に応じて実行するcaseラベルを選択する |
| **caseラベル** | `case 定数:` | switch文内で一致する値を指定する |
| **defaultラベル** | `default:` | switch文でどのcaseにも一致しない場合に実行する |

### 例
```c
if (score >= 90) {
  // 
} else if (score >= 70) {
  // 
} else {
  // 
}

switch (expr) {
  case 1:
  case 2:
    // 
    break;
  case 3:
    // 
    break;
  default:
    // 
    break;
}
```

## 2. 制御構文：反復文（ループ）
特定の処理を繰り返し実行するための構文です。

| 構文名 | 書式例 | 説明 |
| :--- | :--- | :--- |
| **for文** | `for (初期化; 条件; 更新) { ... }` | カウンタ変数を用いて規定回数の反復を行う |
| **while文** | `while (条件) { ... }` | 条件が真である間、処理を繰り返す（前判定） |
| **do-while文** | `do { ... } while (条件);` | 処理を実行後に条件を判定する（最低1回は実行） |

## 3. 制御構文：ジャンプ文
プログラムの実行フローを強制的に移動させるための構文です。

| 構文名 | 書式例 | 説明 |
| :--- | :--- | :--- |
| **break文** | `break;` | 現在のループまたはswitch文から脱出する |
| **continue文** | `continue;` | ループの現在の回を終了し、次の反復（更新式）へ飛ぶ |
| **return文** | `return 値;` | 関数の実行を終了し、呼び出し元に値を返す |
| **goto文** | `goto ラベル名;` | 同一関数内の指定したラベルへ無条件にジャンプする |

## 4. 宣言・定義構文
変数、関数、型などをプログラム内で利用可能にするための構文です。
### 一覧
| 構文名 | 書式例 | 説明 |
| :--- | :--- | :--- |
| **変数宣言** | `型名 変数名;` | 指定した型のデータを格納するメモリ領域を確保する |
| **関数定義** | `戻り値型 関数名(引数) { ... }` | 特定の処理をひとまとめにした関数を作成する |
| **構造体定義** | `struct タグ名 { 型 メンバ; ... };` | 異なる型のデータを一つにまとめた型を定義する |
| **共用体定義** | `union タグ名 { 型 メンバ; ... };` | 同じメモリ領域を異なる型で共有する型を定義する |
| **列挙型定義** | `enum タグ名 { 定数1, ... };` | 整数定数に名前を付けて管理する型を定義する |
| **typedef句** | `typedef 既存型 新型名;` | 既存の型に新しい名前（別名）を付ける |
| **extern宣言** | `extern 型 変数名;` | 他のファイルで定義された変数を参照することを宣言する |
| **static修飾** | `static 型 変数名;` | 静的な記憶域期間（プログラム終了まで保持）を指定する |

### 例
```c
#define COSTANT 0.1

// 使わない方
struct structName {
  int val1;
  int val2;
};

struct structName data;
data.val1 = 1;

// 使う方
typedef struct {
  int val1;
  int val2;
} structName

structName data;
data.val = 1;

// ポインタ
structName *dataPointer;
*dataPointer = &data;

// 呼び出し構文2種
(*dataPointer).val1;
dataPointer->val1;

```

## 5. 式文・複合文（ブロック）
計算や代入、および複数の文をまとめるための基本単位です。

| 構文名 | 書式例 | 説明 |
| :--- | :--- | :--- |
| **式文** | `a = b + c;` | 式の後にセミコロンを付けた、最も一般的な実行単位 |
| **複合文** | `{ 文1; 文2; ... }` | 複数の文を `{}` で囲み、一つの文として扱う（ブロック） |
| **空文** | `;` | 何もしない文。ループの本体を空にする際などに用いる |
| **ラベル文** | `ラベル名:` | goto文のジャンプ先として名前を定義する |

## 6. プリプロセッサ指令
コンパイルの直前に実行される、ソースコードの加工指示です。

| 指令名 | 書式例 | 説明 |
| :--- | :--- | :--- |
| **#include** | `#include <header.h>` | 指定したライブラリを読み込む(厳密には`""`でも動く) |
| **#include** | `#include "header.h"` | 指定した外部ファイルを読み込む |
| **#define** | `#define 定数名 値` | マクロ置換や定数定義を行う |
| **#undef** | `#undef 定数名` | 定義済みのマクロを無効化する |
| **#if / #endif** | `#if 条件 ... #endif` | 条件が真の場合のみ、その範囲をコンパイル対象とする |
| **#ifdef / #ifndef**| `#ifdef マクロ名` | マクロが定義されている（またはいない）場合にコンパイル |
| **#else / #elif** | `#else` | 条件分岐プリプロセッサの否定条件を指定する |
| **#pragma** | `#pragma 指令` | コンパイラ固有の特殊な設定を行う |
| **#error** | `#error メッセージ` | コンパイル時に意図的にエラーを発生させ停止する |

# 型
## 一覧
| 型名 | 変換指定子 | 説明 |
| :--- | :--- | :--- |
| `char` | `%c` | 文字/1B整数 |
| `short` | `%hd` | 短精度整数 |
| `int` | `%d` | 整数 |
| `long` | `%ld` | 長精度整数 |
| `long long` | `%lld` | 8B整数 |
| `float` | `%f` | 単精度実数 |
| `double` | `%f` (scanfは `%lf`) | 倍精度実数 |
| `long double` | `%Lf` | 拡張精度実数 |
| `void` | - | 型なし |
| `_Bool` | `%d` | 真偽値 |
| `T*` (ポインタ) | `%p` | メモリアドレス(単体では成立しない) |
## キャスト変換
| 説明 | 変換後の型 | 値1の型 | 値2の型 |
| :--- | :--- | :--- | :--- |
| `(int)3.9` (小数点切り捨て) | `int` | `double` | - |
| `(double)5` (実数化) | `double` | `int` | - |
| `1 + 1.2` (暗黙の型昇格) | `double` | `int` | `double` |
| `(unsigned)-1` (符号の破棄) | `unsigned` | `int` | - |
| `(int*)v_ptr` (汎用ポインタ変換) | `int*` | `void*` | - |
| `(char*)p` (ポインタ読み替え) | `char*` | `int*` | - |
| `(uintptr_t)p` (アドレス数値化) | `uintptr_t` | `void*` | - |
| `(void*)0x100` (数値の住所化) | `void*` | `long` | - |
| `(void)x` (未使用警告の抑制) | `void` | `Any` | - |

# 演算子
| 演算子 | オペランド数 | 説明 |
| :--- | :--- | :--- |
| `sizeof` | 1 (型/変数) | バイトサイズの取得（コンパイル時確定） |
| `&` | 1 (変数) | メモリ上のアドレス（住所）を取得 |
| `*` | 1 (ポインタ) | ポインタが指すアドレスの実体を参照 |
| `(型名)` | 1 (値) | キャスト（型の強制変換） |
| `[]` | 2 (配列, 添字) | 配列要素へのアクセス |
| `.` | 2 (実体, メンバ) | 構造体のメンバアクセス |
| `->` | 2 (ポインタ, メンバ) | 構造体ポインタ経由のメンバアクセス |
| `++` / `--` | 1 (変数) | インクリメント / デクリメント |
| `,` | 2 (式1, 式2) | 順次評価（左を実行して右の結果を返す） |
| `_Alignof` | 1 (型) | 型の整列（アライメント）要件を取得 |

# 識別子
| 識別子 | 種類 | 説明 |
| :--- | :--- | :--- |
| `__func__` | 事前定義された識別子 | 実行中の関数名を保持する。 |
| `__FILE__` | 定義済みマクロ | 現在のソースファイル名を表す。 |
| `__LINE__` | 定義済みマクロ | 現在の行番号を整数で表す。 |
| `__DATE__` | 定義済みマクロ | コンパイルした日付（"Mmm dd yyyy"）を表す。 |
| `__TIME__` | 定義済みマクロ | コンパイルした時刻（"hh:mm:ss"）を表す。 |
| `__STDC__` | 定義済みマクロ | ISO標準Cに準拠している場合に1となる。 |
| `__STDC_VERSION__` | 定義済みマクロ | 準拠しているC規格のバージョンを長整数で表す。 |
| `__STDC_HOSTED__` | 定義済みマクロ | 標準ライブラリが全て利用可能な環境で1となる。 |

# 標準ライブラリ
## 1. 入出力操作 (<stdio.h>)
標準入出力、ファイル操作、バッファ制御に関連する関数群です。

| 関数名 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| printf | const char *format, ... | int | 標準出力に書式付きでデータを出力する |
| scanf | const char *format, ... | int | 標準入力から書式付きでデータを読み込む |
| fprintf | FILE *fp, const char *fmt, ... | int | 指定したファイルに書式付き出力を行う |
| fscanf | FILE *fp, const char *fmt, ... | int | 指定したファイルから書式付き入力を行う |
| sprintf | char *str, const char *fmt, ... | int | 文字列配列に書式付き出力の結果を書き込む |
| sscanf | const char *str, const char *fmt, ... | int | 文字列から書式付きでデータを読み取る |
| snprintf | char *s, size_t n, const char *fmt, ... | int | 文字数を制限して文字列に書式付き出力を行う |
| getchar | void | int | 標準入力から1文字読み込む |
| putchar | int c | int | 標準出力に1文字出力する |
| fgetc | FILE *fp | int | ファイルから1文字読み込む |
| fputc | int c, FILE *fp | int | ファイルに1文字出力する |
| fgets | char *s, int n, FILE *fp | char * | ファイルから1行（最大n-1文字）読み込む |
| fputs | const char *s, FILE *fp | int | ファイルに文字列を出力する |
| puts | const char *str | int | 標準出力に文字列を出力し、改行する |
| fopen | const char *path, const char *mode | FILE * | ファイルを指定モード（r, w, a等）で開く |
| fclose | FILE *fp | int | ファイルを閉じる |
| fread | void *p, size_t s, size_t n, FILE *fp | size_t | ファイルからバイナリデータを読み込む |
| fwrite | const void *p, size_t s, size_t n, FILE *fp | size_t | ファイルにバイナリデータを書き込む |
| fseek | FILE *fp, long offset, int origin | int | ファイルポインタを特定位置へ移動する |
| ftell | FILE *fp | long | 現在のファイルポインタの位置を取得する |
| rewind | FILE *fp | void | ファイルポインタを先頭位置に戻す |
| fflush | FILE *fp | int | 出力バッファの内容を強制的に書き出す |
| remove | const char *filename | int | 指定したファイルを削除する |
| rename | const char *old, const char *new | int | ファイル名を変更する |
| perror | const char *s | void | エラー番号に対応するメッセージを標準エラーに出力 |

## 2. 文字列・メモリ操作 (<string.h>)
文字列処理および、バイト単位でのメモリブロック操作を行う関数群です。
### コピー系比較
| 関数 | 説明（比較を含む） |
| :--- | :--- |
| **memcpy** | **指定バイト転送**。最速だが領域重複に弱く、strcpyと違い\0を無視して全ビットを写す。 |
| **memmove** | **重複領域対応**。memcpyより汎用的だが、重なり判定を行うため僅かに遅い。 |
| **strcpy** | **\0まで転送**。サイズ指定不要。strncpyと違い上限がないためバッファ溢れに弱い。 |
| **strncpy** | **最大nバイト転送**。strcpyより安全だが、memcpyと異なり途中の\0で停止する。 |
| **strdup** | **新規確保と転送**。他と違い内部でmallocを行うため、使用後にfreeが必要。 |

### 一覧
| 関数名 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| strlen | const char *s | size_t | 文字列の長さ（ヌル文字を除く）を(正確には最初の`\0`までの長さを)取得する |
| strcpy | char *dest, const char *src | char * | 文字列をコピーする |
| strncpy | char *dest, const char *src, size_t n | char * | 最大n文字まで文字列をコピーする |
| strcat | char *dest, const char *src | char * | 文字列の末尾(正確には最初の`\0`から)に別の文字列を連結する |
| strncat | char *dest, const char *src, size_t n | char * | 最大n文字まで文字列を連結する |
| strcmp | const char *s1, const char *s2 | int | 文字列を比較する（一致すれば0） |
| strncmp | const char *s1, const char *s2, size_t n | int | 最大n文字まで文字列を比較する |
| strchr | const char *s, int c | char * | 文字列内で特定の文字が最初に現れる位置を検索 |
| strrchr | const char *s, int c | char * | 文字列内で特定の文字が最後に現れる位置を検索 |
| strstr | const char *s1, const char *s2 | char * | 文字列内で特定の文字列を検索する |
| strtok | char *s, const char *delim | char * | 文字列を区切り文字でトークンに分割する |
| strpbrk | const char *s1, const char *s2 | char * | 指定文字群のいずれかが最初に現れる位置を検索 |
| strspn | const char *s1, const char *s2 | size_t | 指定文字群のみで構成される先頭の長さを取得 |
| strcspn | const char *s1, const char *s2 | size_t | 指定文字群を含まない先頭の長さを取得 |
| strerror | int errnum | char * | エラー番号に対応する文字列を取得する |
| memset | void *s, int c, size_t n | void * | メモリ領域を指定した値で埋める |
| memcpy | void *dest, const void *src, size_t n | void * | メモリ領域をコピーする |
| memmove | void *dest, const void *src, size_t n | void * | 重なる領域でも正しくメモリをコピーする |
| memcmp | const void *s1, const void *s2, size_t n | int | メモリ領域をバイト単位で比較する |
| memchr | const void *s, int c, size_t n | void * | メモリ領域から特定の値を検索する |
| strcoll | const char *s1, const char *s2 | int | ロケールに基づき文字列を比較する |
| strxfrm | char *dest, const char *src, size_t n | size_t | ロケールに基づき文字列を変換する |

## 3. ユーティリティ・動的メモリ (<stdlib.h>)
メモリ管理、数値変換、乱数、プロセス制御を含む汎用的な関数群です。

| 関数名 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| malloc | size_t size | void * | 指定したサイズのメモリを動的に確保する |
| calloc | size_t n, size_t size | void * | 0初期化されたメモリを動的に確保する |
| realloc | void *p, size_t size | void * | 確保済みのメモリサイズを変更する |
| free | void *p | void | 動的に確保したメモリを解放する |
| atoi | const char *s | int | 文字列をint型数値に変換する |
| atof | const char *s | double | 文字列をdouble型数値に変換する |
| atol | const char *s | long | 文字列をlong型数値に変換する |
| strtol | const char *s, char **end, int base | long | 文字列を基数指定でlong型に変換する |
| strtoul | const char *s, char **end, int base | unsigned long | 文字列を基数指定でunsigned long型に変換 |
| strtod | const char *s, char **end | double | 文字列をdouble型に変換（エラー確認可能） |
| rand | void | int | 0〜RAND_MAXの範囲で疑似乱数を生成する |
| srand | unsigned int seed | void | 乱数生成器にシード値を設定する |
| exit | int status | void | プログラムをクリーンアップして終了する |
| abort | void | void | プログラムを異常終了（強制終了）させる |
| atexit | void (*func)(void) | int | プログラム終了時に実行する関数を登録する |
| system | const char *s | int | OSのシェルコマンドを実行する |
| getenv | const char *name | char * | 環境変数の値を取得する |
| qsort | void *base, size_t n, size_t s, compare | void | クイックソートを用いて配列を並べ替える |
| bsearch | const void *key, void *base, ... | void * | 二分探索（バイナリサーチ）を行う |
| abs | int n | int | int型の絶対値を求める |
| labs | long n | long | long型の絶対値を求める |
| div | int num, int denom | div_t | int型の商と余りを同時に算出する |
| ldiv | long num, long denom | ldiv_t | long型の商と余りを同時に算出する |
| mblen | const char *s, size_t n | int | マルチバイト文字の長さを取得する |

## 4. 数学計算 (<math.h>)
浮動小数点数を用いた高度な計算を行う関数群です。

| 関数名 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| sin | double x | double | 正弦（サイン）を計算する |
| cos | double x | double | 余弦（コサイン）を計算する |
| tan | double x | double | 正接（タンジェント）を計算する |
| asin | double x | double | 逆正弦（アークサイン）を計算する |
| acos | double x | double | 逆余弦（アークコサイン）を計算する |
| atan | double x | double | 逆正接（アークタンジェント）を計算する |
| atan2 | double y, double x | double | y/xのアークタンジェントを計算する |
| exp | double x | double | 指数関数（eのx乗）を計算する |
| log | double x | double | 自然対数（ln）を計算する |
| log10 | double x | double | 常用対数（log10）を計算する |
| pow | double x, double y | double | xのy乗（べき乗）を計算する |
| sqrt | double x | double | 平方根（ルート）を計算する |
| ceil | double x | double | 小数点以下を切り上げる（天井関数） |
| floor | double x | double | 小数点以下を切り捨てる（床関数） |
| round | double x | double | 四捨五入を行う（C99以降） |
| trunc | double x | double | 0の方向へ切り捨てる（C99以降） |
| fabs | double x | double | 浮動小数点数の絶対値を求める |
| fmod | double x, double y | double | 浮動小数点数の割り算の余りを求める |
| hypot | double x, double y | double | 直角三角形の斜辺の長さを求める |
| ldexp | double x, int exp | double | x * 2^exp を計算する |
| frexp | double x, int *exp | double | 浮動小数点数を仮数部と指数部に分解する |
| modf | double x, double *iptr | double | 実数を整数部と小数部に分解する |
| cbrt | double x | double | 立方根（3乗根）を計算する（C99以降） |
| remainder | double x, double y | double | IEEE 754準拠の剰余を計算する（C99以降） |

# 知識補足
## 機能・定義
### 配列とポインタ
- 配列宣言時の処理は二つだけ
  - コンパイル時に、型*指定要素byteのメモリを確保する
  - ポインタ型として、予約した先頭のアドレスを固定する
- メモリを型のbyte単位で捉えて、[i]分先を取得する機能はポインタの機能
- ただし配列宣言した変数とポインタ変数が全く同じ動作をするわけではない
  - ポインタ変数(`p`)の代入は可能だが、配列として宣言した変数(`a`)の代入は不可能
    - `p`には`p`用のメモリ領域が割り振られていて、その中身を元にアドレスを取得する
    - `a`は配列宣言時に固定されたアドレスを取得する、動作が固定されているため、`a`用のメモリ領域は割り振られていない
## プログラム背景
### void
- 昔は`int function() {}`は引数チェックを省略するというコードだったため、他の言語と同じ書き方のような`()`での引数無し定義ができなかった。そのため後から追加された

# 規格
## 旧C言語
### C89, C90(1989/1990~)
- ANSI Cと呼ばれている
- 変数の宣言がブロックの一番上のみ
- コメントが`/* */`のみ

## 標準的なC言語
### C99(1999~)
- `//`による1行コメント
- 変数の宣言位置が自由化
- `<stdint.h>`, `<stdbool.h>`の追加

### C11/C17/C18(2011~/2018~)
- C17, C18はC11のバグ修正パッチ
- `_s`系の関数追加
- `<threads.h>`が追加
- 可変調配列(VLA)のサポートが任意に(格下げ)

## 新しいC言語
### C23(未定 2024?)
- `bool`, `true`, `false`が標準ワード(`<stdbool.h>`不要)化
- `nullptr`の追加
- `auto`による型判別
- `constexpr`の追加