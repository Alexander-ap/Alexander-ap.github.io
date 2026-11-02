/**
 * kpmark 主题的 marked 增强
 * 1. 脚注：[^1] 引用 + [^1]: 定义 → 文末脚注区
 * 2. 代码行高亮：```js {1,3-5} → 对应行加 .hl-line
 */
'use strict';

const FNOTE_RE = /\[\^([^\]]+)\]/g;
const FDEF_RE = /^\[\^([^\]]+)\]:\s*(.+)$/gm;

/* ---------- 脚注：在 markdown 渲染前处理 ---------- */
hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.content || data.content.indexOf('[^') === -1) return data;

  const defs = {};
  // 先提取定义行
  data.content = data.content.replace(FDEF_RE, function (m, id, text) {
    defs[id] = text.trim();
    return ''; // 从正文移除
  });

  if (!Object.keys(defs).length) return data;

  // 替换正文引用为上标链接
  let idx = 0;
  const order = [];
  data.content = data.content.replace(FNOTE_RE, function (m, id) {
    if (defs[id] === undefined) return m; // 无定义的引用保持原样
    if (order.indexOf(id) === -1) order.push(id);
    return '<sup class="fnref"><a href="#fn-' + id + '" id="fnref-' + id + '">' + id + '</a></sup>';
  });

  // 追加脚注区
  if (order.length) {
    let html = '\n\n<section class="footnotes">\n<ol>\n';
    order.forEach(function (id) {
      html += '<li id="fn-' + id + '"><p>' + defs[id] +
        ' <a href="#fnref-' + id + '" class="fn-back">↩</a></p></li>\n';
    });
    html += '</ol>\n</section>\n';
    data.content += html;
  }

  return data;
});

/* ---------- 代码行高亮：从 figcaption 解析行号 ---------- */
// Hexo 高亮器在 before_post_render 之前就把代码块渲染好了，
// 但它会把 info string 的 {1,3} 保留在 <figcaption><span>{1,3}</span></figcaption> 里。
// 只需在 after_post_render 读 figcaption → 给 <span class="line"> 加 .hl-line。
hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('highlight') === -1) return data;

  data.content = data.content.replace(
    /<figure class="highlight([^"]*)"[\s\S]*?<\/figure>/g,
    function (figure) {
      // 从 figcaption 提取 {spec}
      const fcMatch = figure.match(/<figcaption><span>&#123;([\d,\-\s]+)&#125;<\/span><\/figcaption>/);
      if (!fcMatch) return figure;

      const lines = parseLineSpec(fcMatch[1]);
      if (!lines.size) return figure;

      // 只在 td.code 内给 <span class="line"> 加 .hl-line（gutter 的行号不用高亮）
      return figure.replace(
        /<td class="code"><pre>([\s\S]*?)<\/pre><\/td>/,
        function (m, codeHtml) {
          let lineNum = 0;
          const newCode = codeHtml.replace(/<span class="line">/g, function () {
            lineNum++;
            return lines.has(lineNum)
              ? '<span class="line hl-line">'
              : '<span class="line">';
          });
          return '<td class="code"><pre>' + newCode + '</pre></td>';
        }
      );
    }
  );
  return data;
});

function parseLineSpec(spec) {
  const set = new Set();
  spec.split(',').forEach(function (part) {
    part = part.trim();
    if (!part) return;
    const dash = part.indexOf('-');
    if (dash > 0) {
      const a = parseInt(part.slice(0, dash), 10);
      const b = parseInt(part.slice(dash + 1), 10);
      if (!isNaN(a) && !isNaN(b)) for (let i = a; i <= b; i++) set.add(i);
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n)) set.add(n);
    }
  });
  return set;
}
