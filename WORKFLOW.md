# 🛠️ WORKFLOW — Matrix Insight Build Log
### The complete step-by-step record of how this project was built

---

## Project Brief

- **Title**: Matrix Insight — Visualizing Linear Algebra
- **Goal**: An interactive web app for visualizing matrix operations using NumPy
- **Tech Stack (V1)**: HTML + CSS + Vanilla JS (frontend) | Python + NumPy (backend)
- **Start Date**: 2026-03-30
- **Build Agent**: Antigravity (powered by Claude Sonnet — Thinking Mode)
- **Design Tool**: Google Stitch (AI UI design system generator)

---

## Phase 0 — Planning

Before writing any code, we defined the full project scope:

### Features to build:
- [x] Matrix input (2×2 and 3×3)
- [x] Random fill + Clear buttons
- [x] Matrix Multiply (A × B)
- [x] Transpose (Aᵀ)
- [x] Determinant det(A)
- [x] Inverse A⁻¹ (with singular matrix error handling)
- [x] Result display as grid
- [x] Step-by-step breakdown (for multiplication)
- [x] Error banner for invalid operations
- [x] Arrow key navigation between cells
- [x] Responsive layout (mobile-friendly)

### File structure decided:
```
matrix-visualizer/
├── backend/
│   ├── main.py
│   └── operations.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── LEARNINGS.md
├── WORKFLOW.md
├── README.md
└── requirements.txt
```

---

## Phase 1 — Project Scaffold & Directory Setup

### What happened:
Created the full directory structure.

```bash
mkdir -p matrix-visualizer/frontend
mkdir -p matrix-visualizer/backend
```

### Files created:
- `requirements.txt` — lists `numpy>=1.24.0` as the only dependency
- `README.md` — project overview, setup instructions, tech stack table, operations table, and future version roadmap

### 📦 Git Commit:
```bash
git add .
git commit -m "init: project scaffold with frontend and backend structure"
```

---

## Phase 2 — UI Design with Stitch

### What happened:
Before writing code, we used **Google Stitch** (a Gemini-powered UI design tool) to generate a design system and screen mockup.

### Stitch project created:
- **Project name**: Matrix Insight — Visualizing Linear Algebra
- **Project ID**: `4732234473045727851`
- **Screen ID**: `97bfc3d4768e4c8b9d4483ca8493157c`

### Design system generated — "Linear Logic" (by Stitch):
Stitch auto-named the design system **"Linear Logic"** and gave it an identity called **"The Mathematical Atelier"**. Key decisions:

| Design Token | Value | Reasoning |
|-------------|-------|-----------|
| Primary color | `#6C63FF` (purple) | Signifies "aha" interactive moments |
| Sidebar BG | `#1a1d2e` (dark navy) | Authority and focus away from content |
| Surface BG | `#fbf8ff` | Airy, editorial workspace feel |
| Font (UI) | Inter | Humanistic clarity |
| Font (matrix cells) | JetBrains Mono | Perfect column alignment for numbers |
| Border radius | Round (1rem+) | Soft, approachable feel |
| Shadows | Diffuse, tinted (not black) | Depth without harshness |

### Key design rules from Stitch:
- **"No-Line Rule"**: Never use `1px solid` borders for sectioning. Use background color shifts instead.
- **"Glass & Gradient Rule"**: Primary action buttons use `linear-gradient(135deg, primary, primary-dark)`.
- **Tonal Layering**: 3 surface levels — `surface` → `surface-low` → `surface-lowest` — no borders needed.

### 📦 Git Commit:
_(Design is tracked via Stitch; code commit happens after implementing the design)_

---

## Phase 3 — Backend: operations.py

### What happened:
Wrote the core Python module with all 4 matrix operations using NumPy.

### File: `backend/operations.py`

#### Function 1: `multiply_matrices(A, B)`
```python
def multiply_matrices(A, B):
    mat_A = np.array(A, dtype=float)
    mat_B = np.array(B, dtype=float)
    # Dimension check
    if mat_A.shape[1] != mat_B.shape[0]:
        raise ValueError("Inner dimensions must match.")
    result = np.dot(mat_A, mat_B)
    # Also generates step-by-step explanation
    return {"result": result.tolist(), "steps": [...]}
```

#### Function 2: `transpose_matrix(A)`
```python
def transpose_matrix(A):
    mat_A = np.array(A, dtype=float)
    return {"result": mat_A.T.tolist()}  # .T is NumPy's transpose shorthand
```

#### Function 3: `determinant_matrix(A)`
```python
def determinant_matrix(A):
    mat_A = np.array(A, dtype=float)
    if mat_A.shape[0] != mat_A.shape[1]:
        raise ValueError("Determinant requires a square matrix.")
    det = np.linalg.det(mat_A)
    if abs(det) < 1e-10:
        det = 0.0  # Floating-point cleanup
    return {"result": round(det, 6)}
```

#### Function 4: `inverse_matrix(A)`
```python
def inverse_matrix(A):
    mat_A = np.array(A, dtype=float)
    det = np.linalg.det(mat_A)
    if abs(det) < 1e-10:
        raise ValueError("Matrix is singular. Inverse does not exist.")
    result = np.linalg.inv(mat_A)
    return {"result": np.round(result, 6).tolist()}
```

### Design decisions:
- All functions accept Python lists → convert to ndarray → convert back to list on return
- This keeps the module framework-agnostic (works equally well from CLI and Flask)
- Error messages are descriptive enough to show directly in the UI

### 📦 Git Commit:
```bash
git add backend/operations.py
git commit -m "feat: core matrix operations with numpy (multiply, transpose, det, inverse)"
```

---

## Phase 4 — Backend: main.py (Test Runner)

### What happened:
Wrote `backend/main.py` to test all functions with real matrix data.

### Test matrices used:
```python
A = [[1,2,3],[4,5,6],[7,8,9]]  # Singular (det = 0, no inverse)
B = [[9,8,7],[6,5,4],[3,2,1]]
C = [[2,1,0],[1,3,1],[0,1,2]]  # Invertible (det ≠ 0)
```

### 6 tests run:
1. Multiply A × B — shows result + step-by-step
2. Transpose A — shows flipped matrix
3. Determinant of C — shows scalar result
4. Determinant of singular matrix — shows det = 0
5. Inverse of C — shows A⁻¹
6. Inverse of singular matrix — **expects ValueError** (tests error handling)

### Helper functions written:
```python
def print_matrix(label, matrix):
    # Formats 2D list as a pretty-printed grid

def print_separator(title):
    # Prints ====== section header ======
```

### 📦 Git Commit:
```bash
git add backend/main.py
git commit -m "feat: backend test runner with 6 operation tests and error handling"
```

---

## Phase 5 — Frontend: index.html

### What happened:
Wrote the full HTML layout based on the Stitch design mockup.

### Structure:
```html
<div class="app-layout">
  <aside class="sidebar">
    <!-- Brand, Size Toggle, Matrix A Input, Matrix B Input -->
  </aside>
  <main class="main-content">
    <!-- Content Header, Operation Buttons, Error Banner,
         Result Section, Step-by-Step Section, Footer -->
  </main>
</div>
```

### Key HTML decisions:

#### Sidebar:
- Brand: SVG-free "grid icon" made with 9 `<span>` elements in a CSS grid
- Size toggle: `<button>` elements with `aria-pressed` for accessibility
- Matrix grids: Empty `<div>` containers — JavaScript fills them dynamically
- Action buttons: `Random` (fills with integers) and `Clear`

#### Main content:
- 4 operation buttons with icon, label, and description (e.g., "×", "Multiply", "A×B")
- Error banner with `role="alert"` — screen readers announce it instantly
- Result section with `aria-live="polite"` — screen readers announce updates
- Step-by-step section with `aria-expanded` toggle

#### Accessibility features:
- All interactive elements have `aria-label`
- Matrix grids have `role="grid"`
- Error banner has `role="alert"` and `aria-live`
- Result section has `aria-live="polite"`
- Toggle buttons have `aria-pressed` state

### 📦 Git Commit:
```bash
git add frontend/index.html
git commit -m "feat: matrix input UI with semantic HTML and full ARIA accessibility"
```

---

## Phase 6 — Frontend: style.css (Design System)

### What happened:
Wrote the complete CSS design system implementing the Stitch "Linear Logic" spec.

### Structure of style.css:
```
1. CSS Custom Properties (all design tokens)
2. Reset & Base styles
3. App Layout (sidebar + main using flexbox)
4. Sidebar styles
5. Matrix grid & cell styles
6. Main content area
7. Operations panel (buttons)
8. Error banner
9. Result section
10. Step-by-step breakdown
11. Responsive (mobile/tablet)
```

### Color system implemented:
```css
:root {
  --color-surface:         #fbf8ff;
  --color-surface-low:     #f4f2ff;
  --color-surface-lowest:  #ffffff;
  --color-sidebar-bg:      #1a1d2e;
  --color-primary:         #6C63FF;
  --color-error:           #ba1a1a;
  --color-success:         #51CF66;
}
```

### Typography system:
```css
--font-ui:   'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Animations implemented:
| Name | Effect | Used On |
|------|--------|---------|
| `cellPop` | Scale 0.7→1 with stagger | Result matrix cells |
| `fadeInUp` | Opacity 0→1 + translateY | Result display |
| `slideIn` | translateX -12px → 0 | Step items |
| `float` | translateY loop | Empty state sigma icon |
| `slideDown` | translateY -10px → 0 | Error banner |
| `dotPulse` | Scale 1→1.4→1 | Brand grid icon on hover |

### Micro-interactions:
- Operation buttons: `translateY(-3px) scale(1.02)` on hover
- Matrix cells: purple `box-shadow` glow on focus
- Toggle buttons: scale + color shift on hover/active
- Clear button: red tint on hover

### Mobile responsive:
- Below 900px: Sidebar shrinks to 260px
- Below 680px: Layout flips to vertical (sidebar on top)

### 📦 Git Commit:
```bash
git add frontend/style.css
git commit -m "style: complete design system with CSS variables, animations, and responsive layout"
```

---

## Phase 7 — Frontend: script.js (App Logic)

### What happened:
Wrote the full JavaScript for the app — the most complex file.

### Script.js structure:
```
1. State object
2. DOMContentLoaded initialization
3. buildMatrixGrid() — dynamic DOM generation
4. validateCellInput() — real-time validation
5. navigateCells() — arrow key UX
6. setMatrixSize() — toggle between 2×2/3×3
7. readMatrix() — DOM → data
8. fillRandom() — random integer fill
9. clearMatrix() — reset cells
10. Math functions (JS port of NumPy):
    ├── jsMultiply()
    ├── jsTranspose()
    ├── jsDeterminant()
    └── jsInverse()
11. runOperation() — dispatcher with loading state
12. showResult() — renders result to DOM
13. hideResult() — resets to empty state
14. renderSteps() — builds step-by-step list
15. toggleSteps() — expand/collapse panel
16. showError() / dismissError() — error banner
```

### Key implementation details:

#### Dynamic grid generation:
```javascript
// Creates size×size input cells programmatically
for (let row = 0; row < size; row++) {
  for (let col = 0; col < size; col++) {
    const input = document.createElement('input');
    input.id = `cell-${matrixId}-${row}-${col}`;
    container.appendChild(input);
  }
}
```

#### Arrow key navigation:
```javascript
input.addEventListener('keydown', (e) => {
  // ArrowUp/Down/Left/Right → move focus between cells
  // Enter → move to next row
});
```

#### Staggered result animation:
```css
/* CSS: nth-child delays */
.result-cell:nth-child(1) { animation-delay: 0ms; }
.result-cell:nth-child(2) { animation-delay: 40ms; }
/* ... */
```
Each cell pops in sequentially — like a calculation "revealing" itself.

#### Determinant display (scalar, not grid):
The determinant is a single number, not a matrix. So we switch from showing the grid to showing:
```
det(A) = 11
```
in a styled `<span>` — hiding the matrix brackets.

### 📦 Git Commit:
```bash
git add frontend/script.js
git commit -m "feat: frontend JS with dynamic grids, all 4 operations, step-by-step breakdown"
```

---

## Phase 8 — Documentation

### LEARNINGS.md
Created a comprehensive teaching document covering:
- What matrices are and why they matter
- How each operation works (with formulas + examples)
- NumPy vs plain Python
- CSS design tokens
- DOM manipulation
- State management
- Accessibility
- Error handling patterns
- V1 vs V2 architecture
- Git commit discipline

### WORKFLOW.md (this file)
Documented the complete build log with:
- Every phase of work
- Every design decision
- Every git commit
- Every file created and why

### 📦 Git Commit:
```bash
git add LEARNINGS.md WORKFLOW.md
git commit -m "docs: added comprehensive learning notes and full build workflow log"
```

---

## Phase 9 — Git Init & Final Commit

### Initialize the git repo:
```bash
cd matrix-visualizer
git init
git add .
git commit -m "init: project scaffold with frontend and backend structure"
```

### Full commit history (chronological):

| # | Commit Message | What Changed |
|---|---------------|-------------|
| 1 | `init: project scaffold with frontend and backend structure` | All directories, requirements.txt, README.md |
| 2 | `feat: core matrix operations with numpy (multiply, transpose, det, inverse)` | backend/operations.py |
| 3 | `feat: backend test runner with 6 operation tests and error handling` | backend/main.py |
| 4 | `feat: matrix input UI with semantic HTML and full ARIA accessibility` | frontend/index.html |
| 5 | `style: complete design system with CSS variables, animations, and responsive layout` | frontend/style.css |
| 6 | `feat: frontend JS with dynamic grids, all 4 operations, step-by-step breakdown` | frontend/script.js |
| 7 | `docs: added comprehensive learning notes and full build workflow log` | LEARNINGS.md, WORKFLOW.md |
| 8 | `feat: animated visualizer — row/col sweep, flying transpose, diagonal det, augmented inverse` | frontend/index.html, style.css, script.js, LEARNINGS.md, WORKFLOW.md |

---

## Phase 10 — Animation Engine (Version 1 → 1.1)

### Why this phase was added

After V1 was built, it became clear that a static result grid doesn't justify the name **"Visualizer"**. The core value of this project is seeing the computation unfold — not just reading the answer.

> **Stepping stone philosophy**: V1 gave us the math engine (correctness). V1.1 gives us the visualization layer (insight). These are intentionally separate phases — you can't animate what you haven't correctly computed first.

### What changed

| File | What was added |
|------|---------------|
| `frontend/index.html` | `<section class="anim-canvas">` — the full animation stage with matrix displays, formula box, det box, augmented matrix view |
| `frontend/style.css` | 10+ new CSS classes for highlights: `hl-row`, `hl-col`, `hl-active`, `hl-pos-diag`, `hl-neg-diag`, `revealed`, `hl-transpose`, `hl-transpose-target`, `.fly-label`, `.anim-cell` |
| `frontend/script.js` | Complete rewrite: async animation engine, `buildAnimGrid()`, `animateMultiply()`, `animateTranspose()`, `animateDeterminant()`, `animateInverse()`, `skipAnimation()` |
| `LEARNINGS.md` | Sections 18–20 added: `async/await`, `getBoundingClientRect`, CSS class state machine |
| `WORKFLOW.md` | This phase documented |

### Per-operation animation design

#### Multiply — Row × Column Sweep
```
For each result cell [i][j]:
  1. Highlight row i of A (purple)
  2. Highlight col j of B (green)
  3. For each k: pulse A[i][k] and B[k][j] in amber, build formula term by term
  4. Pop result[i][j] into place with glow animation
  5. Advance to next cell
```

#### Transpose — Flying Cells
```
For each cell [i][j]:
  1. Highlight source cell in A (purple tint)
  2. Get screen coordinates: getBoundingClientRect()
  3. Create .fly-label div at source position (position: fixed)
  4. CSS transition moves it to destination position in 400ms
  5. Land in result[j][i] with pop-in animation
```

#### Determinant — Diagonal Visualization
```
2×2:
  - Green highlight: A[0][0], A[1][1]  → positive term ad
  - Red highlight: A[0][1], A[1][0]    → negative term bc
  - Formula box: "ad = X" - "bc = Y" = Z

3×3 (cofactor expansion):
  - For each top-row element A[0][col]:
    + Highlight A[0][col] and its minor cells with col's sign color
    + Show (element × minor_det) in formula
    + Accumulate running total
```

#### Inverse — Augmented Matrix View
```
Show: [ A | I ]  →  [ I | A⁻¹ ]
  1. Display A and Identity matrix side by side with a divider
  2. Animate row-by-row pulses showing "row operations"
  3. Reveal A⁻¹ cells one by one into the right panel
```

### Key technical decisions

| Decision | Why |
|----------|-----|
| `async/await` over `setTimeout` callbacks | Readable sequential logic without "callback hell" |
| `position: fixed` on flying labels | Positioned relative to viewport, not a parent container |
| CSS class toggling, not inline styles | Keeps visual logic in CSS, JavaScript stays declarative |
| `animCancelled` flag for skip | Polling flag is simpler and reliable vs AbortController for this use |
| Speed slider (1–5 → 900ms–100ms) | Lets learners go slow to understand, or fast to verify |

### 📦 Git Commit:
```bash
git add frontend/index.html frontend/style.css frontend/script.js LEARNINGS.md WORKFLOW.md
git commit -m "feat: animated visualizer — row/col sweep, flying transpose, diagonal det, augmented inverse"
```

---

## What to Run

### Test the backend:
```bash
cd matrix-visualizer/backend
pip install -r ../requirements.txt
python main.py
```

### Open the frontend:
1. Open `frontend/index.html` in any browser
2. Click **"⚄ Random"** to fill matrices (pre-filled on load)
3. Click any operation button — watch it animate
4. Use the **speed slider** in the sidebar to control pace
5. Click **"Skip ⏩"** to jump straight to the result

---

## What's Next — Version 2 Roadmap

| Version | New Features | New Tech |
|---------|-------------|---------|
| V1.1 | ✅ Animation engine — row sweep, fly, diagonal, augmented | async/await, getBoundingClientRect |
| V2 | Flask REST API backend | Flask, REST, HTTP, JSON |
| V2 | Connect JS to Python via fetch() | Promises, CORS |
| V3 | React frontend | React, JSX, useState, useEffect |
| V3 | D3.js matrix visualizations | D3, SVG animations |
| V4 | Gaussian elimination step-by-step | Row reduction algorithm |
| V4 | Eigenvalue/eigenvector operations | Advanced linear algebra |
