/**
 * script.js — Matrix Insight: Animation Engine + App Logic
 * =========================================================
 *
 * Version 1.1 — Added full per-operation animations:
 *   - Multiply: row × column sweep with formula building term by term
 *   - Transpose: cells fly from [i][j] to [j][i] with position tracking
 *   - Determinant: diagonal path highlighting with formula breakdown
 *   - Inverse: augmented matrix [A|I] → [I|A⁻¹] visualization
 *
 * Architecture: All animation is done in pure JS using async/await + Promises.
 * No animation libraries needed — CSS classes + DOM manipulation does it all.
 */


// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────
let state = {
  size: 3,
  stepsVisible: false,
  animRunning: false,
  animCancelled: false,
  animSpeedMs: 500  // base delay in ms — lower = faster
};

// Speed map: slider value 1-5 → ms delay
const SPEED_MAP = { 1: 900, 2: 650, 3: 450, 4: 250, 5: 100 };


// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

/** Promise-based delay. Checks cancellation flag so skip works instantly. */
const pause = (ms) => new Promise(resolve => {
  const t = setTimeout(resolve, ms);
  // Poll for cancellation every 50ms
  const check = setInterval(() => {
    if (state.animCancelled) { clearTimeout(t); clearInterval(check); resolve(); }
  }, 50);
  setTimeout(() => clearInterval(check), ms + 100);
});

/** Format a number cleanly — integers stay whole, floats get 4 sig figs */
function fmt(v) {
  if (v === null || v === undefined) return '?';
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (isNaN(n)) return '?';
  return Number.isInteger(n) ? String(n) : parseFloat(n.toPrecision(4)).toString();
}

/** Set the progress bar width (0–100) */
function setProgress(pct) {
  const bar = document.getElementById('anim-progress-bar');
  if (bar) bar.style.width = `${Math.min(100, pct)}%`;
}


// ─────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildMatrixGrid('A', state.size);
  buildMatrixGrid('B', state.size);
  fillRandom('A');
  fillRandom('B');
});


// ─────────────────────────────────────────────────────────
// INPUT GRID BUILDER (Sidebar)
// ─────────────────────────────────────────────────────────
function buildMatrixGrid(matrixId, size) {
  const container = document.getElementById(`matrix-${matrixId.toLowerCase()}`);
  if (!container) return;
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'numeric';
      inp.className = 'matrix-cell';
      inp.id = `cell-${matrixId}-${r}-${c}`;
      inp.setAttribute('aria-label', `Matrix ${matrixId} row ${r+1} col ${c+1}`);
      inp.placeholder = '0';
      inp.addEventListener('input', () => validateCell(inp));
      inp.addEventListener('keydown', e => navigateCells(e, matrixId, r, c, size));
      container.appendChild(inp);
    }
  }
}

function validateCell(input) {
  const v = input.value.trim();
  const ok = v === '' || v === '-' || !isNaN(parseFloat(v));
  input.style.borderColor = ok ? '' : 'var(--color-error)';
}

function navigateCells(e, id, r, c, size) {
  let nr = r, nc = c;
  if      (e.key === 'ArrowUp')    nr = Math.max(0, r-1);
  else if (e.key === 'ArrowDown')  nr = Math.min(size-1, r+1);
  else if (e.key === 'ArrowLeft')  nc = Math.max(0, c-1);
  else if (e.key === 'ArrowRight') nc = Math.min(size-1, c+1);
  else if (e.key === 'Enter')      nr = Math.min(size-1, r+1);
  else return;
  e.preventDefault();
  const t = document.getElementById(`cell-${id}-${nr}-${nc}`);
  if (t) t.focus();
}

function setMatrixSize(size) {
  if (size === state.size) return;
  if (state.animRunning) skipAnimation();
  state.size = size;
  document.getElementById('btn-size-2').classList.toggle('active', size===2);
  document.getElementById('btn-size-2').setAttribute('aria-pressed', size===2);
  document.getElementById('btn-size-3').classList.toggle('active', size===3);
  document.getElementById('btn-size-3').setAttribute('aria-pressed', size===3);
  buildMatrixGrid('A', size);
  buildMatrixGrid('B', size);
  hideResult();
  dismissError();
}

function readMatrix(id) {
  const size = state.size;
  const M = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const el = document.getElementById(`cell-${id}-${r}-${c}`);
      const raw = el ? el.value.trim() : '';
      const val = raw === '' ? 0 : parseFloat(raw);
      if (isNaN(val)) { showError(`Matrix ${id}: cell [${r+1}][${c+1}] is not a valid number.`); return null; }
      row.push(val);
    }
    M.push(row);
  }
  return M;
}

function fillRandom(id) {
  for (let r = 0; r < state.size; r++)
    for (let c = 0; c < state.size; c++) {
      const el = document.getElementById(`cell-${id}-${r}-${c}`);
      if (el) { el.value = Math.floor(Math.random()*19)-9; el.style.borderColor=''; }
    }
  dismissError();
}

function clearMatrix(id) {
  for (let r = 0; r < state.size; r++)
    for (let c = 0; c < state.size; c++) {
      const el = document.getElementById(`cell-${id}-${r}-${c}`);
      if (el) { el.value=''; el.style.borderColor=''; }
    }
  hideResult(); dismissError();
}

function setAnimSpeed(val) {
  state.animSpeedMs = SPEED_MAP[val] || 450;
}


// ─────────────────────────────────────────────────────────
// MATRIX MATH (JavaScript — mirrors Python/NumPy backend)
// ─────────────────────────────────────────────────────────
function jsMultiply(A, B) {
  const rA=A.length, cA=A[0].length, cB=B[0].length;
  const R = Array.from({length:rA}, ()=>Array(cB).fill(0));
  const steps = [`Multiplying ${rA}×${cA} matrix A with ${cA}×${cB} matrix B`,
                 `Result will be a ${rA}×${cB} matrix`, '─'.repeat(36)];
  for (let i=0;i<rA;i++) for (let j=0;j<cB;j++) {
    let sum = 0;
    const terms = [];
    for (let k=0;k<cA;k++) { sum+=A[i][k]*B[k][j]; terms.push(`(${A[i][k]}×${B[k][j]})`); }
    R[i][j] = Math.round(sum*1e6)/1e6;
    steps.push(`Result[${i+1}][${j+1}] = ${terms.join(' + ')} = ${R[i][j]}`);
  }
  return { result:R, steps };
}

function jsTranspose(A) {
  return { result: A[0].map((_, ci) => A.map(row => row[ci])) };
}

function jsDeterminant(A) {
  const n = A.length;
  if (n===1) return A[0][0];
  if (n===2) return A[0][0]*A[1][1] - A[0][1]*A[1][0];
  let det=0;
  for (let c=0;c<n;c++) {
    const minor = A.slice(1).map(row=>row.filter((_,ci)=>ci!==c));
    det += Math.pow(-1,c)*A[0][c]*jsDeterminant(minor);
  }
  return det;
}

function jsInverse(A) {
  const n=A.length;
  const det=jsDeterminant(A);
  if (Math.abs(det)<1e-10) throw new Error('Matrix is singular (det ≈ 0). Inverse does not exist.');
  const cofactors = A.map((row,i)=>row.map((_,j)=>{
    const minor = A.filter((_,ri)=>ri!==i).map(r=>r.filter((_,ci)=>ci!==j));
    return Math.pow(-1,i+j)*jsDeterminant(minor);
  }));
  const adj = cofactors[0].map((_,ci)=>cofactors.map(row=>row[ci]));
  const result = adj.map(row=>row.map(v=>Math.round(v/det*1e6)/1e6));
  return { result };
}


// ─────────────────────────────────────────────────────────
// OPERATION DISPATCHER
// ─────────────────────────────────────────────────────────
function runOperation(op) {
  if (state.animRunning) return;
  dismissError(); hideResult();

  const A = readMatrix('A');
  if (!A) return;
  let B = null;
  if (op === 'multiply') { B = readMatrix('B'); if (!B) return; }

  // Validate before starting animation
  try {
    if (op === 'determinant' || op === 'inverse') {
      if (A.length !== A[0].length) throw new Error('Operation requires a square matrix.');
    }
    if (op === 'inverse') {
      const det = jsDeterminant(A);
      if (Math.abs(det) < 1e-10) throw new Error('Matrix is singular (det ≈ 0). Inverse does not exist.');
    }
  } catch(e) { showError(e.message); return; }

  // Disable buttons during animation
  setButtonsDisabled(true);
  state.animRunning = true;
  state.animCancelled = false;

  // Run animation then show final result
  runAnimation(op, A, B).then(() => {
    state.animRunning = false;
    setButtonsDisabled(false);
    if (!state.animCancelled) {
      // Show polished final result below animation
      showFinalResult(op, A, B);
    }
    hideAnimCanvas();
  });
}

function setButtonsDisabled(disabled) {
  ['multiply','transpose','determinant','inverse'].forEach(op => {
    const btn = document.getElementById(`btn-${op}`);
    if (btn) btn.disabled = disabled;
  });
}


// ─────────────────────────────────────────────────────────
// ANIMATION ENGINE
// ─────────────────────────────────────────────────────────

/** Build an animation grid of .anim-cell divs */
function buildAnimGrid(containerId, matrix, opts={}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const n = matrix.length;
  const cols = matrix[0] ? matrix[0].length : n;
  container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  matrix.forEach((row, ri) => {
    row.forEach((val, ci) => {
      const cell = document.createElement('div');
      cell.className = 'anim-cell';
      if (opts.pending) {
        cell.classList.add('pending');
        cell.textContent = '';
      } else {
        cell.textContent = fmt(val);
      }
      if (opts.identity) cell.classList.add('hl-identity');
      cell.id = `${containerId}-${ri}-${ci}`;
      container.appendChild(cell);
    });
  });
}

/** Get an animation cell DOM element */
function animCell(gridId, r, c) {
  return document.getElementById(`${gridId}-${r}-${c}`);
}

/** Remove all highlight classes from an animation grid */
function clearAnimHighlights(gridId, n, cols) {
  const _cols = cols || n;
  for (let r=0;r<n;r++) for (let c=0;c<_cols;c++) {
    const el = animCell(gridId, r, c);
    if (el) el.className = 'anim-cell';
  }
}


// ── MAIN ANIMATION RUNNER ──
async function runAnimation(op, A, B) {
  showAnimCanvas();
  setProgress(0);

  const titles = {
    multiply:    'Animating  A × B  — Row × Column sweep',
    transpose:   'Animating  Aᵀ  — Cells flying to transposed positions',
    determinant: 'Animating  det(A) — Diagonal path visualization',
    inverse:     'Animating  A⁻¹ — Augmented matrix  [ A | I ] → [ I | A⁻¹ ]'
  };
  document.getElementById('anim-title').textContent = titles[op];

  switch(op) {
    case 'multiply':    await animateMultiply(A, B);    break;
    case 'transpose':   await animateTranspose(A);      break;
    case 'determinant': await animateDeterminant(A);    break;
    case 'inverse':     await animateInverse(A);        break;
  }

  setProgress(100);
}


// ════════════════════════════════════════════════════
// ANIMATION 1 — MULTIPLY: row × column sweep
// ════════════════════════════════════════════════════
async function animateMultiply(A, B) {
  const n = A.length;
  const stage    = document.getElementById('anim-stage');
  const wrapB    = document.getElementById('anim-wrap-b');
  const formulaBox = document.getElementById('anim-formula-box');
  const formulaLabel = document.getElementById('anim-formula-label');
  const formulaText  = document.getElementById('anim-formula-text');
  const formulaResult= document.getElementById('anim-formula-result');

  // Show A, ×, B, =, pending result
  stage.style.display = 'flex';
  wrapB.style.display = 'flex';
  document.getElementById('anim-op-symbol').textContent = '×';
  document.getElementById('anim-label-a').textContent = 'A';
  document.getElementById('anim-label-b').textContent = 'B';
  document.getElementById('anim-label-result').textContent = 'A × B';
  document.getElementById('anim-augmented').style.display = 'none';
  document.getElementById('anim-det-box').style.display = 'none';

  buildAnimGrid('anim-grid-a', A);
  buildAnimGrid('anim-grid-b', B);

  // Build result grid with all pending cells
  const resultMatrix = Array.from({length:n}, ()=>Array(n).fill(null));
  buildAnimGrid('anim-grid-result', resultMatrix, {pending:true});

  formulaBox.style.display = 'flex';
  formulaLabel.textContent = 'Computing…';
  formulaText.innerHTML = '';
  formulaResult.textContent = '?';

  const totalCells = n * n;
  let done = 0;

  for (let i=0; i<n; i++) {
    for (let j=0; j<n; j++) {
      if (state.animCancelled) return;

      // 1. Highlight entire row i of A (purple)
      clearAnimHighlights('anim-grid-a', n);
      clearAnimHighlights('anim-grid-b', n);
      for (let c=0;c<n;c++) {
        const el = animCell('anim-grid-a', i, c);
        if (el) el.classList.add('hl-row');
      }
      // 2. Highlight entire col j of B (green)
      for (let r=0;r<n;r++) {
        const el = animCell('anim-grid-b', r, j);
        if (el) el.classList.add('hl-col');
      }

      await pause(state.animSpeedMs * 0.5);
      if (state.animCancelled) return;

      // 3. Step through each k — pulse active pair and build formula
      let sum = 0;
      const termEls = [];

      for (let k=0;k<n;k++) {
        if (state.animCancelled) return;

        // Pulse active cells in this k step
        clearAnimHighlights('anim-grid-a', n);
        clearAnimHighlights('anim-grid-b', n);
        for (let c=0;c<n;c++) {
          const el = animCell('anim-grid-a', i, c);
          if (el) el.classList.add(c===k ? 'hl-active' : 'hl-row');
        }
        for (let r=0;r<n;r++) {
          const el = animCell('anim-grid-b', r, j);
          if (el) el.classList.add(r===k ? 'hl-active' : 'hl-col');
        }

        sum += A[i][k] * B[k][j];

        // Build formula text incrementally
        const termHTML = `<span class="term-row">${A[i][k]}</span>`
          + `<span class="term-sep">×</span>`
          + `<span class="term-col">${B[k][j]}</span>`;
        termEls.push(termHTML);
        formulaLabel.textContent = `Result[${i+1}][${j+1}]`;
        formulaText.innerHTML = termEls.join('<span class="term-sep"> + </span>');
        formulaResult.textContent = fmt(Math.round(sum*1e6)/1e6);

        await pause(state.animSpeedMs * 0.55);
        if (state.animCancelled) return;
      }

      // 4. Reveal result cell
      clearAnimHighlights('anim-grid-a', n);
      clearAnimHighlights('anim-grid-b', n);
      const resCell = animCell('anim-grid-result', i, j);
      if (resCell) {
        resCell.classList.remove('pending');
        resCell.textContent = fmt(Math.round(sum*1e6)/1e6);
        resCell.classList.add('revealed');
      }

      done++;
      setProgress((done / totalCells) * 95);
      await pause(state.animSpeedMs * 0.4);
    }
  }

  // Final: clear all row/col highlights, show complete
  clearAnimHighlights('anim-grid-a', n);
  clearAnimHighlights('anim-grid-b', n);
  formulaLabel.textContent = 'Complete ✓';
}


// ════════════════════════════════════════════════════
// ANIMATION 2 — TRANSPOSE: cells fly to new positions
// ════════════════════════════════════════════════════
async function animateTranspose(A) {
  const n  = A.length;
  const Tr = jsTranspose(A).result;
  const stage = document.getElementById('anim-stage');
  const wrapB = document.getElementById('anim-wrap-b');

  // Show: A, ⊤, =, Aᵀ (hide B)
  stage.style.display = 'flex';
  wrapB.style.display = 'none';
  document.getElementById('anim-op-symbol').textContent = '⊤';
  document.getElementById('anim-label-a').textContent = 'A';
  document.getElementById('anim-label-result').textContent = 'Aᵀ';
  document.getElementById('anim-augmented').style.display = 'none';
  document.getElementById('anim-det-box').style.display = 'none';
  document.getElementById('anim-formula-box').style.display = 'none';

  buildAnimGrid('anim-grid-a', A);
  // Build result with '?' pending
  buildAnimGrid('anim-grid-result', Array.from({length:n},()=>Array(n).fill(null)), {pending:true});

  await pause(state.animSpeedMs * 0.4);
  if (state.animCancelled) return;

  // Animate each cell [i][j] → shows in result at [j][i]
  // For each unique [i,j] pair (skip diagonal — it stays in place)
  const total = n * n;
  let done = 0;

  for (let i=0;i<n;i++) {
    for (let j=0;j<n;j++) {
      if (state.animCancelled) return;

      const srcCell = animCell('anim-grid-a', i, j);
      const dstCell = animCell('anim-grid-result', j, i);

      if (!srcCell || !dstCell) continue;

      // Highlight source
      srcCell.classList.add('hl-transpose');

      // Get real screen positions for the flying label
      const srcRect = srcCell.getBoundingClientRect();
      const dstRect = dstCell.getBoundingClientRect();

      // Create flying label
      const fly = document.createElement('div');
      fly.className = 'fly-label';
      fly.textContent = fmt(A[i][j]);
      fly.style.left = `${srcRect.left + srcRect.width/2 - 20}px`;
      fly.style.top  = `${srcRect.top  + srcRect.height/2 - 14}px`;
      document.body.appendChild(fly);

      await pause(60);

      // Fly to destination
      fly.style.left = `${dstRect.left + dstRect.width/2 - 20}px`;
      fly.style.top  = `${dstRect.top  + dstRect.height/2 - 14}px`;

      // Wait for fly transition (400ms in CSS)
      await pause(380);
      if (state.animCancelled) { fly.remove(); return; }

      // Land in destination cell
      fly.style.opacity = '0';
      dstCell.classList.remove('pending');
      dstCell.textContent = fmt(Tr[j][i]);
      dstCell.classList.add('hl-transpose-target');

      srcCell.classList.remove('hl-transpose');

      setTimeout(() => fly.remove(), 300);

      done++;
      setProgress((done/total)*95);
      await pause(state.animSpeedMs * 0.3);
    }
  }
}


// ════════════════════════════════════════════════════
// ANIMATION 3 — DETERMINANT: diagonal path highlight
// ════════════════════════════════════════════════════
async function animateDeterminant(A) {
  const n   = A.length;
  const det = jsDeterminant(A);
  const stage  = document.getElementById('anim-stage');
  const wrapB  = document.getElementById('anim-wrap-b');
  const detBox = document.getElementById('anim-det-box');
  const posEl  = document.getElementById('anim-det-pos');
  const negEl  = document.getElementById('anim-det-neg');
  const valEl  = document.getElementById('anim-det-value');

  stage.style.display = 'flex';
  wrapB.style.display = 'none';
  document.getElementById('anim-op-symbol').textContent = 'det';
  document.getElementById('anim-label-a').textContent = 'A';
  document.getElementById('anim-label-result').textContent = 'det(A)';
  document.getElementById('anim-augmented').style.display = 'none';
  document.getElementById('anim-formula-box').style.display = 'none';
  detBox.style.display = 'flex';

  buildAnimGrid('anim-grid-a', A);
  // Show result grid initially as pending scalar
  buildAnimGrid('anim-grid-result', [[null]], {pending:true});
  document.getElementById('anim-grid-result').style.gridTemplateColumns = '1fr';

  posEl.textContent = '…';
  negEl.textContent = '…';
  valEl.textContent = '?';

  await pause(state.animSpeedMs * 0.5);
  if (state.animCancelled) return;

  if (n === 2) {
    // 2×2: highlight main diagonal (ad) then anti-diagonal (bc)
    // Step 1: main diagonal a,d  → positive
    const pos1 = animCell('anim-grid-a', 0, 0);
    const pos2 = animCell('anim-grid-a', 1, 1);
    if (pos1) pos1.classList.add('hl-pos-diag');
    if (pos2) pos2.classList.add('hl-pos-diag');
    const posTerm = A[0][0] * A[1][1];
    posEl.textContent = `${A[0][0]} × ${A[1][1]} = ${fmt(posTerm)}`;
    setProgress(30);
    await pause(state.animSpeedMs);
    if (state.animCancelled) return;

    // Step 2: anti-diagonal b,c → negative
    const neg1 = animCell('anim-grid-a', 0, 1);
    const neg2 = animCell('anim-grid-a', 1, 0);
    if (neg1) neg1.classList.add('hl-neg-diag');
    if (neg2) neg2.classList.add('hl-neg-diag');
    const negTerm = A[0][1] * A[1][0];
    negEl.textContent = `${A[0][1]} × ${A[1][0]} = ${fmt(negTerm)}`;
    setProgress(65);
    await pause(state.animSpeedMs);
    if (state.animCancelled) return;

    // Step 3: reveal result
    const roundDet = Math.abs(det)<1e-10 ? 0 : Math.round(det*1e6)/1e6;
    valEl.textContent = fmt(roundDet);
    valEl.style.animation = 'cellReveal .4s ease';
    const resCell = animCell('anim-grid-result', 0, 0);
    if (resCell) { resCell.classList.remove('pending'); resCell.textContent = fmt(roundDet); resCell.classList.add('revealed'); }
    setProgress(95);

  } else {
    // 3×3: cofactor expansion along row 0 — highlight contributing elements per term
    let runningDet = 0;
    for (let col=0; col<n; col++) {
      if (state.animCancelled) return;

      clearAnimHighlights('anim-grid-a', n);

      const sign = Math.pow(-1, col);
      const elem = A[0][col];

      // Highlight the top-row element
      const topCell = animCell('anim-grid-a', 0, col);
      if (topCell) topCell.classList.add(sign>0 ? 'hl-pos-diag' : 'hl-neg-diag');

      // Highlight the minor cells (all cells NOT in row 0 or col)
      for (let r=1;r<n;r++) for (let c=0;c<n;c++) {
        if (c === col) continue;
        const mc = animCell('anim-grid-a', r, c);
        if (mc) mc.classList.add(sign>0 ? 'hl-pos-diag' : 'hl-neg-diag');
      }

      // Compute the minor
      const minor = A.slice(1).map(row=>row.filter((_,ci)=>ci!==col));
      const minorDet = jsDeterminant(minor);
      const termVal = sign * elem * minorDet;
      runningDet += termVal;

      const signStr = sign>0 ? '+' : '−';
      if (sign>0) {
        posEl.textContent = (posEl.textContent==='…' ? '' : posEl.textContent+' + ')
          + `${elem}×(${fmt(minorDet)}) = ${fmt(termVal)}`;
      } else {
        negEl.textContent = (negEl.textContent==='…' ? '' : negEl.textContent+' + ')
          + `${Math.abs(elem)}×(${fmt(minorDet)}) = ${fmt(Math.abs(termVal))}`;
      }

      setProgress(((col+1)/n)*80);
      await pause(state.animSpeedMs * 1.1);
    }

    clearAnimHighlights('anim-grid-a', n);
    const roundDet = Math.abs(det)<1e-10 ? 0 : Math.round(det*1e6)/1e6;
    valEl.textContent = fmt(roundDet);
    const resCell = animCell('anim-grid-result', 0, 0);
    if (resCell) { resCell.classList.remove('pending'); resCell.textContent = fmt(roundDet); resCell.classList.add('revealed'); }
    setProgress(95);
  }
}


// ════════════════════════════════════════════════════
// ANIMATION 4 — INVERSE: augmented matrix [A|I] → [I|A⁻¹]
// ════════════════════════════════════════════════════
async function animateInverse(A) {
  const n   = A.length;
  const inv = jsInverse(A).result;
  const stage     = document.getElementById('anim-stage');
  const augSection= document.getElementById('anim-augmented');
  const formulaBox= document.getElementById('anim-formula-box');
  const formulaLabel = document.getElementById('anim-formula-label');
  const formulaText  = document.getElementById('anim-formula-text');
  const formulaResult= document.getElementById('anim-formula-result');

  // Hide normal stage, show augmented view
  stage.style.display = 'none';
  augSection.style.display = 'flex';
  document.getElementById('anim-det-box').style.display = 'none';
  formulaBox.style.display = 'flex';
  formulaLabel.textContent = 'Method';
  formulaText.innerHTML = 'A × A<sup>−1</sup> = I &nbsp;|&nbsp; Solving via cofactor matrix';
  formulaResult.textContent = '…';

  // Build identity matrix
  const I = Array.from({length:n}, (_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));

  buildAnimGrid('anim-grid-aug-a', A);
  buildAnimGrid('anim-grid-aug-i', I, {identity:true});
  buildAnimGrid('anim-grid-aug-i2', I, {identity:true});
  buildAnimGrid('anim-grid-aug-result', Array.from({length:n},()=>Array(n).fill(null)), {pending:true});

  await pause(state.animSpeedMs * 0.7);
  if (state.animCancelled) return;

  // Animate: briefly pulse each row of A to show "row operations happening"
  const phases = [
    'Step 1: Computing cofactor matrix…',
    'Step 2: Transposing to get adjugate…',
    'Step 3: Dividing by determinant…',
    'Step 4: Revealing A⁻¹…'
  ];

  for (let ph=0; ph<3; ph++) {
    if (state.animCancelled) return;
    formulaLabel.textContent = phases[ph];

    // Pulse each row sequentially
    for (let r=0;r<n;r++) {
      if (state.animCancelled) return;
      clearAnimHighlights('anim-grid-aug-a', n);
      for (let c=0;c<n;c++) {
        const el = animCell('anim-grid-aug-a', r, c);
        if (el) el.classList.add('hl-row');
      }
      await pause(state.animSpeedMs*0.4);
    }
    clearAnimHighlights('anim-grid-aug-a', n);
    setProgress((ph+1)*22);
    await pause(state.animSpeedMs*0.3);
  }

  if (state.animCancelled) return;

  // Step 4: Reveal A⁻¹ cells one by one
  formulaLabel.textContent = phases[3];
  let revealed = 0;
  for (let i=0;i<n;i++) {
    for (let j=0;j<n;j++) {
      if (state.animCancelled) return;
      const cell = animCell('anim-grid-aug-result', i, j);
      if (cell) {
        cell.classList.remove('pending');
        cell.textContent = fmt(inv[i][j]);
        cell.classList.add('revealed');
      }
      revealed++;
      setProgress(70 + (revealed/(n*n))*25);
      formulaResult.textContent = `${revealed}/${n*n} cells`;
      await pause(state.animSpeedMs * 0.35);
    }
  }

  formulaLabel.textContent = 'Complete ✓';
  formulaResult.textContent = 'Done';
}


// ─────────────────────────────────────────────────────────
// SKIP ANIMATION
// ─────────────────────────────────────────────────────────
function skipAnimation() {
  if (!state.animRunning) return;
  state.animCancelled = true;
  // Remove any flying labels
  document.querySelectorAll('.fly-label').forEach(el => el.remove());
}


// ─────────────────────────────────────────────────────────
// SHOW / HIDE ANIMATION CANVAS
// ─────────────────────────────────────────────────────────
function showAnimCanvas() {
  document.getElementById('anim-canvas').style.display = 'block';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('result-display').style.display = 'none';
  document.getElementById('steps-section').style.display = 'none';
  setProgress(0);
}

function hideAnimCanvas() {
  document.getElementById('anim-canvas').style.display = 'none';
}


// ─────────────────────────────────────────────────────────
// FINAL RESULT DISPLAY (after animation completes)
// ─────────────────────────────────────────────────────────
function showFinalResult(op, A, B) {
  let output, tag, dims, isScalar = false;

  try {
    switch(op) {
      case 'multiply':
        output = jsMultiply(A, B);
        tag  = 'A × B';
        dims = `${A.length}×${A[0].length} · ${B.length}×${B[0].length} → ${output.result.length}×${output.result[0].length}`;
        break;
      case 'transpose':
        output = jsTranspose(A);
        tag  = 'Aᵀ';
        dims = `${A.length}×${A[0].length} → ${output.result.length}×${output.result[0].length}`;
        break;
      case 'determinant':
        const det = jsDeterminant(A);
        const roundDet = Math.abs(det)<1e-10 ? 0 : Math.round(det*1e6)/1e6;
        output = { result:null, scalarValue:roundDet };
        tag  = 'det(A)';
        dims = `${A.length}×${A.length} → scalar`;
        isScalar = true;
        break;
      case 'inverse':
        output = jsInverse(A);
        tag  = 'A⁻¹';
        dims = `${A.length}×${A.length} → ${A.length}×${A.length}`;
        break;
    }
  } catch(e) { showError(e.message); return; }

  // Show result section
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('result-display').style.display = 'block';
  document.getElementById('result-operation-tag').textContent = tag;
  document.getElementById('result-dims').textContent = dims;

  const resultGrid   = document.getElementById('result-grid');
  const scalarEl     = document.getElementById('scalar-result');

  if (isScalar) {
    resultGrid.style.display = 'none';
    document.querySelectorAll('.matrix-bracket').forEach(b=>b.style.display='none');
    scalarEl.style.display = 'flex';
    document.getElementById('scalar-label').textContent = tag + ' =';
    document.getElementById('scalar-value').textContent = output.scalarValue;
  } else {
    resultGrid.style.display = 'grid';
    document.querySelectorAll('.matrix-bracket').forEach(b=>b.style.display='');
    scalarEl.style.display = 'none';
    const M = output.result;
    resultGrid.style.gridTemplateColumns = `repeat(${M[0].length}, 1fr)`;
    resultGrid.innerHTML = '';
    M.forEach((row,ri) => row.forEach((val,ci) => {
      const cell = document.createElement('div');
      cell.className = 'result-cell';
      cell.textContent = fmt(val);
      cell.setAttribute('aria-label', `Row ${ri+1} Col ${ci+1}: ${val}`);
      resultGrid.appendChild(cell);
    }));
  }

  if (op==='multiply' && output.steps) renderSteps(output.steps);
  else document.getElementById('steps-section').style.display = 'none';
}

function hideResult() {
  document.getElementById('empty-state').style.display = '';
  document.getElementById('result-display').style.display = 'none';
  document.getElementById('steps-section').style.display = 'none';
  state.stepsVisible = false;
}


// ─────────────────────────────────────────────────────────
// STEP-BY-STEP RENDERER
// ─────────────────────────────────────────────────────────
function renderSteps(steps) {
  const section = document.getElementById('steps-section');
  const list    = document.getElementById('steps-list');
  const count   = document.getElementById('steps-count');

  list.innerHTML = '';
  let num = 0;

  steps.forEach(step => {
    const li = document.createElement('li');
    if (step.startsWith('─')) {
      li.className = 'step-item step-divider';
      li.textContent = step;
    } else {
      num++;
      li.className = 'step-item';
      li.style.animationDelay = `${num*30}ms`;
      const numEl  = document.createElement('span'); numEl.className='step-number'; numEl.textContent=num;
      const textEl = document.createElement('span'); textEl.textContent=step;
      li.appendChild(numEl); li.appendChild(textEl);
    }
    list.appendChild(li);
  });

  count.textContent = Math.max(0, num - 2);
  section.style.display = 'block';
}

function toggleSteps() {
  state.stepsVisible = !state.stepsVisible;
  document.getElementById('steps-content').style.display = state.stepsVisible ? 'block' : 'none';
  document.getElementById('steps-toggle-icon').classList.toggle('open', state.stepsVisible);
  document.getElementById('steps-toggle').setAttribute('aria-expanded', state.stepsVisible);
}


// ─────────────────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────────────────
function showError(msg) {
  const banner = document.getElementById('error-banner');
  document.getElementById('error-message').textContent = msg;
  banner.style.display = 'flex';
}

function dismissError() {
  const banner = document.getElementById('error-banner');
  if (banner) banner.style.display = 'none';
}
