# Euclas

Euclas 是讓一般人透過持續性的數位人建立與運作組織的產品，適用公司、家庭、個人工作與俱樂部。開發者可深入使用程式、Git 與 Terminal；一般使用者不必理解這些工具。

本專案從乾淨設計基線起步，保留現行設計、宣告式介面規格、驗收要求、品牌資產與開發指引。F01a 契約工具環境與 F01b 私有 PostgreSQL 初始化基線已通過獨立審查、整合至本機 main 並重現驗證；產品應用與產品 runtime 驗收尚未開始。

## 開始閱讀

1. [中文產品總覽](design/overview.zh-TW.md)：產品要解決什麼、完整首版與第一個成果。
2. [開發指引](AGENTS.md)及[領域詞彙](CONTEXT.md)：開發代理的入口。
3. [設計入口](design/README.md)：規格、架構、介面與驗收的權威來源。
4. [開發方法](development/methodology.md)、[交付計畫](development/plan.md)與[目前狀態](development/progress.md)。
5. 在這個目錄開新 session，使用[啟動 prompt](development/prompts.md)。新 session 不需要舊對話或另一個專案目錄。

查看[開發進度總覽](development/overview.zh-TW.md)的完整任務與實際驗收比例；[F01a 環境紀錄](development/launch.md)保留啟動範圍與關卡。比例是有證據的節點／情境計數，不是產品完成或工時估算。

## 現在能做什麼

目前可在本目錄執行 `contracts:generate`、`contracts:check`、`typecheck`、`lint`、`test` 與 `build`：使用已驗證的 `.tools/pnpm/pnpm` 及[套件指南](packages/contracts/README.md)列出的隔離設定前綴。主工作區已實際通過全部入口、42 個測試（31 項 F01b＋11 項契約回歸）與 built package smoke。`baseline:test` 提供同一組聚焦 DB 測試，使用已合格的專案內 PostgreSQL 18.6；[基線指南](packages/baseline/README.md)、[F01b 證據](development/f01b-evidence.md)與[獨立審查／main 重現](development/f01b-review.md)記錄角色隔離、真實 crash 測試與限制。產品尚不能啟動，沒有產品 `dev` 或 `setup` 命令。

技術方向：TypeScript、Node.js LTS、pnpm workspace、`just`；Electron 桌面及獨立 Supervisor；React Native／Expo 原生手機；PostgreSQL 為業務狀態權威。精確版本與原生組合須實測後鎖定，未選用 Expo 託管建置／推播服務。

## 目錄與資料

- `design/`：現行規格、需求索引、宣告式契約、驗收及品牌 SVG／tokens。
- `development/`：方法、任務依賴、測試策略、狀態與接手指引。
- `packages/contracts/` 與根工具鏈：離線 canonical 驗證、生成型別、嚴格檢查及測試。
- `packages/baseline/`：最小私有 PostgreSQL 初始化、journal、五類受限角色與恢復測試。
- `.tools/`、`node_modules/` 與 build 輸出為本機忽略資料；包括合格工具與私有一次性測試資源。測試程序已停止，保留失敗 fixture 只含合成測試資料／秘密，沒有產品執行資料或真實帳號憑證。

原始依據是創辦人已確認的產品規劃與介面設計，經整併形成獨立基準；不包含原有實作、Git 歷史、過期方案或舊交付證據。文件中的規則與情境描述預期行為，不表示已實現。

## 所有權與授權

產品／公司：Euclas／Glasrocks；創辦人負責產品方向及重大範圍、安全、費用與發布決定。完整開源優先、寬鬆授權方向已確認；確切 LICENSE、依賴／素材權利與產品發布仍待確認。原始碼已依創辦人授權同步至 [GitHub](https://github.com/glasrockstech/euclas)，目前為公開 repository，創辦人會另行切換私有；尚未發布產品或承諾維運服務。

已完成授權範圍內的 F01a／F01b，本輪在交接點停止。後續產品切片、真實帳號／Email／模型呼叫與外部操作依 [progress](development/progress.md) 的另行適用授權執行；未自動開始 F02。

`/Volumes/data` 是主要工作磁碟。Git 歷史已同步 GitHub；工具、測試資料庫及未追蹤資料不在 Git 副本內，尚未建立產品執行狀態的備份／還原能力。
