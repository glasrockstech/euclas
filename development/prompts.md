# Starting the next session

Open `/Volumes/data/glasrocks/products/euclas` as the project. Use the following prompt; all required context is local to this root.

## Session policy

Communicate in Traditional Chinese. At each milestone/handoff explicitly report `Session: continue | new session recommended | new session required`, with a reason and a handoff link. The founder should not have to infer when context should be reset.

Continue the same implementer session for fixes within one slice. Recommend a new implementer session when starting a new slice or moving from broad preparation into implementation. Require a handoff before a different writer/worktree takes ownership or when the current session cannot reliably preserve the exact source, authority and acceptance context. A new session never grants new authority. Independent review uses a fresh context arranged by the coordinator; the founder need not manually create every reviewer session.

Before handoff, record task ID, accepted base/current source snapshot, writable paths, actual authority, exact commands/results, review findings, unfinished work, disposable resources/process ownership and next action in progress. Confirm the receiving worker's worktree/base and prompt-delivery receipt when launching through Orca. Do not launch a duplicate worker after an uncertain receipt; inspect the original launch first.

For current overall progress read [overview.zh-TW.md](overview.zh-TW.md). Report accepted node/scenario counts with their denominator and limits; use [progress.md](progress.md) for actual authority/evidence.

## F01a launch handoff

Use after the concrete scope in [launch.md](launch.md) has been reviewed. This prompt itself grants no installation, Git or implementation authority.

```text
工作目錄：/Volumes/data/glasrocks/products/euclas
接手 Euclas F01a。先讀 README.md、AGENTS.md、design/README.md、CONTEXT.md、development/progress.md、development/plan.md，再讀 development/launch.md、design/contracts/README.md、design/contract-profile.md 與 design/security.md。

僅執行 progress 明確記錄已批准的 launch 範圍。確認實際工作樹、精確 base、可寫路徑及工具版本；已有授權不重問，尚無授權則完成必要唯讀準備並提出一個具體問題。先做 canonical resolver／validator／generator 資格，不把候選套件當合格工具。遇不支援的 schema 語意時保留 canonical 契約與原驗收，記錄 blocker。

一位 writer 負責根工具鏈與 packages/contracts；協調者維護 progress／overview，reviewer 唯讀。依 launch 的切片順序完成必要測試，取得精確最終來源獨立審查後，僅在已授權 Git 範圍內整合。完成 F01a 就交接，不自動進入 F01b、DB、Electron 或 provider。

繁中回報實際成果、命令與未通過／未執行項目，附分子／分母進度和 Session 建議；額外支出0，不讀憑證、不發布。
```

## Fresh development launch

```text
工作目錄：/Volumes/data/glasrocks/products/euclas
請從這個乾淨的新專案接手 Euclas 開發。

先讀 README.md、AGENTS.md、CONTEXT.md、design/README.md、development/progress.md，再讀 design/overview.zh-TW.md、design/decisions.md、development/methodology.md 與 development/plan.md。
按選定任務讀 requirements.json 指到的 GR 段落、相關驗收情境、security 與契約；不要一次載入全部需求，也不要重新訪談已定案的產品／框架方向。

這裡只有現行設計與開發指引，沒有舊碼或 Git 歷史。不得從其他目錄匯入舊程式、測試、工具或進度證據，也不能依賴舊聊天。所有產品功能及 runtime 驗收從未實作／未執行開始。

保留第一個完整切片：桌面登入→持續性助理接任務→實際合格執行→產生持久文件→正式驗證／真人確認→重開讀回同一版本。完整首版的 Windows、真人、原生手機、Plugin、聊天、雙 harness／本地雲端資格及長工作更新都保留。

先核對本機現況與 progress 授權，直接處理 plan.md 的 F01a，不重做整份規劃。若尚未有實作／安裝權限，交付一份具體而小的 F01a 範圍：要建立的檔案、相容精確工具版本、必要下載／資源、測試、停止條件與一個授權問題。若我另已明確授權該範圍，完成它、跑檢查並做獨立審查，不再重問相同權限。

一個共享區域一個 writer。遵守安全、恢復、allowed/denied/stale/duplicate/crash 驗收；不降低測試、不捏造完成、不自動接續 DB／Electron／供應商實驗。額外支出0，不讀憑證、不對外呼叫或做 Git發布／整合，除非另有對應明確授權。更新 progress，並用繁中說明實際成果與仍未驗證的部分。
```

## Authorized implementation continuation

```text
依本專案 development/progress.md 的已授權範圍繼續選定切片。先讀本機來源及真實狀態，不依舊聊天。完成最小可驗證行為、必要測試與精確來源的獨立審查，更新規格與 progress。既有權限內可逆細節自行決定；超出範圍／安裝／費用／外部動作只提出具體必要問題。不要因本 prompt 存在便擴大權限或自動開始下一階段。
```

## Independent review

```text
唯讀審查指定切片／差異及其真實需求、契約、相關程式與檢查證據。找安全、恢復、權限、版本／副作用、需求遺漏與不實完成宣稱。報告可重現問題及精確位置；不修改、不降低驗收、不擴大實作或自行整合。靜態檢查不是產品 runtime 驗收。
```
