# Euclas 設計審查與開發啟動建議

日期：2026-10-30（Europe/Berlin）。

更新：本文件保留原審查時的問題與行號，屬歷史發現，不是第二份現行規格。D01–D07 已依本次明確授權修正文檔／契約／情境與計畫；實際檢查與獨立審查結果見 progress.md 的 F00 correction handoff。F01a 的實際 resolver／validator／generator 資格驗證，以及所有產品 runtime 驗收仍未執行。

本文件是審查結果與建議，不取代現行規格、不另立交付計畫，也不授予實作或安裝權限。正式依據仍是各設計文件、[plan.md](plan.md) 與 [progress.md](progress.md)。以下用繁體中文說明審查；後續正式規範修訂及程式文件依專案規則維持英文。

## 整體判斷

產品核心合理：持續存在的 Actor、責任、記憶與工作，不依附某個模型或 harness。帳號與本地權限分離、執行成功與成果驗收分離、未知外部效果不假裝失敗，都是值得保留的設計。採模組化核心並以 PostgreSQL 交易維護跨模組不變條件也合理，目前沒有理由先拆成大量網路服務。

但現在適合做「有限的規格修正＋最小工具鏈切片」，不適合讓多個代理同時鋪開整個產品。兩個重要介面問題應在消費端實作前解決；另外幾個矛盾及第一切片的前置需求需要補齊。這次沒有證明任何產品功能可用，也沒有發現已實作產品的 runtime 漏洞。

審查涵蓋產品、決策、體驗、領域、架構、安全、API、最低契約 profile、完整需求目錄、宣告式契約、驗收與責任歸屬、開發方法及計畫。另由兩位獨立唯讀審查者檢查公開介面及安全／恢復。品牌準則僅檢查範圍與無障礙要求，沒有重新驗證 SVG 幾何、真實畫面或使用者體驗。

## 必須處理的發現

### D01 — P1：Schema 識別方式與相對引用不一致

依據：[common.schema.json](../design/contracts/common.schema.json) 第 3、70 行，同樣模式遍及契約。9 個 schema 使用 URN 識別碼，其中 8 個含有共 755 個非 fragment 的相對引用。

例子：資源的 `$id` 是 `urn:euclas:d92:common:1`，但它引用自己的方式卻是 `common.schema.json#/$defs/uuid`。標準 JSON Schema resolver 依 schema 的 base URI 解析，不是自行假設實體檔案所在目錄。這個組合無法識別原本預期的 URN 資源；自行寫的檔案路徑檢查可以通過，正常 validator／generator 卻未必能載入同一個圖。

建議在 F01a 生成之前選定一致方式：階層式絕對 URI 加明確離線 registry，或全部使用一致的絕對 URN 引用。只維護一份 canonical schema graph，不隱含上網抓 schema，也不要另寫一套手工 Zod 定義來繞過問題。

驗收：用實際選用的標準 resolver 載入每個公開 root、跨檔與自身引用，檢查正反例、生成結果 freshness／equivalence。檔案 pointer 存在不能取代這項驗證。本次沒有安裝 validator，因此不宣稱已實跑某個套件失敗。標準依據：[JSON Schema 官方結構說明](https://json-schema.org/understanding-json-schema/structuring)。

### D02 — P1：提交與建立證據的順序未閉合

依據：[requirements.md](../design/requirements.md) 第 1080 行、[lifecycle.json](../design/contracts/lifecycle.json) 第 109 行、[contract-profile.md](../design/contract-profile.md) 第 48–54 行，以及 [work.openapi.json](../design/contracts/work.openapi.json) 的 submit／verify。

目前 submit 要求每個必要 criterion 已有 Evidence；流程卻先 submit 才 verify，而 human_judgment Evidence 由實際真人的 `work.verify` 決定產生。公開協議沒有定義 Work 還在 executing 時，只建立真人 Evidence 而不完成驗證的操作。

反例：第一份成果有一項「真人確認內容品質」條件。Run 已完成，但 submit 缺真人 Evidence；要取得 Evidence 的 verify 又處於提交後階段。此外，Result 在 publications and evidence 之後 freeze 的句子，也要與「Evidence 必須綁定不可變 Result」釐清先後。

這是規格時序缺口，不是已觀察到的 runtime deadlock。不能靠模型冒充真人證據或提前 acceptance 解決。

建議擇一：
- 明定 Result freeze → evidence recording → submit → verification finalization → acceptance。
- 或區分 submission evidence 與 acceptance evidence，submit 只要求前者。

選定後同步修改 lifecycle、endpoint 語意及驗收情境。驗收要完整走過含 deterministic／human_judgment 條件的成果，包括缺證據、失敗判斷、修訂及重複決定；每一步都有合法 command、Actor、狀態與不可變目標。

### D03 — P2：合法的停止中狀態無法透過 IPC 表達

依據：[deployment-lifecycle.json](../design/contracts/deployment-lifecycle.json) 第 38 行、[runtime.schema.json](../design/contracts/runtime.schema.json) 第 110、963 行。

生命週期有 `stopping`，但 `runtime_status.state` 沒有，成功 IPC 回應又要求包含 runtime status。停止已封鎖新工作、子程序尚未退出時，回報 stopping 不符合 schema；回報 ready 或 stopped 都不真實。

建議讓狀態列舉與 lifecycle 共用權威來源，加入 stopping，並檢查每個可達狀態都有合法投影。stop requested 必須與 confirmed stopped 分開。

另有較小歧義：[api.md](../design/api.md) 第 27 行要求 stop 符合 current stop generation，但封閉的 stop request 沒有該欄位；[contract-profile.md](../design/contract-profile.md) 第 82 行又刻意採不需 aggregate CAS 的單調停止。若 generation 是伺服器內部持久化／遞增並用來使 updater permit 失效，應明寫；不要為修文字而要求緊急停止前先取得最新狀態。

### D04 — P2：重試上限與退避表有不同語意

依據：[requirements.md](../design/requirements.md) 第 450 行提出最多五次 retries、1/2/4/8/16 秒；[contract-profile.md](../design/contract-profile.md) 第 60 行規定三次 attempts、1/5/30 秒；[execution.schema.json](../design/contracts/execution.schema.json) 第 989 行固定 attempt_limit 為 3。

三次總 attempts 通常只有兩次 retries，第三段 delay 的用途不明。舊數字雖標示 proposed，不是創辦人已確認的要求，但留在現行 normative catalog 仍會造成不同實作。

建議只保留一份 retry policy，寫清楚首次是否計入、attempt 對應 delay、可重試錯誤、deadline 優先順序及 SDK 重試計數。驗收重啟後不重置次數、不改 logical effect identity、不放大費用。

### D05 — P2：排程契約仍允許產品禁止的逐次補跑

依據：[shared-command.openapi.json](../design/contracts/shared-command.openapi.json) 第 241 行允許 `every_cycle`；[requirements.md](../design/requirements.md) 第 1094 行也保留每一週期補跑例外。可是同檔第 366 行與 [domain.md](../design/domain.md) 第 29 行要求 Desktop 漏跑後合併成一次 review。

因此 schema-valid 的設定可能要求逐次重播，與產品承諾相反；長時間離開後可能突然放大工作及額度消耗。

建議初版 Desktop 只允許 coalesce；若 every_cycle 留給未來部署，必須有明確 profile discrimination，現行 Desktop admission 拒絕它。同步需求與情境，測試漏掉一週每日排程後，只在現有權限及預算下產生一次補跑。

### D06 — P2：舊基線與授權文字仍殘留

依據：[requirements.md](../design/requirements.md) 第 68 行要求盤點既有 SQL definitions，第 90 行稱既有 container manifests／probes 是工程資產，第 905 行稱 current explicit authorization 包含 branch/edit/test/commit/push/PR。

這裡實際上沒有既有程式或 Git。未來 Euclas 的 coding policy 在其他段落已有範圍限制，但第 905 行容易被當成當前開發代理已獲授權。AGENTS／progress 能阻止這種解讀，規範本身仍應避免誤導。

建議把 SQL／容器文字改為未來實作後的維護規則，明確將 coding defaults 限定為「產品使用者授予特定 repository/work scope 後」的行為。清除影響意思的 this turn、重複 current policy 等對話殘留。這不表示應匯入舊資產或已取得 Git 權限。

### D07 — P2：第一切片缺少部分明列的前置介面工作

依據：[plan.md](plan.md) 的 F05／F06a／F10、[api.md](../design/api.md) 第 11 行、[contracts/README.md](../design/contracts/README.md) 第 26 行，以及 [acceptance.md](../design/acceptance.md) 的第一個桌面流程。

F05 已需要最小 Unit／Actor／Position／Assignment／Grant bootstrap，但精確組織操作介面被歸入其餘完整首版工作。第一份來源也需要真正的有限文字／Markdown admission/publication 協議，只有 Artifact projection 不夠。F10 的 clean-installer 驗收需要 Mac 的部分分發證據，完整 distribution 卻排在後續 R02。

計畫圖雖然沒有循環，仍可能少了這些語意上的前置條件。

建議在最早的消費任務明列最小 bootstrap/grant packet、來源 admission packet，以及 F10 所需的 Mac clean-install/signing 證據；Windows 與完整分發仍留在 R02。這是切片細化，不需要現在一次寫完 CP6–CP8，也不縮小完整首版。

## 重要風險與已接受的取捨

以下不是另外十個已證實缺陷，而是需要提前驗證或補足的產品／交付風險。

1. **核心執行可行性應更早驗證。** Q2/Q3 必須同時滿足原生隔離、真正有用的官方 harness 執行、正確憑證所有權、全部輔助呼叫路由及無超額費用。分別成功不等於組合成功。先做文件／分發／授權條款 preflight，再於獲准且有最小主機基礎後做一次可丟棄實驗；完整 Q1–Q3 仍要在產品上驗證，不把實驗冒稱 F08/G4 完成。

2. **OpenShell 不能照品牌名稱直接採用。** NVIDIA 現行文件已有 macOS MicroVM 路徑，因此不能再籠統說它 Docker-only。但標準 macOS 安裝仍描述為 Homebrew service，原生 Windows MXC 則標為 development／非 production-qualified，發布管道尚不供應原生 Windows binaries。這些都不是 Euclas app-managed、app-bounded 安裝的證據。應驗證精確 tuple，失敗時依既定規則評估同等安全的替代方案，不直接執行通用 service 安裝腳本。[NVIDIA 安裝文件](https://docs.nvidia.com/openshell/latest/about/installation/)（2026-10-30 查閱，頁面標示 latest v0.1.6）。

3. **官方 Account 仍是本地產品的可用性依賴。** 24 小時與重開機需連線是已明定的取捨，不是永久離線承諾互相矛盾。但發布前應定義長期 Account 故障／停運後，擁有者如何唯讀或匯出自己的資料。本地救援目前只說與全球帳號救援分離，尚無完整權限協議；不可臨時加一個會復活已撤銷權限的 bypass。

4. **Account／Email／relay／push 需要營運責任與成本方案。** 目前零額外支出是開發界線，不代表正式營運免費。Email 送達、濫用處理、可用性與金鑰輪替需要明確負責者。開發 fake 只能隔離測試故障，不能關閉真實服務驗收。

5. **多人組織不能默認共用個人模型訂閱。** R01 membership 與 R04 provider entitlement 必須在 dispatch 交會：記錄帳號／費用擁有者、可發起者及該方案允許的共用方式。邀請同事不等於授予模型 seat。規格已有意識，仍需逐路徑證據。

6. **手機與聊天的可用性跟著主機走。** 電腦休眠或 App 關閉後，遠端工作及主機承載的聊天會不可用。應及早觀察使用者是否理解。CP6 要具體定義直連／relay、enrollment、revoke、離線草稿及待送訊息，不能默認離線已提交或 Cloud 接手。

7. **跨裝置 Plugin 是獨立的大型面向。** 先確定小而穩定的 host bridge、資料及版本規則，再做可修改資料／啟動工作的表單。Desktop 和原生手機都要測隔離、navigation/network、資料變動後 rollback；能顯示 HTML 不夠。可從一個狹窄的互動 Plugin 驗證，完整首版要求仍保留。

8. **隱私撤銷必須涵蓋衍生內容。** 撤銷來源後，摘要、索引、模型 context、Plugin view 都要失效或遮蔽。刪除與不可變驗收證據需明確 retention/tombstone 規則。規格已有要求，實作仍需來源依賴追蹤與對抗案例，不能只檢查單筆資料權限。

9. **長工作不中斷更新要早做真實程序實驗。** 同 controller 的 UI overlap 與不相容 writer 延後更新在邏輯上合理，但工程成本不低。先證明一個真實工作中的最小更新，再擴張整合。不中斷承諾不適用於手動退出、撤權或安全停止。

10. **完整 R1 很大。** 保留已確認範圍，但分清工程里程碑、另經授權的私人試用與完整發布。及早觀察提案工作及修正成本，不等圖表、Plugin、所有平台都完成才測核心價值。正式 release qualification 前應採納具體門檻；目前 proposed 數字不是已確認成果。

## 最有效率且可靠的啟動順序

以下是對現行任務的細化建議，不是另一份執行計畫，也不授權實作。

1. **收斂適用的 F00 問題。** 在 canonical owners 修正 D01/D02、統一 D03–D06，獨立審查後把 D07 前置輸出補進現行 plan。保留本文件作為審查證據，不讓它成為第二套規則。

2. **獲准後建立可追溯基線。** 初始化本地 Git，建立經審查的文件 baseline；remote／公開範圍另按明確授權處理。本地 Git 就足夠開始 worktree。安排真正獨立備份，同一個 /Volumes/data 磁碟不算。授權記在 progress。

3. **只實作 F01a。** 一個 workspace、strict TypeScript、專案鎖定版本、單一 canonical contract graph、可重現的 type/validator 生成、針對性正反例與 equivalence/freshness checks，以及真正可用的小型命令入口。不要先建完所有未來 packages。可用維護中的 2020-12 validator 或已證明等價的生成器；Zod 可以使用，但不能另成一套手工權威。Shape validation 不等於權限、冪等或狀態轉移實作。

4. **提前做 qualification preflight。** 評估原生分發、隔離、官方 harness／plan，再提出最小且資源明確的實驗。先淘汰無法滿足必要安裝條件的候選。Q1 已允許 preflight 淘汰，不必為比較而先寫兩套完整產品。

5. **F01b/F02 取得真正持久性與生命週期證據。** restricted roles／RLS、獨立 data root、交易 command、crash windows 先於大規模編排。一個真的 Supervisor／子程序／更新證明，比精美 mock 首頁更能降低風險。

6. **依前置需求完成第一流程。** 最小身份與組織 admission → 一個助理／WorkItem → 一條合格路徑 → 不可變文件／Result → 可信證據／真人驗收 → 重開與失敗恢復。R packages 各依已審查介面與實證擴張。

每個 milestone 一次整理真正必要的安裝、資源、帳號及費用條件；已取得權限可延續，日常可逆細節不重複詢問。新增權限要對應具體版本、下載／script、資源、檢查、清理與停止界線。

## 本機環境與依賴

2026-10-30 唯讀盤點；「存在」不等於「相容或已資格驗證」。

| 項目 | 實際觀察 | 建議 |
|---|---|---|
| 主機 | macOS 27.0.1、arm64 | 宣告開發 tuple；另外驗證乾淨使用者安裝 |
| RTK | 1.1.0 | 主機命令繼續經 RTK，CI 跑 underlying commands |
| Git | 2.54.0，Apple Git-157 | 工具存在，專案尚無 .git |
| Node | mise 下的 26.13.0 | 可作 F01a 候選，通過相容性檢查才鎖定 |
| pnpm／just | 找到 shim，但 mise which 都回傳 1 | 尚未證明可用；只安裝選定的精確版本 |
| PostgreSQL | PATH 無 postgres／psql／initdb | F01a 不需要；F01b 才用明確的可丟棄 distribution |
| Xcode | App metadata 27.2；xcodebuild／xcrun 路徑存在 | 尚未測 SDK、license、selected toolchain 或 build |
| Android | 標準位置無 Android Studio、PATH 無 adb | 延後至 mobile slice，不宣稱其他位置一定沒有 |
| Codex／Claude | 找到執行檔路徑 | 未檢查版本、登入或 entitlement |
| Orca | /Applications/Orca.app，metadata 1.4.244；PATH 無 CLI | 已有安裝可規劃試驗，本次未重裝、更新或啟動 |

Node 官方目前列 v26、v24 為 LTS；pnpm 目前安裝文件列 v12 並支援 Node 26。這不代表某個 TypeScript／generator／Electron／Expo 組合已合格。優先測既有 LTS 候選，不改全域預設、不安裝 latest。[Node releases](https://nodejs.org/en/about/previous-releases)、[pnpm installation](https://pnpm.io/installation)。

分階段加入依賴：

- **F01a：** Node、pnpm、TypeScript、schema validator/generator、必要 test/lint；just 伴隨真正 recipe 才加入。鎖精確版本並檢查 install scripts。此階段不需要 DB、Electron、VM、模型或手機 SDK。
- **F01b/F02：** 精確 native PostgreSQL/tools、Electron、獨立 Supervisor 與 OS key/clock/lock/process adapters。Electron 內建 Node 與開發 shell Node 是不同 runtime，兩者都要驗證。執行資料放 checkout 與同步資料夾之外。
- **F06：** 經 CJK／table／editability 實驗的文件工具與字體授權。
- **Q lanes/F08：** 僅選定且獲准的 harness／containment／model tuple，不自動裝 Docker 或 Temporal。
- **R08：** 相容的 Expo／React Native／React、Xcode/iOS SDK、Android SDK/JDK/build tools 及實機。Expo 不代表已選用 hosted EAS；build／push 服務另明確選擇。[Expo 環境說明](https://docs.expo.dev/get-started/set-up-your-environment/?buildEnv=local&mode=development-build)。

## 聊天、分工與 worktree

起步使用一個協調聊天、一個切片實作者，以及對精確來源的獨立 reviewer。F01a 建議開新實作聊天，載入修正後的本地基線與實際授權；本次長審查不必永久兼任實作 context。同一切片的修正留在原實作者聊天；新切片或 context 明顯混雜時才開新聊天，不必每個命令都重新開始。

交接至少包含 task ID、base/source、負責路徑、契約權威、驗收、實際權限、命令／結果、未解問題及下一步。Repo 是持久記憶，聊天只是輔助。由協調者整合 progress／plan，避免多位 writer 搶寫同一狀態文件。

最初一個實作 checkout 加一位唯讀 reviewer 就足夠。只有介面與檔案所有權已確定，才開第二個寫入 worktree。每位 writer 一個 codex/<slice> branch；reviewer 使用凍結來源唯讀，或 detached review checkout。記錄精確 base/head，整合後跑受影響檢查；push／PR／merge 仍按授權。

**Worktree 隔離原始碼，不隔離程序、憑證或資料庫。** 每個 runtime task 要有自己的 data root、ports、DB／roles、build outputs、temporary files。可在支援下共用套件內容 store，但依 lockfile 重建各 worktree 的 dependency links。不要跨 writer symlink 可變 node_modules、DB、credentials 或 .env。保留變更及證據後才移除 worktree；schema／lockfile／migration 衝突由一個 integration owner 處理。

## Orca 是否值得試

**值得做有限的開發環境試驗；不需要把它變成 Euclas 的執行或權限依賴。** 現行設計本來就把 Orca 視為參考／候選，而非已採用 runtime。

[Orca README](https://github.com/stablyai/orca) 說明多 CLI agents、worktree 管理、diff review、手機／遠端功能與 MIT 授權。這些可以改善協作，但不證明生成程式品質、安全隔離或 Euclas 的訂閱資格。

本機 metadata 是 1.4.244。[該版本說明](https://github.com/stablyai/orca/releases/tag/v1.4.244) 包含繁體中文介面，並仍將 native Chat UI 標為 experimental。本次取得的最新發布是 2026-10-30 的 [1.4.245](https://github.com/stablyai/orca/releases/tag/v1.4.245)，提及 terminal host 變更、經同意後可取得完整電腦權限的 plugins，以及預設跨帳號 Codex history sharing。比較期間固定版本；最新網頁說明不一定精確符合本機版本。本次沒有啟動或資格驗證任一版本。

建議試驗：

1. 固定 Orca／agent tuple，單一 provider account、本機 terminal 起步。先查 launcher arguments、permissions、自動 hooks 與輔助 AI actions，保留正常 command/sandbox 控制。
2. 先在修正後文件的可丟棄副本做唯讀審查，觀察 AGENTS／RTK、範圍遵守與可核對引用；再於適用授權下做 F01a。只有一位 writer，加新 context reviewer，不讓多位 writer 競寫同一套契約。
3. 驗證 worktree/branch/base、來源隔離、stop、restart/handoff、diff review、未提交變更恢復。比較等價小任務，或在各自乾淨副本做同一固定任務，不默認合併競賽輸出。
4. 衡量驗收品質、獨立審查缺陷、人工修正、總時間、命令成功、額度及恢復成本。代理數、程式行數、動畫都不是生產力。
5. 所有成果與檢查證據保留在普通 source／Git 工作流，可隨時回到 Codex 或 terminal，不把唯一成果留在 Orca chat database。

試用設定注意：

- Orca 可共享 ignored directories 或複製 ignored files；先核對設定，避免共用 secrets、可變依賴及 runtime state。[Worktree 文件](https://www.onorca.dev/docs/model/worktrees)。
- 官方說明可在 Settings → Privacy 或指定環境變數關閉 telemetry。本次沒有檢查或更改你實際的設定。[Privacy & Telemetry](https://www.onorca.dev/docs/telemetry)。
- 現行 Orca Codex 文件描述 per-terminal servers，其他 Codex client 未必看得到；Hand Off 是新 session，不是 native resume。因此把切換視為從 repo 狀態交接，不假設本次 Codex desktop 聊天會出現在 Orca。[Codex in Orca](https://www.onorca.dev/docs/agents/codex)。
- 手機配對、遠端 host、自動 Git 動作、第三方 plugins 等到確有需要並獲准才測。不用帳號切換規避 quota，也不以 Orca usage display 推論無額外費用。開發環境試驗不能驗收 Euclas 自己的 mobile/update/containment/provider。

## 實際檢查與限制

- Python 標準函式庫唯讀檢查：19 個 JSON 可解析；120 個 GR ID 唯一，與目錄標題一致，全部有 scenario 引用。
- 118 scenarios＝101 R1＋17 roadmap，全部 not_run；每個 R1 case 恰有一個 primary package owner。
- 1,102 個依檔案位置解析的 JSON references/pointers 存在。這不是標準 base-URI resolution、完整 JSON Schema validation 或 equivalence。
- 28 個計畫表節點無未知依賴或循環；D07 的語意前置缺漏不在此檢查能力內。
- 獨立 runtime-state 比較確認 stopping 缺漏；契約審查另確認 D01/D02/D04/D05/D06 及第一切片介面缺口。
- Shell reads 經 RTK；盤點使用路徑查詢、App plist、rtk/git/node --version，以及唯讀 mise which。沒有讀憑證內容或帳號狀態。
- 外部查核使用 GitHub connector 與官方文件；文件可讀與 release notes 不等於實際 App 行為測試。
- 沒有建立產品／測試工具程式、安裝套件、啟動 DB/VM/Electron/Orca、呼叫模型或 provider、初始化／提交／操作遠端 Git、發布或支出。本輪只修改本審查文件與 progress。

下一步建議：先完成有限 F00 文件修正，再按明確實作／安裝範圍進入 F01a。在相關發現關閉前，不把最低介面 packet 宣稱為完全 ready。
