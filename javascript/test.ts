type OriginalData = { id: number; name: string };

type ReadonlyPartialData = {
  readonly [K in keyof OriginalData]?: OriginalData[K];
};

type MutableRequiredData = {
  -readonly [K in keyof ReadonlyPartialData]-?: ReadonlyPartialData[K];
};

// ==========================================
// 実行コード・使用例
// ==========================================

// 1. OriginalData の使用例
// すべてのプロパティが必須であり、変更可能です。
const original: OriginalData = {
  id: 1,
  name: "Taro",
};
original.id = 2; // OK: 変更可能
original.name = "Taro Updated"; // OK: 変更可能


// 2. ReadonlyPartialData の使用例
// プロパティは省略可能（?）であり、読み取り専用（readonly）です。
const partialData: ReadonlyPartialData = {
  id: 10,
  // name は省略可能なので定義しなくてもエラーになりません
};

// 以下のコードはコンパイルエラーになります（読み取り専用の検証）
// partialData.id = 20; // ❌ Error: Cannot assign to 'id' because it is a read-only property.


// 3. MutableRequiredData の使用例
// ReadonlyPartialData から readonly と ? が除去されたため、
// 再びすべてのプロパティが必須となり、変更可能になります。
const mutableData: MutableRequiredData = {
  id: 100,
  name: "Jiro", // 省略するとエラーになります（必須プロパティの検証）
};

// readonly が解除されているため、値の再代入が可能です。
mutableData.id = 200; // OK: 変更可能
mutableData.name = "Jiro Updated"; // OK: 変更可能


// 実行結果の出力
console.log("Original Data:", original);
console.log("Readonly Partial Data:", partialData);
console.log("Mutable Required Data:", mutableData);