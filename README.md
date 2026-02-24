# Chromatic Vision | 色彩视觉挑战

A high-precision color sensitivity game designed for artists to test and improve their chromatic perception.
面向艺术生的高精度色彩敏感度挑战游戏。

## Features | 功能特点

- **Bilingual Support**: English and Chinese. | **双语支持**：中英文切换。
- **Three Difficulty Levels**: Easy, Medium, and Hell. | **三种难度**：简单、中等、地狱。
- **Responsive Design**: Play on mobile or desktop. | **响应式设计**：手机和电脑均可畅玩。
- **Real-time Analysis**: Shows the color difference (ΔL) for each level. | **实时分析**：显示每一关的色彩亮度差。
- **Performance Tracking**: Keeps track of your best score. | **成绩追踪**：记录最高分。

## Deployment to Vercel | 部署到 Vercel

1. **Push to GitHub**:
   - Create a new repository on GitHub.
   - Initialize git in your local project:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin <your-github-repo-url>
     git push -u origin main
     ```

2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com).
   - Click "New Project".
   - Import your GitHub repository.
   - Vercel will automatically detect Vite. Click "Deploy".

## Local Development | 本地开发

```bash
npm install
npm run dev
```

## Build | 构建

```bash
npm run build
```
