/**
 * og:image 生成器
 * 用 sharp 把 SVG 渲染成 1200×630 的 PNG 卡片图，供社交分享使用。
 * 每篇文章一张，其余页面共用默认图。
 */
'use strict';

const path = require('path');
const fs = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  hexo.log.warn('[og-image] sharp 未安装，跳过 og:image 生成');
  return;
}

// 站点配色（与 theme.css 的暖纸风一致）
const COLORS = {
  paper: '#f5f1e9',
  ink: '#1a1612',
  ink3: '#6b6257',
  accent: '#f05a32',
  gold: '#c9a84c',
  line: '#ddd5c5'
};

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(s, max) {
  s = String(s || '');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function buildSVG(opts) {
  const title = esc(truncate(opts.title, 40));
  const subtitle = esc(truncate(opts.subtitle, 30));
  const site = esc(opts.site);
  const tag = esc(opts.tag || '');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${COLORS.paper}"/>
  <rect x="0" y="0" width="1200" height="6" fill="${COLORS.accent}"/>
  <rect x="60" y="60" width="4" height="80" fill="${COLORS.gold}" rx="2"/>
  <text x="80" y="95" font-family="Georgia,serif" font-size="20" fill="${COLORS.ink3}">${site}</text>
  ${tag ? `<rect x="80" y="165" width="${tag.length * 18 + 32}" height="36" rx="18" fill="${COLORS.accent}"/>
  <text x="96" y="190" font-family="sans-serif" font-size="16" fill="#fff">${tag}</text>` : ''}
  <text x="80" y="${tag ? 280 : 230}" font-family="Georgia,serif" font-size="48" font-weight="bold" fill="${COLORS.ink}">${title}</text>
  <text x="80" y="${tag ? 330 : 280}" font-family="Georgia,serif" font-size="24" fill="${COLORS.ink3}">${subtitle}</text>
  <line x1="80" y1="520" x2="1120" y2="520" stroke="${COLORS.line}" stroke-width="1"/>
  <text x="80" y="560" font-family="sans-serif" font-size="16" fill="${COLORS.ink3}">alexander-ap.github.io</text>
  <circle cx="1100" cy="555" r="8" fill="${COLORS.accent}"/>
</svg>`;
}

// 注册 generator：构建时产出 PNG
hexo.extend.generator.register('og-image', function (locals) {
  const outDir = path.join(hexo.base_dir, 'public', 'images', 'og');
  const tasks = [];

  // 确保输出目录存在
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 默认 og 图
  const defaultSvg = buildSVG({
    title: hexo.config.title,
    subtitle: hexo.config.description || '',
    site: hexo.config.title
  });
  tasks.push(
    sharp(Buffer.from(defaultSvg))
      .resize(1200, 630)
      .png()
      .toFile(path.join(outDir, 'default.png'))
  );

  // 每篇文章一张
  locals.posts.sort('-date').forEach(function (post) {
    const cat = (post.categories && post.categories.length)
      ? post.categories.toArray()[0].name : '';
    const slug = post.slug || post.path.replace(/\/$/, '').split('/').pop();
    const svg = buildSVG({
      title: post.title,
      subtitle: post.date.format('YYYY.MM.DD') + (cat ? ' · ' + cat : ''),
      site: hexo.config.title,
      tag: cat
    });
    tasks.push(
      sharp(Buffer.from(svg))
        .resize(1200, 630)
        .png()
        .toFile(path.join(outDir, slug + '.png'))
    );
  });

  // 用 Promise.all 等全部完成，但 generator 本身不返回 Promise
  // 用 setImmediate 让文件写入不阻塞 generator 返回
  Promise.all(tasks).then(function () {
    hexo.log.info('[og-image] 生成 ' + tasks.length + ' 张 og 图到 public/images/og/');
  }).catch(function (e) {
    hexo.log.error('[og-image] 生成失败: ' + e.message);
  });

  return []; // 不产生额外的 generator 文件（直接写到 public/）
});
