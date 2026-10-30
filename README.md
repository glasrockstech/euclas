# Euclas

Euclas 是讓一般人透過持續性的數位人建立與運作組織的產品，適用公司、家庭、個人工作與俱樂部。開發者可深入使用程式、Git 與 Terminal；一般使用者不必理解這些工具。

本目錄是全新開發起點：只有現行設計、宣告式介面規格、驗收要求、品牌設計資產與開發指引。沒有產品程式、已安裝環境、Git 倉庫或已通過的產品測試。

## 開始閱讀

1. [中文產品總覽](design/overview.zh-TW.md)：產品要解決什麼、完整首版與第一個成果。
2. [開發指引](AGENTS.md)及[領域詞彙](CONTEXT.md)：開發代理的入口。
3. [設計入口](design/README.md)：規格、架構、介面與驗收的權威來源。
4. [開發方法](development/methodology.md)、[交付計畫](development/plan.md)與[目前狀態](development/progress.md)。
5. 在這個目錄開新 session，使用[啟動 prompt](development/prompts.md)。新 session 不需要舊對話或另一個專案目錄。

查看[開發進度總覽](development/overview.zh-TW.md)的完整任務與實際驗收比例；開始 F01a 前閱讀[啟動範圍與關卡](development/launch.md)。比例是有證據的節點／情境計數，不是產品完成或工時估算。

## 現在能做什麼

目前可閱讀與審查文件；產品尚不能啟動。尚無 `setup`、`dev`、`test` 或 `build` 命令，也沒有套件／版本鎖定檔。首段實作才會建立最小可重現工具鏈、契約生成與測試入口，不把未存在的命令當成可用功能。

技術方向：TypeScript、Node.js LTS、pnpm workspace、`just`；Electron 桌面及獨立 Supervisor；React Native／Expo 原生手機；PostgreSQL 為業務狀態權威。精確版本與原生組合須實測後鎖定，未選用 Expo 託管建置／推播服務。

## 目錄與資料

- `design/`：現行規格、需求索引、宣告式契約、驗收及品牌 SVG／tokens。
- `development/`：方法、任務依賴、測試策略、狀態與接手指引。
- 未建立任何應用、套件、執行資料、憑證、模型、資料庫或輸出目錄；依第一個實作需要逐項建立。

原始依據是創辦人已確認的產品規劃與介面設計，經整併形成獨立基準；不包含原有實作、Git 歷史、過期方案或舊交付證據。文件中的規則與情境描述預期行為，不表示已實現。

## 所有權與授權

產品／公司：Euclas／Glasrocks；創辦人負責產品方向及重大範圍、安全、費用與發布決定。完整開源優先、寬鬆授權方向已確認；確切 LICENSE、依賴／素材權利與實際公開發布尚未決定。這個目錄沒有建立遠端、發布或承諾維運服務。

目前已授權準備開發環境與 F01a 基礎工具／契約實作，包含限定本機 Git、安裝、測試與獨立審查。其餘產品、真實帳號／Email／模型呼叫及外部操作依 [progress](development/progress.md) 的實際授權執行。

`/Volumes/data` 是主要工作磁碟，不是獨立備份。本專案尚無已驗證的獨立備份；沒有可還原產品執行狀態。後續不可將原始規劃資料的留存當成新專案的備份保證。
