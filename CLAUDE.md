# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Site Is

Bo Li's personal academic homepage, built with Jekyll using the [plainwhite](https://github.com/samarsault/plainwhite-jekyll) theme. Deployed on GitHub Pages at `primerL.github.io`. The site serves as an academic profile showcasing research, awards, and personal info.

## Commands

```bash
# Install dependencies
bundle install

# Local development server (http://localhost:4000)
bundle exec jekyll serve

# Build only
bundle exec jekyll build
```

## Architecture

- **`index.md`** — Main homepage (layout: `page`). All biography, research publications, awards, service, and interests content lives here as inline HTML + Markdown.
- **`_config.yml`** — Site-wide config: theme settings, social links, plugins, author info. The `plainwhite:` key controls all theme customization (name, tagline, dark mode, search, etc.).
- **`_posts/`** — Blog posts in `YYYY-MM-DD-title.markdown` format with frontmatter.
- **`_layouts/`** — Custom layout overrides: `default.html`, `home.html`, `page.html`, `post.html`.
- **`_includes/head.html`** — Custom `<head>` override injected into all pages.
- **`_sass/`** — SCSS stylesheets: `plain.scss` (main), `dark.scss`, `search.scss`, `toggle.scss`, `ext/` (third-party).
- **`assets/`** — Static files: CSS, JS, fonts, images (`self.jpg` is the profile photo).
- **`search.json`** — Generated search index for jekyll-spaceship search.

## Key Plugins

- `jekyll-spaceship` — Powers the search bar
- `jekyll-admonitions` — Admonition blocks in Markdown
- `jekyll-seo-tag` — SEO meta tags
- `kramdown-parser-gfm` — GitHub Flavored Markdown

## Content Updates

- **Profile photo**: replace `assets/self.jpg`
- **CV link**: update the href in `index.md` pointing to `CV_BoLi.pdf`; place the PDF in the root
- **Social links / name / tagline**: edit under `plainwhite:` in `_config.yml`
- **Research entries**: add new `<div>` blocks in `index.md` following the existing flex layout pattern
- **Navigation**: uncomment and edit `navigation:` in `_config.yml`
