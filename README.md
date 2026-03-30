# Matrix Insight — Visualizing Linear Algebra

An interactive web app that helps users understand matrix operations visually using NumPy.

##  What This Project Does

- Input 2×2 or 3×3 matrices manually or generate them randomly
- Perform key linear algebra operations: **Multiply**, **Transpose**, **Determinant**, **Inverse**
- Visualize results as interactive matrix grids
- See step-by-step breakdowns for matrix multiplication
- Clear error messages for invalid operations (e.g., singular matrices)

##  Project Structure

```
matrix-visualizer/
│
├── backend/
│   ├── main.py          # Test runner — calls operations and prints results
│   ├── operations.py    # Core NumPy functions for matrix math
│
├── frontend/
│   ├── index.html       # App layout and structure
│   ├── style.css        # Design system, variables, layout
│   ├── script.js        # Matrix input handling, UI logic, fetch calls
│
├── README.md
├── requirements.txt
```

##  Setup

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Run backend test

```bash
python backend/main.py
```

### 3. Open the frontend

Open `frontend/index.html` in your browser — no server needed for Version 1.

##  Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | HTML, CSS, Vanilla JS   |
| Backend  | Python + NumPy          |

##  Operations Implemented

| Operation        | Function                   | Description                        |
|-----------------|----------------------------|------------------------------------|
| Multiply         | `multiply_matrices(A, B)`  | A × B dot product                  |
| Transpose        | `transpose_matrix(A)`      | Flip rows and columns              |
| Determinant      | `determinant_matrix(A)`    | Scalar value det(A)                |
| Inverse          | `inverse_matrix(A)`        | A⁻¹ if det(A) ≠ 0, else error     |

##  Learning Goals

- Understand matrix operations conceptually, not just computationally
- See how NumPy abstracts complex math into clean Python functions
- Develop intuition through visual grid-based representations

##  Future Versions

- **Version 2**: Flask REST API backend + Fetch integration
- **Version 3**: React frontend with D3.js visualization
- **Version 4**: Step-by-step animation for row reduction (Gaussian elimination)
