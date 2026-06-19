### z軸

# 手前・奥の概念が発生する条件  
「どの要素が手前で、どの要素が奥に隠れるのか？」を決める要素は 4 つある。  

| 発生条件 | 影響を受けるプロパティ | HTMLの記述順が影響するか？ | 親要素の影響を受けるか？ |  
|--------------|----------------------|----------------------|----------------------|  
| z-index での制御 | z-index: 数値; | 影響しない（数値が大きい方が手前） | 影響する（親の z-index も影響する） |  
| position による重なり | position: absolute / relative / fixed | 影響する（後に書いた方が手前） | 影響しない（親の数や階層に関係なく決まる） |  
| display: flex での order | display: flex; order: n; | 影響しない（order に依存） | 影響する（親の display: flex; に依存） |  
| display: grid での grid-auto-flow | grid-auto-flow: dense; | 影響しない（grid のルールに依存） | 影響する（親の display: grid; に依存） |  
