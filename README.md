# ⚡ UI → Code Generator Pro v2.0

A production-grade AI-powered SaaS tool that converts UI screenshots and text descriptions into clean, production-ready **frontend AND backend code** — powered by **OpenAI GPT-4o Vision** and stored in **MongoDB**.

---

## 🆕 What's New in v2.0

| Feature | v1 | v2 |
|---|---|---|
| AI Model | Claude Sonnet | **GPT-4o Vision** ✅ |
| Database | Local only | **MongoDB** (persistent) ✅ |
| Pipeline | 5 steps | **8 steps** ✅ |
| Refinement checks | Basic | **7-check pipeline** ✅ |
| Backend generation | ❌ | **Full backend API** ✅ |
| Quality score | ❌ | **Live scoring** ✅ |
| Frameworks | 3 | **5 (+ Vue, Svelte)** ✅ |
| Accessibility | WCAG AA | **WCAG AA + AAA** ✅ |

---

## 🚀 Quick Start

### 1. Extract and install
```bash
cd ui-code-generator-pro
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# REQUIRED - OpenAI API key (GPT-4o)
OPENAI_API_KEY=sk-proj-your-key-here

# REQUIRED - MongoDB connection
MONGODB_URI=mongodb://localhost:27017/ui-code-gen
# OR MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ui-code-gen
```

### 3. Start MongoDB (if local)
```bash
# macOS
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongo mongo:7
```

### 4. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Getting API Keys

### OpenAI API Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy and paste into `.env.local`

> **Note:** GPT-4o requires a paid OpenAI account with credits loaded.

### MongoDB Atlas (Cloud, Free Tier)
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create free cluster
3. Get connection string from "Connect" → "Drivers"
4. Replace `<password>` with your password

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI | OpenAI GPT-4o Vision |
| Database | MongoDB + Mongoose |
| Styling | Tailwind CSS |
| Language | TypeScript |
| State | Zustand (persist) |
| Animations | Framer Motion |
| Upload | React Dropzone |
| Icons | Lucide React |

---

## 📁 Project Structure

```
ui-code-generator-pro/
├── app/
│   ├── api/
│   │   ├── generate/route.ts      # GPT-4o streaming generation
│   │   ├── refine/route.ts        # 7-check refinement pipeline
│   │   ├── backend-gen/route.ts   # Backend project generator
│   │   └── history/
│   │       ├── route.ts           # GET/DELETE history
│   │       └── [id]/route.ts      # GET single generation
│   ├── globals.css                # Premium dark theme
│   ├── layout.tsx                 # Root layout + Google Fonts
│   └── page.tsx                   # Main page
│
├── components/
│   ├── backend/
│   │   └── BackendPanel.tsx       # Full backend generator UI
│   ├── editor/
│   │   ├── InputPanel.tsx         # Left: prompt, config, refine
│   │   ├── OutputPanel.tsx        # Right: all output views
│   │   ├── PipelineView.tsx       # 8-step animated pipeline
│   │   ├── CodeView.tsx           # Syntax-highlighted code
│   │   └── HistoryView.tsx        # Local + MongoDB history
│   ├── layout/
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   └── Topbar.tsx             # Header with quality badge
│   ├── preview/
│   │   └── PreviewFrame.tsx       # Sandboxed iframe
│   └── ui/
│       └── Toast.tsx              # Animated notifications
│
├── hooks/
│   ├── useGenerate.ts             # Gen/refine/backend hooks
│   └── useToast.ts                # Toast notifications
│
├── lib/
│   ├── mongodb.ts                 # MongoDB singleton
│   ├── openai.ts                  # OpenAI client config
│   ├── prompts.ts                 # All AI prompts
│   └── utils.ts                   # Shared utilities
│
├── models/
│   └── Generation.ts              # Mongoose schema
│
├── store/
│   └── useAppStore.ts             # Zustand global state
│
└── types/
    └── index.ts                   # TypeScript definitions
```

---

## 🛡️ Security

- API keys stay **server-side only** — never exposed to client
- HTML previewed in sandboxed `<iframe>` with restricted permissions
- Images compressed client-side before upload (max 8MB)
- Input validation on all API routes
- MongoDB connection pooling with timeout handling

---

## 🌐 Deploy to Vercel

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "init"
git remote add origin <your-repo>
git push origin main

# 2. Import on vercel.com
# 3. Add environment variables in Vercel dashboard:
#    OPENAI_API_KEY = sk-proj-...
#    MONGODB_URI    = mongodb+srv://...
# 4. Deploy!
```

---

## 📝 License

MIT — free to use and modify.
