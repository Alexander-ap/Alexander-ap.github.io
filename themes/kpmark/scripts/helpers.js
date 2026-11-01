/* global hexo */
'use strict';

/**
 * 把 HTML 压成纯文本：剥离代码块、标签、常见实体，压掉多余空白。
 * 字数口径以本函数的输出为准，全站唯一。
 */
function plain(html) {
  return String(html || '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 字数：去标签去空白后的字符数（代码块不计） */
function countWords(post) {
  return plain(post && post.content).replace(/\s+/g, '').length;
}

hexo.extend.helper.register('word_count', function (post) {
  return countWords(post);
});

/** 阅读时长：按 400 字/分钟向上取整，最少 1 分钟 */
hexo.extend.helper.register('read_time', function (post) {
  return Math.max(1, Math.ceil(countWords(post) / 400));
});

/**
 * 摘要：优先 front-matter 的 excerpt，否则截到第一个 h2~h6，再退化为全文前段。
 */
hexo.extend.helper.register('excerpt_text', function (post, max) {
  var limit = max || 130;
  if (!post) return '';
  var raw = (post.excerpt && post.excerpt.trim()) ? post.excerpt : (post.content || '');
  if (!post.excerpt || !post.excerpt.trim()) {
    var cut = raw.search(/<h[2-6][\s>]/i);
    if (cut > 0) raw = raw.slice(0, cut);
  }
  var text = plain(raw);
  return text.length > limit ? text.slice(0, limit) + '…' : text;
});

// ---- 相关文章：按「共享标签数 ×2 + 同分类 ×1」排序 ----

var tagIndexKey = -1;
var tagIndexMap = null;

function tagIndex(posts) {
  if (tagIndexMap && tagIndexKey === posts.length) return tagIndexMap;
  tagIndexMap = new Map();
  tagIndexKey = posts.length;
  posts.forEach(function (p) {
    tagIndexMap.set(p._id, p.tags ? p.tags.toArray().map(function (t) { return t.name; }) : []);
  });
  return tagIndexMap;
}

hexo.extend.helper.register('related_posts', function (post, limit) {
  var top = limit || 3;
  if (!post || !post.tags || !post.tags.length) return [];

  var posts = hexo.locals.get('posts').toArray();
  var index = tagIndex(posts);
  var mine = new Set(index.get(post._id) || []);
  if (!mine.size) return [];

  var myCat = (post.categories && post.categories.length)
    ? post.categories.toArray()[0].name
    : '';

  var scored = [];
  posts.forEach(function (p) {
    if (p._id === post._id) return;
    var shared = (index.get(p._id) || []).filter(function (n) { return mine.has(n); }).length;
    var sameCat = (myCat && p.categories && p.categories.length
      && p.categories.toArray()[0].name === myCat) ? 1 : 0;
    var score = shared * 2 + sameCat;
    if (score > 0) scored.push({ post: p, score: score });
  });

  scored.sort(function (a, b) {
    return b.score - a.score || b.post.date - a.post.date;
  });

  return scored.slice(0, top).map(function (x) { return x.post; });
});
