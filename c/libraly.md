# sysinfo.h
## ユーティリティ
| 識別子 | 種類 | 戻り値や定義されている値 | 説明 |
| :--- | :--- | :--- | :--- |
| `sysinfo()` | 関数 | 成功時は `0`、失敗時は `-1` | 引数に渡された構造体アドレスに、稼働秒数やメモリ残量などのシステム統計データを直接書き込む。 |
| `struct sysinfo` | 構造体 | - | 稼働秒数、ロードアベレージ、物理・スワップメモリの総量と空き容量、プロセス数を格納するメンバ変数群。 |
| `get_nprocs()` | 関数 | 現在利用可能なCPUコア数（`int`） | OSから現在スケジュール可能な（有効化されている）論理CPUコアの個数を返す。 |
| `get_nprocs_conf()` | 関数 | 設定されている総CPUコア数（`int`） | OSが物理的または論理的に認識している、システム全体の全CPUコアの個数を返す。 |
| `get_phys_pages()` | 関数 | 物理メモリの総ページ数（`long`） | システムに搭載されている全物理メモリの容量をページ個数単位で返す。 |
| `get_avphys_pages()` | 関数 | 利用可能な物理メモリのページ数（`long`） | 現在システムで使われていない、即座に利用できる物理メモリの容量をページ個数単位で返す。 |
| `SI_LOAD_SHIFT` | 定数 | 通常は `16` | `struct sysinfo` の `loads`（整数値）を実際のロードアベレージ（実数値）に変換する際のビットシフト量。 |

## struct sysinfo
| メンバ | 値(型) | 説明 |
| :--- | :--- | :--- |
| `uptime` | `long` | システム起動からの経過時間（秒）。 |
| `loads` | `unsigned long[3]` | 1分、5分、15分間のロードアベレージ（スケールされた整数値）。 |
| `totalram` | `unsigned long` | 使用可能な物理メモリの総量。 |
| `freeram` | `unsigned long` | 利用可能な物理メモリの空き容量。 |
| `sharedram` | `unsigned long` | 共有メモリの総量。 |
| `bufferram` | `unsigned long` | バッファに使用されているメモリ容量。 |
| `totalswap` | `unsigned long` | スワップ領域の総量。 |
| `freeswap` | `unsigned long` | 利用可能なスワップ領域の空き容量。 |
| `procs` | `unsigned short` | 現在システム上に存在するプロセス数。 |
| `totalhigh` | `unsigned long` | ハイメモリ領域の総量。 |
| `freehigh` | `unsigned long` | 利用可能なハイメモリ領域の空き容量。 |
| `mem_unit` | `unsigned int` | メモリサイズ（上記ram/swap/high）の単位となるバイト数。 |
| `_f` | `char[]` | 構造体サイズを64バイトに調整するためのパディング。 |


```c
#include <stdio.h>
#include <sys/sysinfo.h>
#include <unistd.h>

int main(void) {
    struct sysinfo info;

    // sysinfo() の呼び出し
    if (sysinfo(&info) != 0) {
        perror("sysinfo error");
        return 1;
    }

    printf("=== struct sysinfo の情報 ===\n");
    printf("Uptime (稼働秒数): %ld\n", info.uptime);

    // SI_LOAD_SHIFT を用いたロードアベレージの実数変換
    double load1  = (double)info.loads[0] / (1 << SI_LOAD_SHIFT);
    double load5  = (double)info.loads[1] / (1 << SI_LOAD_SHIFT);
    double load15 = (double)info.loads[2] / (1 << SI_LOAD_SHIFT);
    printf("Load Average     : 1min=%.2f, 5min=%.2f, 15min=%.2f\n", load1, load5, load15);

    // mem_unit を用いた実際のバイト数計算
    printf("Total RAM (bytes): %lu\n", info.totalram * info.mem_unit);
    printf("Free RAM (bytes) : %lu\n", info.freeram * info.mem_unit);
    printf("Processes        : %hu\n", info.procs);
    printf("mem_unit (bytes) : %u\n", info.mem_unit);

    printf("\n=== プロセッサ情報 ===\n");
    printf("Configured (get_nprocs_conf): %d\n", get_nprocs_conf());
    printf("Available  (get_nprocs)     : %d\n", get_nprocs());

    printf("\n=== 物理メモリページ情報 ===\n");
    printf("Total Pages (get_phys_pages)  : %ld\n", get_phys_pages());
    printf("Free Pages  (get_avphys_pages): %ld\n", get_avphys_pages());

    // ページサイズを用いたバイト変換の参考
    long page_size = sysconf(_SC_PAGESIZE);
    printf("\n(参考) 実質空きメモリ: %ld bytes (Free Pages * %ld bytes/page)\n", 
           get_avphys_pages() * page_size, page_size);

    return 0;
}
```

# resource.h
## 概要
- プロセスが消費するシステムリソースの制限の取得や設定、リソースの使用状況の取得などを行うPOSIX標準ヘッダー
```c
struct rlimit {
    rlim_t rlim_cur;  // ソフトリミット（現在の制限値。プロセスが自身で変更可能）
    rlim_t rlim_max;  // ハードリミット（ソフトリミットの最大値。特権プロセスのみ増加可能）
};
```

```c
struct rusage {
    struct timeval ru_utime; /* 使用されたユーザーCPU時間 */
    struct timeval ru_stime; /* 使用されたシステムCPU時間 */
    long   ru_maxrss;        /* 最大常駐セットサイズ (Maximum Resident Set Size) */
    long   ru_ixrss;         /* 共有メモリの合計サイズ (Integral shared memory size) */
    long   ru_idrss;         /* 非共有データの合計サイズ */
    long   ru_isrss;         /* 非共有スタックの合計サイズ */
    long   ru_minflt;        /* ページリクレーム (マイナーページフォルト) */
    long   ru_majflt;        /* ページフォルト (メジャーページフォルト。I/Oを伴う) */
    long   ru_nswap;         /* スワップ回数 */
    long   ru_inblock;       /* ブロック入力操作の回数 */
    long   ru_oublock;       /* ブロック出力操作の回数 */
    long   ru_msgsnd;        /* 送信されたIPCメッセージ数 */
    long   ru_msgrcv;        /* 受信されたIPCメッセージ数 */
    long   ru_nsignals;      /* 受信されたシグナル数 */
    long   ru_nvcsw;         /* 意図的なコンテキストスイッチ (Voluntary context switches) */
    long   ru_nivcsw;        /* 強制的なコンテキストスイッチ (Involuntary context switches) */
};
```

## リソース制限
```c
int getrlimit(int resource, struct rlimit *rlim);
int setrlimit(int resource, const struct rlimit *rlim);
```
| マクロ名 | 説明 |
| :--- | :--- |
| `RLIMIT_AS` | プロセスの仮想メモリの最大サイズ（バイト） |
| `RLIMIT_CORE` | 生成されるコアダンプファイルの最大サイズ（バイト）。0を指定すると生成されない |
| `RLIMIT_CPU` | 消費できるCPU時間の最大値（秒）。超過すると `SIGXCPU` が送られる |
| `RLIMIT_DATA` | プロセスのデータセグメント（ヒープなど）の最大サイズ（バイト） |
| `RLIMIT_FSIZE` | プロセスが作成できるファイルの最大サイズ（バイト） |
| `RLIMIT_MEMLOCK` | RAM上にロック（`mlock`など）できるメモリの最大サイズ（バイト） |
| `RLIMIT_MSGQUEUE` | POSIXメッセージキューに割り当て可能な最大バイト数（Linux固有） |
| `RLIMIT_NICE` | `setpriority` 等で設定できるnice値の最大上限値（Linux固有） |
| `RLIMIT_NOFILE` | プロセスがオープンできるファイルディスクリプタの最大数 |
| `RLIMIT_NPROC` | ユーザーが作成できるプロセスの最大数 |
| `RLIMIT_RSS` | 常駐セットサイズ（RAM上に保持されるページ数）の最大値（現在多くのOSで無効化） |
| `RLIMIT_STACK` | プロセスのスタックの最大サイズ（バイト） |

## リソース使用状況
```c
int getrusage(int who, struct rusage *usage);
```
| マクロ名 | 対象 |
| :--- | :--- |
| `RUSAGE_SELF` | 呼び出し元プロセス自身のリソース使用量、およびそのスレッドの合計。 |
| `RUSAGE_CHILDREN` | 終了してwaitされたすべての子プロセスのリソース使用量の合計。 |
| `RUSAGE_THREAD` | 呼び出し元スレッドのリソース使用量（Linux固有 `_GNU_SOURCE` 等が必要）。 |

## スケジューリング優先度
```c
int getpriority(int which, id_t who);
int setpriority(int which, id_t who, int prio);
```
| マクロ名 | `who` 引数の意味 | 対象 |
| :--- | :--- | :--- |
| `PRIO_PROCESS` | プロセスID | 指定されたPIDのプロセス |
| `PRIO_PGRP` | プロセスグループID | 指定されたPGIDの全プロセス |
| `PRIO_USER` | 実ユーザーID | 指定されたUIDが所有する全プロセス |

# pthread.h
## 前提知識
- POSIXスレッド: C言語やC++でマルチスレッドプログラムを作成するための、UNIX系OSの標準的なAPI
- 排他制御: 複数スレッドが同じメモリの書き替えを行わないようにする仕組み
## 関数
| 関数名 | 引数 | 引数の説明 | 関数の説明 |
| :--- | :--- | :--- | :--- |
| `pthread_create` | `t`, `a`, `f`, `arg` | `t`:ID格納先, `a`:属性(基本NULL), `f`:実行関数, `arg`:引数 | 新スレッド作成と実行 |
| `pthread_join` | `t`, `ret` | `t`:対象ID, `ret`:戻り値格納先 | 終了待機と資源解放 |
| `pthread_detach` | `t` | `t`:対象ID | 終了時に自動で資源解放 |
| `pthread_exit` | `ret` | `ret`:戻り値 | 自スレッドを明示的に終了 |
| `pthread_self` | なし | なし | 自スレッドIDを取得 |
| `pthread_equal` | `t1`, `t2` | `t1`, `t2`:比較するID | 2つのIDが同一か比較 |
| `pthread_mutex_init` | `m`, `a` | `m`:ミューテックス, `a`:属性(基本NULL) | 排他制御の初期化 |
| `pthread_mutex_destroy` | `m` | `m`:ミューテックス | 排他制御の破棄 |
| `pthread_mutex_lock` | `m` | `m`:ミューテックス | ロック獲得(待機あり) |
| `pthread_mutex_trylock` | `m` | `m`:ミューテックス | ロック試行(待機なし) |
| `pthread_mutex_unlock` | `m` | `m`:ミューテックス | ロック解除 |
| `pthread_cond_init` | `c`, `a` | `c`:条件変数, `a`:属性(基本NULL) | 条件変数の初期化 |
| `pthread_cond_destroy` | `c` | `c`:条件変数 | 条件変数の破棄 |
| `pthread_cond_wait` | `c`, `m` | `c`:条件変数, `m`:ミューテックス | シグナル待機(一時ロック解除) |
| `pthread_cond_signal` | `c` | `c`:条件変数 | 待機スレッド1つを再開 |
| `pthread_cond_broadcast`| `c` | `c`:条件変数 | 待機中全スレッドを再開 |