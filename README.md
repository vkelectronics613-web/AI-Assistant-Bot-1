# 🤖 Nexus AI — WhatsApp AI Assistant

> AI-powered WhatsApp automation platform for businesses. Connect your WhatsApp, train your AI, and let it handle customer conversations automatically.

![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)
![Made with](https://img.shields.io/badge/made%20with-Gemini%20AI-blue)
![Platform](https://img.shields.io/badge/platform-Web-lightgrey)

---

## ✨ Features

- 📱 **WhatsApp QR Connection** — Link any WhatsApp number instantly via QR code
- 🤖 **AI Auto-replies** — Gemini-powered responses in Hindi & English
- 💬 **Live Chat Dashboard** — Monitor and manage all conversations in real time
- 🧠 **AI Training** — Train the AI on your own business data
- 😡 **Emotion Detection** — Detects angry customers and triggers human takeover
- 👤 **Human Takeover** — Pause AI and take over any conversation manually
- 📦 **Orders System** — Full order flow directly through WhatsApp
- 🔔 **Smart Notifications** — Urgent alerts, refund requests, new customers
- 📊 **Analytics** — Track performance and conversation stats
- 💳 **Billing System** — Free, Pro ($29/month), Business ($99/month) plans
- 🏪 **Business Profile** — Configure business info the AI uses to answer questions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| AI Model | Google Gemini API |
| Database | Firebase Firestore |
| Hosting | Vercel |
| WhatsApp | Baileys / WWebJS |
| Auth | Firebase Auth |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Firebase account (free)
- Google Gemini API key (free)
- Vercel account (free)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nexus-ai.git

# Navigate to project directory
cd nexus-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Run Locally

```bash
npm run dev
```

### Deploy to Vercel

```bash
npm run build
vercel --prod
```

---

## 📱 Screenshots

| WhatsApp Connect | Live Chat | Notifications |
|---|---|---|
| QR Code linking | Real-time chat monitor | Urgent alerts |

| Business Profile | Billing | WhatsApp Demo |
|---|---|---|
| AI business training | 3 tier plans | Full order flow |

---

## 💰 Pricing Plans

| Plan | Price | AI Responses | WhatsApp Numbers |
|------|-------|-------------|-----------------|
| Free | $0/month | 100/month | 1 |
| Pro | $29/month | 5,000/month | 3 |
| Business | $99/month | Unlimited | 10 |

---

## 🗺️ Roadmap

- [ ] Mobile app (Android & iOS)
- [ ] Landing page
- [ ] Multi-language support (more languages)
- [ ] Voice message AI replies
- [ ] Instagram DM integration
- [ ] Telegram integration
- [ ] Payment gateway integration (Razorpay/Stripe)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Virat Kumar**
- Age: 12 | Class 6 | Patna, Bihar 🇮🇳
- Building the future one line of code at a time 🚀

---

> *"Free tools + Your own brain = 💰"* — Virat Kumar, 2026
