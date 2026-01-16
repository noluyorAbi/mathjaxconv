<p align="center">
    <img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/ec559a9f6bfd399b82bb44393651661b08aaf7ba/icons/folder-markdown-open.svg" align="center" width="20%">
</p>
<h1 align="center">DevTools & Productivity Suite</h1>
<p align="center">
    <em>A comprehensive collection of developer utilities and productivity tools grouped in a single modern application.</em>
</p>
<p align="center">
    <a href="https://tools.adatepe.dev"><strong>Explore the Tools »</strong></a>
    <br />
    <br />
    <img src="https://img.shields.io/github/license/noluyorAbi/mathjaxconv?style=flat-square&color=blue" alt="license">
    <img src="https://img.shields.io/github/last-commit/noluyorAbi/mathjaxconv?style=flat-square&color=blue" alt="last-commit">
    <img src="https://img.shields.io/github/languages/top/noluyorAbi/mathjaxconv?style=flat-square&color=blue" alt="repo-top-language">
</p>

## Overview

This project started as a simple MathJax converter but has evolved into a versatile suite of tools designed to streamline developer workflows and boost productivity. Built with **Next.js 15**, **React 19**, **Tailwind CSS**, and **Shadcn UI**, it offers a premium, responsive, and dark-mode-ready experience.

## Features & Tools

### 🛠️ Developer Utilities

| Tool | Description |
| :--- | :--- |
| **MathJax Converter** | Convert inline LaTeX equations from `\( ... \)` to `$$ ... $$` format for better compatibility. |
| **Markdown to Jira** | Instantly transform standard Markdown documentation into Jira Wiki Markup. |
| **Callout Maker** | Create beautiful Markdown callouts with custom titles and types. |
| **Pixel Color Remover** | Remove specific background colors from images directly in the browser. |

### 🚀 Productivity & Lifestyle

| Tool | Description |
| :--- | :--- |
| **Pomodoro Timer** | Focus on your work with a customizable Pomodoro timer featuring ambient sounds. |
| **Eisenhower Matrix** | Prioritize tasks effectively by categorizing them into Urgent/Important quadrants. |
| **Stopwatch** | A simple, elegant stopwatch to track your sessions. |
| **Stop Addiction** | Track your streaks and progress to overcome bad habits. |
| **GradeView** | Visualize and analyze university grades with detailed statistics. |
| **Motivation Quotes** | Get inspired with curated quotes on beautiful, dynamic backgrounds. |
| **Monochrome Mode** | Toggle a distraction-free black-and-white screen mode. |

### System Architecture

```mermaid
graph TD
    A[App Shell] --> B(Layout & Navigation)
    A --> C{Tools Suite}
    
    subgraph DevTools ["Developer Tools"]
        C --> D1[MathJax Converter]
        C --> D2[Markdown to Jira]
        C --> D3[Callout Maker]
        C --> D4[Pixel Remover]
    end
    
    subgraph Productivity ["Productivity & Lifestyle"]
        C --> E1[Pomodoro Timer]
        C --> E2[Eisenhower Matrix]
        C --> E3[Stopwatch]
        C --> E4[Stop Addiction]
        C --> E5[GradeView]
        C --> E6[Motivation]
    end
    
    B --> F[Theme Switcher]
    B --> G[Global Particles]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#bbf,stroke:#333,stroke-width:2px
```

## Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Hooks & Cookies

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm, yarn, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/noluyorAbi/mathjaxconv.git
   cd mathjaxconv
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
