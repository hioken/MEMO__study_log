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

# 説明
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