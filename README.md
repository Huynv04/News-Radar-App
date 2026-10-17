# 📡 Local & Global News Radar

An automated news aggregation, NLP analytics, and real-time trend tracking platform built with **.NET 8 Web API** and **React (Vite + TypeScript)**.

![License](https://img.shields.io/badge/license-MIT-blue)
![.NET](https://img.shields.io/badge/.NET-8.0-purple)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-cyan)

---

## 🌟 Overview

**News Radar** solves the information overload problem by automatically scraping, deduplicating, cleaning, and analyzing news from top news providers in Vietnam and worldwide. It processes unstructured news text into actionable metrics like **Sentiment Scores** and **Time-Decay Trend Scores** in real time.

### Key Highlights

- **100% Automated Crawler Pipeline:** Multi-threaded RSS & HTML Scraper with Dynamic XPath Selectors.
- **Deduplication Engine:** SHA-256 exact-match hashing and Cosine Similarity event clustering.
- **Real-Time Breaking Alerts:** SignalR WebSockets pushing instant toasts to clients without page reload.
- **High Performance:** Response time under 50ms using **Cursor-based Pagination** and **Redis Caching**.
- **Clean Reader Mode:** Sanitized, ad-free reading experience protected against XSS attacks.

---

## 🛠 Tech Stack

| Domain | Technology / Library |
| :--- | :--- |
| **Frontend** | React 18 (Vite), TypeScript, TailwindCSS, TanStack Query, Zustand, Recharts |
| **Backend** | .NET 8 Web API, Entity Framework Core, SignalR Hubs, `HtmlAgilityPack` |
| **NLP & Analytics** | TF-IDF Keyword Extraction, Time-decay Trend Algorithm, Sentiment Classification |
| **Database & Cache** | PostgreSQL / SQL Server, Redis Cache (Sorted Sets & SignalR Backplane) |
| **DevOps & Infra** | Docker, Docker Compose, GitHub Actions (CI/CD), Vercel (Client), Railway (Server) |

---

## 🏗 System Architecture

```text
[ News Sources (RSS/HTML) ] ──► [ Background Crawler ] ──► [ Deduplication (SHA-256) ]
                                                                   │
[ React Client ] ◄── (SignalR) ─── [ .NET 8 API ] ◄─────── [ NLP & Trend Engine ]
       │                                 │
       ▼                                 ▼
[ Vercel CDN ]                    [ PostgreSQL + Redis ]

🚀 Features & Modules
Dashboard & Trend Analytics: Visualizes 24h Hot Tag Clouds, Keyword Frequencies, and Sentiment Ratios.

Core Feed & Filtering: Full-text search and multi-criteria filters (Time, Category, Sentiment, Source).

Clean Reader Mode: Strips out scripts, ads, and tracking code for distraction-free reading.

Personalization: JWT + OAuth2 Google Login, Bookmarks, Reading History, Custom Keyword Subscriptions.

Admin Portal: Dynamic XPath Configuration, Real-time Crawler Error Logs, Manual AI Overrides & Pinning.

💻 Getting Started (Run Locally)
Prerequisites
.NET 8 SDK

Node.js (v18+)

Docker Desktop (for PostgreSQL & Redis)
