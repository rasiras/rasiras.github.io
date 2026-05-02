# rasiafeef.com

Personal site of Rasi Afeef, freelance penetration tester. Static HTML / CSS / JS,
no build step, deploys anywhere.

## Files

- `index.html` markup, sections, content
- `styles.css` design tokens (light / dark) + all styling
- `main.js`   theme toggle, code-review panel cycler, CVE rotator, reveals
- `favicon.svg`, `og.svg` brand assets
- `CNAME`     custom domain for GitHub Pages
- `robots.txt`, `sitemap.xml`
- `.nojekyll` disables Jekyll processing on GitHub Pages
- `serve.mjs` tiny local dev server

## Local dev

```bash
node serve.mjs
# open http://127.0.0.1:5174
```

## Deploy to GitHub Pages (user site, recommended)

This pattern publishes the site at `https://<github-username>.github.io/`
and at your custom domain once DNS is set.

```bash
# from this folder, after editing your username below
git init -b main
git add .
git commit -m "init"
git branch -M main
git remote add origin git@github.com:<github-username>/<github-username>.github.io.git
git push -u origin main
```

Then on GitHub:

1. **Settings → Pages → Source: Deploy from a branch → `main` / (root) → Save**
2. **Settings → Pages → Custom domain** enter `rasiafeef.com`, save, tick "Enforce HTTPS" once it goes green

## DNS records for `rasiafeef.com`

At your domain registrar (where you bought the domain), set these:

```
A      @       185.199.108.153
A      @       185.199.109.153
A      @       185.199.110.153
A      @       185.199.111.153
AAAA   @       2606:50c0:8000::153
AAAA   @       2606:50c0:8001::153
AAAA   @       2606:50c0:8002::153
AAAA   @       2606:50c0:8003::153
CNAME  www     <github-username>.github.io.
```

Replace `<github-username>` with your actual GitHub username. DNS usually
propagates within an hour. After GitHub finishes its TLS check, the site
will be live at https://rasiafeef.com.

## Editing content

- Stats:        `index.html` search `data-count="`
- CVE rotator:  `main.js` array `const CVES = [...]`
- Code panel:   `main.js` array `const SAMPLES = [...]`
- Capabilities: `index.html` search `class="cap"`
- Contact:      replace `bug.digg3r@gmail.com` site-wide
