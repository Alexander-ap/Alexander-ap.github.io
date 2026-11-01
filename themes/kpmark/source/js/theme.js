/* kpmark theme scripts — 原生实现，无第三方依赖 */
(function () {
  'use strict';

  var doc = document;
  var slice = Array.prototype.slice;

  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return slice.call((root || doc).querySelectorAll(sel)); }

  /* 站内搜索 数据源：hexo-generator-searchdb 生成的 search.xml（format: striptags） */

  var Search = (function () {
    var index = null;
    var loading = null;
    var layer, input, list, trigger;
    var activeIndex = 0;
    var lastFocus = null;

    function parse(text) {
      if (!text) return [];
      var xml = new DOMParser().parseFromString(text, 'application/xml');
      if (xml.querySelector('parsererror')) return [];
      return $$('entry', xml).map(function (e) {
        var pick = function (tag) {
          var n = e.querySelector(tag);
          return n ? n.textContent.trim() : '';
        };
        var collect = function (path) {
          return $$(path, e).map(function (n) { return n.textContent.trim(); }).filter(Boolean);
        };
        var title = pick('title');
        var body = pick('content');
        var tags = collect('tags > tag');
        var cats = collect('categories > category');
        return {
          title: title,
          url: pick('url'),
          body: body,
          t: title.toLowerCase(),
          b: body.toLowerCase(),
          g: tags.join(' ').toLowerCase(),
          c: cats.join(' ').toLowerCase()
        };
      });
    }

    function ensureIndex() {
      if (index) return Promise.resolve(index);
      if (loading) return loading;
      var src = (trigger && trigger.getAttribute('data-src')) || '/search.xml';
      loading = fetch(src)
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (t) { index = parse(t); return index; })
        .catch(function () { index = []; return index; });
      return loading;
    }

    function query(q) {
      var tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!tokens.length) return [];
      var out = [];
      index.forEach(function (item) {
        var score = 0;
        for (var i = 0; i < tokens.length; i++) {
          var t = tokens[i];
          if (item.b.indexOf(t) === -1 && item.t.indexOf(t) === -1
              && item.g.indexOf(t) === -1 && item.c.indexOf(t) === -1) return;
          if (item.t.indexOf(t) !== -1) score += 6;
          if (item.g.indexOf(t) !== -1) score += 3;
          if (item.c.indexOf(t) !== -1) score += 2;
          var hits = 0, from = 0, at;
          while ((at = item.b.indexOf(t, from)) !== -1 && hits < 5) {
            hits++;
            from = at + t.length;
          }
          score += hits;
        }
        if (score > 0) out.push({ item: item, score: score });
      });
      out.sort(function (a, b) { return b.score - a.score; });
      return out.slice(0, 8);
    }

    function snippet(item, tokens) {
      var at = -1;
      for (var i = 0; i < tokens.length && at === -1; i++) at = item.b.indexOf(tokens[i]);
      if (at === -1) at = 0;
      var start = Math.max(0, at - 30);
      var text = item.body.slice(start, start + 90);
      if (start > 0) text = '…' + text;
      if (start + 90 < item.body.length) text += '…';
      return text;
    }

    // 用 DOM 拼高亮，绝不拼 innerHTML（避免 XSS）
    function paint(el, text, tokens) {
      var lower = text.toLowerCase();
      var marks = [];
      tokens.forEach(function (t) {
        var from = 0, at;
        while ((at = lower.indexOf(t, from)) !== -1) {
          marks.push([at, at + t.length]);
          from = at + t.length;
        }
      });
      if (!marks.length) { el.textContent = text; return; }
      marks.sort(function (a, b) { return a[0] - b[0]; });
      var merged = [marks[0]];
      for (var i = 1; i < marks.length; i++) {
        var last = merged[merged.length - 1];
        if (marks[i][0] <= last[1]) last[1] = Math.max(last[1], marks[i][1]);
        else merged.push(marks[i]);
      }
      var cursor = 0;
      merged.forEach(function (m) {
        if (m[0] > cursor) el.appendChild(doc.createTextNode(text.slice(cursor, m[0])));
        var mark = doc.createElement('mark');
        mark.textContent = text.slice(m[0], m[1]);
        el.appendChild(mark);
        cursor = m[1];
      });
      if (cursor < text.length) el.appendChild(doc.createTextNode(text.slice(cursor)));
    }

    function setActive(n) {
      var items = $$('.search-item', list);
      if (!items.length) return;
      items[activeIndex].classList.remove('active');
      activeIndex = (n + items.length) % items.length;
      items[activeIndex].classList.add('active');
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    function render(results, tokens) {
      list.textContent = '';
      activeIndex = 0;
      if (!results.length) {
        var empty = doc.createElement('p');
        empty.className = 'search-empty';
        empty.textContent = '没有找到相关内容';
        list.appendChild(empty);
        return;
      }
      results.forEach(function (r, i) {
        var a = doc.createElement('a');
        a.className = 'search-item' + (i === 0 ? ' active' : '');
        a.href = r.item.url;
        a.setAttribute('role', 'option');
        a.setAttribute('aria-selected', i === 0 ? 'true' : 'false');

        var h = doc.createElement('span');
        h.className = 'search-item-title';
        paint(h, r.item.title, tokens);

        var p = doc.createElement('p');
        p.className = 'search-item-snippet';
        paint(p, snippet(r.item, tokens), tokens);

        a.appendChild(h);
        a.appendChild(p);
        list.appendChild(a);
      });
    }

    // 索引是异步拉取的，渲染必须等它就绪，否则首次打开会误报"没有找到"
    function run(q) {
      if (!q || !q.trim()) { list.textContent = ''; return; }
      var tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      ensureIndex().then(function () { render(query(q), tokens); });
    }

    function build() {
      layer = doc.createElement('div');
      layer.className = 'search-layer';
      layer.setAttribute('role', 'dialog');
      layer.setAttribute('aria-modal', 'true');
      layer.setAttribute('aria-label', '站内搜索');
      layer.hidden = true;

      var panel = doc.createElement('div');
      panel.className = 'search-panel';

      input = doc.createElement('input');
      input.className = 'search-input';
      input.type = 'search';
      input.placeholder = '搜索文章…';
      input.setAttribute('aria-label', '搜索关键词');
      input.autocomplete = 'off';

      list = doc.createElement('div');
      list.className = 'search-results';
      list.setAttribute('role', 'listbox');

      var hint = doc.createElement('div');
      hint.className = 'search-hint';
      hint.textContent = '↑↓ 选择 · Enter 打开 · Esc 关闭';

      panel.appendChild(input);
      panel.appendChild(list);
      panel.appendChild(hint);
      layer.appendChild(panel);
      doc.body.appendChild(layer);

      var timer = null;
      input.addEventListener('input', function () {
        clearTimeout(timer);
        var q = input.value;
        timer = setTimeout(function () { run(q); }, 90);
      });

      layer.addEventListener('click', function (e) {
        if (e.target === layer) close();
      });
    }

    function open(prefill) {
      if (!layer) build();
      lastFocus = doc.activeElement;
      layer.hidden = false;
      doc.body.classList.add('is-locked');
      input.value = prefill || '';
      input.focus();
      ensureIndex();
      run(prefill || '');
    }

    function close() {
      if (!layer || layer.hidden) return;
      layer.hidden = true;
      doc.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function bindKeys() {
      doc.addEventListener('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
        var metaK = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);

        if (metaK) { e.preventDefault(); open(); return; }
        if (e.key === '/' && !typing) { e.preventDefault(); open(); return; }
        if (!layer || layer.hidden) return;

        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
        else if (e.key === 'Enter') {
          var items = $$('.search-item', list);
          if (items[activeIndex]) { e.preventDefault(); window.location.href = items[activeIndex].href; }
        }
      });
    }

    function init() {
      trigger = $('[data-search-trigger]');
      if (!trigger) return;
      trigger.hidden = false;
      trigger.addEventListener('click', function () { open(); });
      bindKeys();
    }

    return { init: init, open: open };
  })();

  /* 文章目录：滚动高亮 */

  function initToc() {
    var card = $('.toc-card');
    if (!card) return;

    var links = {};
    $$('a[href^="#"]', card).forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      links[id] = a;
    });

    var heads = $$('.content h2[id], .content h3[id]');
    if (!heads.length) { card.parentNode.removeChild(card); return; }

    var current = '';
    function activate(id) {
      if (id === current) return;
      current = id;
      Object.keys(links).forEach(function (k) {
        links[k].classList.toggle('active', k === id);
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) activate(en.target.id);
      });
    }, { rootMargin: '-72px 0px -68% 0px', threshold: 0 });
    heads.forEach(function (h) { io.observe(h); });

    // 页面触底时 IO 可能漏掉最后一个标题，这里兜底
    window.addEventListener('scroll', function () {
      if (window.innerHeight + window.pageYOffset >= doc.body.scrollHeight - 4) {
        activate(heads[heads.length - 1].id);
      }
    }, { passive: true });
  }

  /* 代码块：语言标签 + 复制 */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = doc.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      doc.body.appendChild(ta);
      ta.select();
      try {
        doc.execCommand('copy') ? resolve() : reject();
      } catch (e) {
        reject(e);
      }
      doc.body.removeChild(ta);
    });
  }

  function initCode() {
    $$('.content figure.highlight').forEach(function (fig) {
      var code = fig.querySelector('td.code pre') || fig.querySelector('pre');
      if (!code) return;

      var lang = slice.call(fig.classList).filter(function (c) { return c !== 'highlight'; })[0] || 'code';

      var bar = doc.createElement('div');
      bar.className = 'code-bar';

      var label = doc.createElement('span');
      label.className = 'lang';
      label.textContent = lang;

      var btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy';
      btn.textContent = '复制';

      btn.addEventListener('click', function () {
        copyText(code.innerText).then(function () {
          btn.textContent = '已复制';
          btn.classList.add('done');
          setTimeout(function () {
            btn.textContent = '复制';
            btn.classList.remove('done');
          }, 1600);
        }).catch(function () {
          btn.textContent = '复制失败';
          setTimeout(function () { btn.textContent = '复制'; }, 1600);
        });
      });

      bar.appendChild(label);
      bar.appendChild(btn);
      fig.appendChild(bar);
    });
  }

  /* 图片灯箱 */

  function initLightbox() {
    var imgs = $$('.content img').filter(function (img) { return !img.closest('a'); });
    if (!imgs.length) return;

    var layer = doc.createElement('div');
    layer.className = 'lightbox';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-label', '图片预览');
    layer.hidden = true;

    var big = doc.createElement('img');
    layer.appendChild(big);
    doc.body.appendChild(layer);

    function close() {
      layer.hidden = true;
      doc.body.classList.remove('is-locked');
    }

    layer.addEventListener('click', close);
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !layer.hidden) close();
    });

    imgs.forEach(function (img) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        big.src = img.currentSrc || img.src;
        big.alt = img.alt || '';
        layer.hidden = false;
        doc.body.classList.add('is-locked');
      });
    });
  }

  /* 阅读进度条 */

  function initReadbar() {
    var bar = $('.readbar');
    var content = $('.content');
    if (!bar || !content) return;

    var ticking = false;
    function update() {
      var box = content.getBoundingClientRect();
      var top = box.top + window.pageYOffset;
      var ratio = (window.pageYOffset - top + window.innerHeight * 0.25)
        / (content.offsetHeight + window.innerHeight * 0.5);
      ratio = Math.min(1, Math.max(0, ratio));
      bar.style.transform = 'scaleX(' + ratio + ')';
      bar.hidden = ratio <= 0.001;
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* 首页标签筛选：复用搜索数据做跨分页筛选，无 JS 时退回标签页 */

  function initTagFilter() {
    var chips = $$('.chips-tags [data-tag]');
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        var name = chip.getAttribute('data-tag');
        Search.open(name);
      });
    });
  }

  /* 启动 */

  function boot() {
    Search.init();
    initToc();
    initCode();
    initLightbox();
    initReadbar();
    initTagFilter();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
