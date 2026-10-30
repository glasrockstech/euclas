# Euclas 開發進度總覽

更新：2026-10-30 19:32 Europe/Berlin。這是依 [plan.md](plan.md)、[progress.md](progress.md)、[驗收情境](../design/acceptance/scenarios.json)與[情境歸屬](scenario-owners.json)整理的進度檔，由協調者在實際關卡完成時更新；沒有背景自動監控。任務依賴以 plan 為準，實際授權與證據以 progress 為準。

## 現況

| 指標 | 已完成／總數 | 比例 | 計算意義 |
|---|---:|---:|---|
| 計畫節點關閉 | 1／28 | 3.6% | 等權計數；只有 F00 文件修正關閉，並非產品完成或工時比例 |
| 實作節點關閉 | 0／27 | 0% | F01a 子切片已接受；F01 仍待 F01b，尚無整個實作節點關閉 |
| 首版實際驗收通過 | 0／101 | 0% | R1 情境；全部 not_run |
| Roadmap 情境通過 | 0／17 | 0% | 另外列示，不混入首版分母 |

不估算整體產品完成百分比、剩餘工時或交付日期。F01a／F01b 是 F01 子切片，不重複加入節點分母。任務新增、拆分或範圍改變時，記錄日期、原因及新分母；失敗、受阻或進行中不算通過。已驗收項目若被後續變更破壞，重新開啟並更新比例。

**目前階段：F01b 的 ca41da8 已雙軸獨立審查 PASS，準備 main 整合重現。** F01a 工具環境已接受並整合 main；[實作證據](f01a-evidence.md)與[獨立審查](f01a-review.md)保留工具／檢查／限制。沿用現有契約測試與 build，不重做 F01a；產品尚不能啟動。

## F01b 資料庫基線

本輪已授權專案內安裝與專用一次性 PostgreSQL／crash 測試，排除既有資料庫、憑證與全域服務。六項等權關卡是 F01b 的驗收清單，不是工時估算，也不與 F01a 的六項重複加總。

**F01b 關卡完成：5／6＝83.3%（精確來源雙軸 PASS，待 main 整合重現與清理）。**

| 關卡 | 完成條件 | 狀態 |
|---|---|---|
| B1 | 精確 main 基底、授權、Orca 隔離工作樹／唯一作者 | 完成：a74706b；codex/f01b-baseline；作者／研究 session 已確認送達 |
| B2 | 精確 PostgreSQL tuple、私有資源邊界及介面／恢復前置審查 | 完成：18.6 原始碼／工具／libpq 與私有資源已查核；db27174 前置獨立審查 PASS；只限 macOS 開發組合 |
| B3 | 最小初始化與五類角色隔離實作 | 完成：ca41da8 已含 reader 映射交易鎖、現行 SQL inspect 與失敗清理 |
| B4 | 真實 DB 允許／拒絕／過期／重複／crash-window 與恢復驗收 | 完成：42／42＝31 項 F01b＋11 項回歸；含真實競態、helper 防線及 8 個 SIGKILL 切點 |
| B5 | 精確來源的獨立安全／恢復／工程規範審查及必要修正 | 完成：ca41da8 Standards／Spec 安全恢復均 PASS，必要發現 0 |
| B6 | main 整合重現、測試程序清理與完整交接 | 進行中：使用 main 的獨立工具／資料目錄重現 |

## F01a 開發環境準備

這六項是本輪環境工作清單，並非額外產品節點；各項等權，完成須有實際證據。使用者已明確授權完整環境準備；一般可逆細節由代理自主處理。

**本輪環境關卡完成：6／6＝100%。** 這是 F01a 工具環境的六項清單，並非所有未來平台／資料庫環境或產品完成率。

| 關卡 | 完成條件 | 狀態 |
|---|---|---|
| E1 | 授權、忽略規則與本機 Git 乾淨基線提交 | 完成：f14be410a5ef50d5ccd1da984b294715a1a7b808；無遠端、無 active hooks |
| E2 | Orca 隔離分支／工作樹與唯一實作者 session | 完成：codex/f01a-contracts；Orca 已確認 prompt accepted／turn observed |
| E3 | 精確工具與依賴隔離安裝、lockfile／腳本查核 | 完成：pnpm12.16.1 artifact SHA-512；最終118版本盤點；main frozen install103個套件、scripts disabled |
| E4 | Canonical offline resolver／validator 正負驗證 | 完成：622 根離線編譯；條件、F00、命令形狀正負例通過；實際 DB／OS／provider 行為仍未測 |
| E5 | 共享型別生成、freshness、build／typecheck／lint／test | 完成：獨立副本測試與 Work built consumer 回歸、11／11 tests、全部正式檢查通過 |
| E6 | 精確來源獨立審查、必要修正與本機整合驗證 | 完成：Standards／Spec PASS；main 全部入口／11測試／公開 ESM smoke 通過；合併 8a9b43a |

## 第一個桌面完整成果

目標：登入 → 持續性助理接任務 → 真實合格執行 → 持久文件 → 驗證／真人確認 → 重開讀回同一版本。

| 節點 | 交付內容 | 狀態／目前前提 |
|---|---|---|
| F00 | 介面與 D01–D07 修正 | 文件層級已關閉；不代表 validator 或 runtime 合格 |
| F01 | 工具鏈、共享契約、乾淨資料庫基線 | F01a 已接受；F01b 正在獨立審查，整個 F01 尚未關閉 |
| F02 | Electron／獨立 Supervisor 與原生啟停 | 未開始；依賴 F01 |
| F03 | 正式 Account 身分證明 | 未開始；依賴 F01 |
| F04 | 本地 owner／裝置／session admission | 未開始；依賴 F02、F03 |
| F05 | 持續性助理與正式工作 | 未開始；依賴 F04，CP2 bootstrap／CP4 source packet 另須先審查 |
| F06a | 原生持久且不可變的檔案 | 未開始；依賴 F02 與相應 CP4 packet |
| F06b | 可編輯 DOCX | 未開始；依賴 F06a |
| F06c | 可讀 rendition | 未開始；依賴 F06b |
| Q1 | 工作引擎資格比較 | 未執行；依賴 F02、F00 |
| Q2 | 強制執行隔離資格 | 未執行；依賴 F02、F00 |
| Q3 | Harness／訂閱路徑資格 | 未執行；依賴 F02、F00 |
| F07 | Run／副作用 journal | 未開始；依賴 F05、Q1 |
| F08 | 真實 harness 工作 | 未開始；依賴 F07、Q2、Q3；資格組合必須一致 |
| F09 | 正式結果／證據／真人驗收 | 未開始；依賴 F06c、F08 |
| F10 | 第一個桌面完整旅程 | 未開始；依賴 F09、F02，另需早期 Mac 發行證據與更新連續性 |

## 完整首版

下表為各套件的主要歸屬情境數；其他套件仍須貢獻整合證據。R12 也會重新檢查整個 release candidate，不能只驗自己的六個情境。

| 套件 | 範圍 | 套件狀態 | 主要情境通過／總數 | 驗收比例 |
|---|---|---|---:|---:|
| R01 | 真人邀請、參與與管理延續 | 未開始 | 0／6 | 0% |
| R02 | macOS／Windows 原生發行 | 未開始 | 0／11 | 0% |
| R03 | 完整工作編排 | 未開始 | 0／21 | 0% |
| R04 | Harness／模型／工具路徑 | 未開始 | 0／11 | 0% |
| R05 | 文件與知識 | 未開始 | 0／6 | 0% |
| R06 | 聊天、討論與閱讀 | 未開始 | 0／11 | 0% |
| R07 | 組織、關係圖與注意事項 | 未開始 | 0／5 | 0% |
| R08 | 原生 iOS／Android | 未開始 | 0／2 | 0% |
| R09 | 私有 Plugin | 未開始 | 0／1 | 0% |
| R10 | 長工作更新與恢復 | 未開始 | 0／15 | 0% |
| R11 | 有用的整合工作旅程 | 未開始 | 0／6 | 0% |
| R12 | 首版發行資格 | 未開始 | 0／6 | 0% |

情境數是計數單位，不表示複雜度相等；例如 R09 的一個情境不代表 Plugin 是小工作。

## 代理、工作樹與 session

- F01b：唯一作者在 `codex/f01b-baseline`，工作樹 `/Users/ckuo/orca/workspaces/euclas/f01b-baseline`；官方版本研究代理已完成並釋放，前置安全／恢復／介面 reviewer 已對 `db27174` 回報 PASS 並釋放；`80195ab` 首輪審查已完成並釋放 reviewers；同一作者已修正兩項發現，aab97ce 的兩個新 reviewers 正在重審。
- Run：`run_031592cbc65a`；精確 Task／Dispatch、授權與證據位置見 [progress.md](progress.md)。共用契約、lockfile 與實作由同一作者負責；進度檔由協調者維護。
- F01a：作者與 reviewers 均已釋放，來源 `309c0bb` 已審查及整合 main；工作樹與證據保留，作為本輪前提。
- Session：繼續目前協調對話；作者與 reviewer 的新 context 已由協調者安排，不需要你另建 session。F01b 完成後會停下回報，不自動開始 F02。
- 每次里程碑回報均包含成果、分子／分母、檢查與限制、下一步及 session 建議。[Session 規則與接手 prompt](prompts.md#session-policy)。

## 更新責任

協調者在切片開始、審查、整合、實際驗收、範圍變更與交接時更新本頁及 progress。每個通過項目須連到精確來源、命令／結果與必要的獨立審查；只有文件或 schema 檢查時，維持產品 runtime 為 not_run。
