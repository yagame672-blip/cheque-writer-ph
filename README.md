# Cheque Writer PH – Download Page

A professional download landing page for **Cheque Writer PH**, deployed on Vercel.

The page auto-fetches the latest release from GitHub and updates the download link automatically.

## 🚀 Deployment

This site is deployed at: **[chequewriterph.vercel.app](https://chequewriterph.vercel.app)**

## 📦 How the Download Works

1. The actual installer ZIP is uploaded as a **GitHub Release asset** (handles large files up to 2GB).
2. The `main.js` fetches the latest release from the GitHub API automatically.
3. The download button always points to the latest version.

## ⚙️ Setup After Deployment

Update `GITHUB_USER` in `main.js`:
```js
const GITHUB_USER = 'YOUR_GITHUB_USERNAME'; // ← palitan ito
const GITHUB_REPO = 'cheque-writer-ph';     // ← palitan kung iba ang repo name
```

## 📁 Files

| File | Purpose |
|---|---|
| `index.html` | Main download page |
| `style.css` | Dark-themed CSS styling |
| `main.js` | GitHub Release fetcher + animations |
| `vercel.json` | Vercel deployment config |
