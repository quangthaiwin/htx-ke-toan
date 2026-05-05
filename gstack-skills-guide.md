# GStack Skills - Huong dan su dung

## GStack la gi?

**gstack v1.26.0.0** la "AI software factory" cua **Garry Tan** (CEO Y Combinator). No bien Claude Code thanh mot team ky thuat ao thong qua 45 slash-command skills. MIT license, mien phi.

### Triet ly cot loi

| Nguyen tac                 | Y nghia                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| **Boil the Lake**          | AI lam completeness gan mien phi → luon lam day du, khong cat goc |
| **Search Before Building** | Kiem tra ton tai truoc khi xay moi                                |
| **User Sovereignty**       | AI de xuat, nguoi dung quyet dinh                                 |

---

## 45 Skills theo nhom

### Planning & Strategy

| Skill                 | Muc dich                                        | Trigger                                  |
| --------------------- | ----------------------------------------------- | ---------------------------------------- |
| `/office-hours`       | Brainstorm kieu YC (startup hoac builder mode)  | "I have an idea", "brainstorm this"      |
| `/plan-ceo-review`    | Review plan o goc CEO, mo rong/thu hep scope    | "think bigger", "rethink this"           |
| `/plan-eng-review`    | Review kien truc, data flow, edge cases         | "engineering review", "lock in the plan" |
| `/plan-design-review` | Review plan o goc designer, cham diem 0-10      | "design critique"                        |
| `/plan-devex-review`  | Review DX cho APIs, CLIs, SDKs                  | "DX review", "API design review"         |
| `/autoplan`           | Chay tat ca reviews tu dong (CEO+Design+Eng+DX) | "autoplan", "run all reviews"            |

### Design

| Skill                  | Muc dich                                       | Trigger                                  |
| ---------------------- | ---------------------------------------------- | ---------------------------------------- |
| `/design-consultation` | Tao design system, DESIGN.md                   | "design system", "brand guidelines"      |
| `/design-shotgun`      | Tao nhieu variants, so sanh                    | "show me options", "design variants"     |
| `/design-html`         | Xuat HTML/CSS production-ready                 | "turn this into HTML", "build me a page" |
| `/design-review`       | Visual QA, fix spacing/hierarchy               | "audit the design", "visual QA"          |
| `/devex-review`        | Live DX audit, test onboarding, screenshot loi | "test the DX", "DX audit"                |

### Development & Debugging

| Skill          | Muc dich                                                   | Trigger                                 |
| -------------- | ---------------------------------------------------------- | --------------------------------------- |
| `/investigate` | Debug co he thong, 4 pha, khong fix khi chua ro root cause | "fix this bug", "why is this broken"    |
| `/health`      | Dashboard chat luong code (lint, test, score 0-10)         | "health check", "code quality"          |
| `/learn`       | Quan ly learnings qua cac sessions                         | "what have we learned"                  |
| `/plan-tune`   | Tuy chinh cau hoi gstack hoi ban                           | "tune questions", "stop asking me that" |

### QA & Testing

| Skill        | Muc dich                                                                   | Trigger                                   |
| ------------ | -------------------------------------------------------------------------- | ----------------------------------------- |
| `/qa`        | Test site + fix bugs + commit tung cai (3 tier: Quick/Standard/Exhaustive) | "qa", "test and fix"                      |
| `/qa-only`   | Chi bao cao bug, khong fix                                                 | "just report bugs", "qa report only"      |
| `/benchmark` | Do performance, Core Web Vitals, bundle size                               | "performance", "page speed", "web vitals" |

### Browser & Scraping

| Skill                  | Muc dich                                                    | Trigger                                   |
| ---------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `/browse`              | Headless browser nhanh (~100ms/cmd), screenshot, test forms | "test the site", "take a screenshot"      |
| `/open-gstack-browser` | Mo Chromium nhin thay duoc voi sidebar                      | "open chrome", "launch browser"           |
| `/scrape`              | Lay data tu web page → JSON                                 | "scrape", "get data from", "extract from" |
| `/skillify`            | Luu scrape thanh skill vinh vien (~200ms lan sau)           | "codify", "save this scrape"              |
| `/pair-agent`          | Chia se browser cho AI agent khac                           | "pair agent", "share browser"             |

### Code Review & Security

| Skill     | Muc dich                                                        | Trigger                          |
| --------- | --------------------------------------------------------------- | -------------------------------- |
| `/review` | PR review truoc khi merge (SQL safety, LLM trust, side effects) | "review this PR", "code review"  |
| `/cso`    | Security audit day du (OWASP, STRIDE, secrets, supply chain)    | "security audit", "threat model" |
| `/codex`  | Second opinion tu OpenAI Codex (review/challenge/consult)       | "codex review", "ask codex"      |
| `/claude` | Second opinion tu Claude CLI (review/challenge/consult)         | "claude review", "ask claude"    |

### Shipping & Deploy

| Skill               | Muc dich                                                     | Trigger                                 |
| ------------------- | ------------------------------------------------------------ | --------------------------------------- |
| `/ship`             | Full workflow: test → review → VERSION bump → CHANGELOG → PR | "ship", "create a PR", "deploy"         |
| `/land-and-deploy`  | Merge PR + wait CI + verify production health                | "merge", "land", "land it"              |
| `/canary`           | Monitor sau deploy (console errors, perf, screenshots)       | "canary", "post-deploy check"           |
| `/landing-report`   | Xem queue PRs dang open                                      | "landing report", "what's in the queue" |
| `/document-release` | Update docs (README, CHANGELOG, ARCHITECTURE) sau ship       | "update the docs", "post-ship docs"     |
| `/setup-deploy`     | Cau hinh deploy platform (Fly/Render/Vercel/Netlify)         | "setup deploy"                          |

### Safety & Session

| Skill              | Muc dich                                                       | Trigger                           |
| ------------------ | -------------------------------------------------------------- | --------------------------------- |
| `/careful`         | Canh bao truoc lenh nguy hiem (rm -rf, DROP TABLE, force-push) | "be careful", "safety mode"       |
| `/freeze`          | Khoa edit chi trong 1 thu muc                                  | "only edit this folder", "freeze" |
| `/unfreeze`        | Bo khoa freeze                                                 | "unfreeze", "unlock edits"        |
| `/guard`           | careful + freeze ket hop (max safety)                          | "guard mode", "full safety"       |
| `/context-save`    | Luu trang thai lam viec (git, decisions, remaining work)       | "save progress", "save state"     |
| `/context-restore` | Khoi phuc context da luu                                       | "resume", "where was I"           |

### Utilities

| Skill                    | Muc dich                                                  | Trigger                                 |
| ------------------------ | --------------------------------------------------------- | --------------------------------------- |
| `/make-pdf`              | Markdown → PDF chat luong cao (TOC, page numbers, covers) | "make a PDF", "export to PDF"           |
| `/retro`                 | Retro hang tuan, tracking trends, team-aware              | "weekly retro", "what did we ship"      |
| `/benchmark-models`      | So sanh Claude/GPT/Gemini (latency, cost, quality)        | "compare models", "which model is best" |
| `/gstack-upgrade`        | Update gstack len phien ban moi nhat                      | "upgrade gstack"                        |
| `/setup-gbrain`          | Cai dat gbrain (memory across sessions)                   | "setup gbrain"                          |
| `/setup-browser-cookies` | Import cookies tu Chrome that vao headless                | "import cookies"                        |

---

## Cach su dung

### Cach 1: Goi truc tiep

Noi hoac go trigger phrase trong chat:

```
"review this PR"        → gstack tu dong chay /review
"fix this bug"          → gstack tu dong chay /investigate
"ship"                  → gstack tu dong chay /ship
```

### Cach 2: Goi bang ten skill

```
/qa
/investigate
/ship
```

### Cach 3: Gstack tu dong goi (proactive mode)

Khi ban noi "does this work?" → gstack tu dong suggest /qa
Khi ban bao loi → gstack tu dong suggest /investigate

---

## Flow dien hinh

```
1. Brainstorm idea        → /office-hours
2. Review plan            → /autoplan (CEO + Design + Eng + DX 1 lenh)
3. Design UI              → /design-consultation → /design-shotgun → /design-html
4. Code xong              → /health (kiem tra quality)
5. Test site              → /qa (test + fix)  hoac  /qa-only (chi report)
6. Review code            → /review
7. Ship                   → /ship (PR + CHANGELOG + VERSION)
8. Deploy                 → /land-and-deploy
9. Monitor                → /canary
10. Cuoi tuan             → /retro
11. Luu progress          → /context-save
12. Hom sau quay lai      → /context-restore
```

---

## Cau hinh (da setup tren may)

- **Install location:** `C:\Users\thaip\.claude\skills\gstack\`
- **GBrain:** configured (postgres mode, MCP registered)
- **Proactive suggestions:** on
- **Telemetry:** configurable via `gstack-config`
- **Session tracking:** `~/.gstack/sessions/`

---

## Tips

- `/autoplan` tiet kiem thoi gian nhat — chay 4 reviews mot luc thay vi goi tung cai
- `/investigate` LUON dung khi gap bug — khong bao gio fix ma chua hieu root cause
- `/context-save` truoc khi dong terminal — `/context-restore` khi mo lai
- `/guard` khi lam viec voi production database
- `/benchmark-models` de biet model nao tot nhat cho tung loai task
