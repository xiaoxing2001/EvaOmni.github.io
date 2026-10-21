/* No fetch or dependencies: this also works when index.html is opened locally. */
(() => {
  'use strict';
  const { models, cases } = window.EVAOMNI;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  // Inline paths keep dynamically inserted icons visible under file:// as well.
  const icon = (name) => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${{
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    audio: '<path d="M3 10v4M7 6v12M12 2v20M17 6v12M21 10v4"/>',
    external: '<path d="M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>'
  }[name]}</svg>`;
  const metricNames = ['Accuracy', 'C.G.', 'B.G.'];
  const metricShort = ['Acc.', 'C.G.', 'B.G.'];
  const state = { metric: 0, type: 'all', level: 'overall', query: '', expanded: false };
  const human = models.find((model) => model.type === 'human');
  const medals = ['gold', 'silver', 'bronze'];

  function renderRank(rank) {
    if (rank <= 3) return `<span class="rank rank-medal"><img src="assets/medals/${medals[rank - 1]}.svg" width="28" height="32" alt="${medals[rank - 1]} medal, rank ${rank}"></span>`;
    return `<span class="rank">${String(rank).padStart(2, '0')}</span>`;
  }

  function renderLeaderboard() {
    const ranked = models.filter((model) => model.type !== 'human' && (state.type === 'all' || model.type === state.type))
      .sort((a, b) => b.scores[state.level][state.metric] - a.scores[state.level][state.metric] || a.name.localeCompare(b.name));
    // Rank within the selected model group, before applying a search query.
    const filtered = ranked.map((model, index) => ({ ...model, rank: index + 1 }))
      .filter((model) => model.name.toLowerCase().includes(state.query));
    const visible = state.expanded ? filtered : filtered.slice(0, 10);
    $('#leaderboard-body').innerHTML = visible.length ? visible.map((model) => {
      const scores = model.scores[state.level];
      return `<tr class="${model.rank <= 3 ? 'top-rank' : ''}"><td>${renderRank(model.rank)}</td><td><span class="model-name"><img class="model-logo" src="${escape(model.logo)}" width="24" height="24" alt="">${escape(model.name)}</span></td><td><span class="type-badge ${model.type === 'open' ? 'open' : ''}">${model.type === 'open' ? 'Open-weight' : 'Proprietary'}</span></td>${scores.map((score, i) => `<td${i === state.metric ? ' class="score-selected"' : ''}>${i === state.metric ? `<span class="score-bar" aria-hidden="true"><i style="width:${score}%"></i></span>` : ''}${score.toFixed(1)}</td>`).join('')}</tr>`;
    }).join('') : '<tr><td colspan="6" class="no-results">No models match your search.</td></tr>';
    $$('[data-metric]').forEach((button) => {
      const selected = Number(button.dataset.metric) === state.metric;
      button.setAttribute('aria-pressed', String(selected));
      if (button.classList.contains('column-sort')) {
        button.textContent = metricShort[Number(button.dataset.metric)] + (selected ? ' ↓' : '');
        if (selected) button.parentElement.setAttribute('aria-sort', 'descending');
        else button.parentElement.removeAttribute('aria-sort');
      }
    });
    $$('[data-type]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.type === state.type)));
    $('#results-status').textContent = `${visible.length} of ${filtered.length} models · ${metricNames[state.metric]}, high to low`;
    const toggle = $('#show-all');
    toggle.hidden = filtered.length <= 10;
    toggle.textContent = state.expanded ? 'Show top 10 ↑' : `Show all ${filtered.length} models ↓`;
    $('#human-scores').innerHTML = human.scores[state.level].map((score, i) => `${metricShort[i]} <strong>${score.toFixed(1)}</strong>`).join(' &nbsp; / &nbsp; ');
  }

  $$('[data-metric]').forEach((button) => button.addEventListener('click', () => {
    state.metric = Number(button.dataset.metric);
    renderLeaderboard();
  }));
  $$('[data-type]').forEach((button) => button.addEventListener('click', () => {
    state.type = button.dataset.type;
    renderLeaderboard();
  }));
  $('#level-select').addEventListener('change', (event) => {
    state.level = event.target.value;
    renderLeaderboard();
  });
  $('#model-search').addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderLeaderboard();
  });
  $('#show-all').addEventListener('click', () => {
    state.expanded = !state.expanded;
    renderLeaderboard();
  });
  renderLeaderboard();

  function evidenceInterval(time) {
    return time.match(/\d+:\d+(?::\d+)?/g).map((stamp) => stamp.split(':').reduce((seconds, part) => seconds * 60 + Number(part), 0));
  }

  function renderCase(index) {
    const item = cases[index];
    const options = item.options.split('\n');
    const answer = options.find((option) => option.startsWith(`${item.answer}.`));
    const videoId = new URL(item.video_url).searchParams.get('v');
    const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
    const evidence = ['visual', 'audio'].flatMap((modality) => item.evidence[modality].map((entry) => {
      const [start, end] = evidenceInterval(entry.time);
      const stamp = escape(entry.time.slice(1, -1).replace(',', ' – '));
      return `<div class="evidence-item ${modality}"><div class="evidence-title">${icon(modality === 'visual' ? 'eye' : 'audio')}${modality === 'visual' ? 'Visual' : 'Audio'} evidence<a class="evidence-seek" href="${embedUrl}?start=${start}&amp;end=${end}&amp;autoplay=1&amp;rel=0" target="case-video" data-start="${start}" data-end="${end}" aria-label="Play ${modality} evidence, ${stamp}">${stamp} ▷</a></div><p>${escape(entry.description)}</p></div>`;
    })).join('');
    $('#case-content').innerHTML = `
      <div class="case-video-panel"><div class="case-video-sticky"><div class="case-video-label"><span>ORIGINAL VIDEO</span><span>VIDEO #${escape(item.video_id)}</span></div>
      <iframe id="case-video" name="case-video" class="case-video" src="${embedUrl}?rel=0" title="Level ${item.level} example: ${escape(item.capability)} — original YouTube video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      <a class="case-source" href="${escape(item.video_url)}" target="_blank" rel="noopener noreferrer">${icon('external')} Open original video on YouTube</a>
      <p class="case-video-hint">Click an evidence timestamp to play that annotated segment. Use the controls below to return to the full video.</p>
      <button class="case-reset" id="case-video-reset" type="button">↺ Full video</button><p class="case-playback-status" id="case-playback-status" role="status">Full video · press play to watch</p>
      <p class="case-embed-note">If the video cannot play here, open the original on YouTube.</p></div></div>
      <div class="case-details">
      <div class="case-question"><div class="case-kicker"><span>LEVEL ${item.level} · ${escape(item.capability.toUpperCase())}</span><span>QA #${String(item.qa_id).padStart(4, '0')}</span></div>
      <h3>${escape(item.question)}</h3><ol>${options.map((option) => `<li data-answer="${escape(option[0])}"${option[0] === item.answer ? ` class="correct" aria-label="Correct answer: ${escape(option)}"` : ''}>${escape(option.slice(3))}</li>`).join('')}</ol>
      <div class="case-answer-label"><span>ANNOTATED ANSWER</span><p>${escape(answer)}</p></div></div>
      <div class="case-evidence"><h3>The evidence behind the answer <span class="annotated">Human annotated</span></h3>${evidence}
      ${item.reason_chain ? `<details class="case-answer" open><summary>Annotated reasoning chain</summary><p>${escape(item.reason_chain).replace(/\n/g, '<br>')}</p></details>` : ''}</div></div>`;
    $$('[data-start]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      $('#case-video').src = link.href;
      $('#case-playback-status').textContent = `Playing evidence · ${link.textContent.replace(' ▷', '')}`;
      $$('[data-start]').forEach((other) => {
        if (other === link) other.setAttribute('aria-current', 'true');
        else other.removeAttribute('aria-current');
      });
    }));
    $('#case-video-reset').addEventListener('click', () => {
      $('#case-video').src = `${embedUrl}?rel=0`;
      $('#case-playback-status').textContent = 'Full video · press play to watch';
      $$('[data-start]').forEach((link) => link.removeAttribute('aria-current'));
    });
    $$('[data-case]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.case) === index)));
  }
  $$('[data-case]').forEach((button) => button.addEventListener('click', () => renderCase(Number(button.dataset.case))));
  renderCase(0);

  $('#copy-citation').addEventListener('click', async () => {
    const text = $('#citation-text').textContent;
    try {
      await navigator.clipboard.writeText(text);
      $('#copy-citation span').textContent = 'Copied!';
      $('#copy-status').textContent = 'Citation copied to clipboard.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('#citation-text'));
      selection.removeAllRanges();
      selection.addRange(range);
      $('#copy-citation span').textContent = 'Selected — press ⌘/Ctrl+C';
      $('#copy-status').textContent = 'Citation selected. Press Command+C or Control+C to copy.';
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $$('.nav-links a[href^="#"]').forEach((link) => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }), { rootMargin: '-15% 0px -60% 0px' });
    $$('main section[id]').forEach((section) => observer.observe(section));
  }
})();
