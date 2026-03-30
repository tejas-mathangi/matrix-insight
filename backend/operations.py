"""
operations.py — Matrix Operations using NumPy
==============================================

This module contains reusable functions for core linear algebra operations.
All functions accept Python lists (2D arrays) as input and return results
as Python lists or floats — making them easy to serialize as JSON later.

Key concept: NumPy represents matrices as `ndarray` objects.
We convert from list → ndarray → list so this module stays flexible.
"""

import numpy as np


def multiply_matrices(A, B):
    """
    Multiply two matrices A and B using the dot product.

    The dot product of A (m×n) and B (n×p) gives a result of shape (m×p).
    Each element result[i][j] = sum of A[i][k] * B[k][j] for all k.

    Args:
        A (list[list[float]]): First matrix
        B (list[list[float]]): Second matrix

    Returns:
        dict: {
            "result": 2D list of floats,
            "steps": list of step strings explaining each calculation
        }

    Raises:
        ValueError: If inner dimensions don't match (A columns ≠ B rows)
    """
    # Convert Python lists to NumPy arrays for computation
    mat_A = np.array(A, dtype=float)
    mat_B = np.array(B, dtype=float)

    # Dimension check: A must have same number of columns as B has rows
    if mat_A.shape[1] != mat_B.shape[0]:
        raise ValueError(
            f"Cannot multiply: A is {mat_A.shape[0]}×{mat_A.shape[1]} "
            f"but B is {mat_B.shape[0]}×{mat_B.shape[1]}. "
            f"Inner dimensions must match."
        )

    # Perform the matrix multiplication
    result = np.dot(mat_A, mat_B)

    # Generate step-by-step explanation
    steps = []
    rows_A, cols_A = mat_A.shape
    rows_B, cols_B = mat_B.shape

    steps.append(f"Multiplying {rows_A}×{cols_A} matrix A with {rows_B}×{cols_B} matrix B")
    steps.append(f"Result will be a {rows_A}×{cols_B} matrix")
    steps.append("─" * 40)

    for i in range(rows_A):
        for j in range(cols_B):
            # Show what row × column calculation produces each cell
            terms = [f"({mat_A[i][k]:.2g} × {mat_B[k][j]:.2g})" for k in range(cols_A)]
            expression = " + ".join(terms)
            value = result[i][j]
            steps.append(f"Result[{i}][{j}] = {expression} = {value:.4g}")

    return {
        "result": result.tolist(),
        "steps": steps
    }


def transpose_matrix(A):
    """
    Compute the transpose of matrix A.

    Transposing flips rows and columns: element A[i][j] becomes A[j][i].
    A 2×3 matrix becomes a 3×2 matrix after transposing.

    Args:
        A (list[list[float]]): Input matrix

    Returns:
        dict: {"result": 2D list of floats}
    """
    mat_A = np.array(A, dtype=float)
    result = mat_A.T  # .T is NumPy shorthand for transpose

    return {
        "result": result.tolist()
    }


def determinant_matrix(A):
    """
    Compute the determinant of a square matrix A.

    The determinant is a scalar that encodes information about the matrix:
    - det(A) = 0  → matrix is singular (no inverse exists)
    - det(A) ≠ 0  → matrix is invertible
    - |det(A)|    → scale factor of the linear transformation

    Args:
        A (list[list[float]]): Square matrix (n×n)

    Returns:
        dict: {"result": float determinant value}

    Raises:
        ValueError: If matrix is not square
    """
    mat_A = np.array(A, dtype=float)

    # Determinant is only defined for square matrices
    rows, cols = mat_A.shape
    if rows != cols:
        raise ValueError(
            f"Determinant requires a square matrix, but got {rows}×{cols}."
        )

    det = np.linalg.det(mat_A)

    # Round near-zero to actual zero (floating point cleanup)
    if abs(det) < 1e-10:
        det = 0.0

    return {
        "result": round(det, 6)
    }


def inverse_matrix(A):
    """
    Compute the inverse of a square matrix A.

    The inverse A⁻¹ satisfies: A × A⁻¹ = I (identity matrix)
    This only exists when det(A) ≠ 0.

    Args:
        A (list[list[float]]): Square matrix (n×n)

    Returns:
        dict: {"result": 2D list of floats}

    Raises:
        ValueError: If matrix is singular (det = 0) or not square
    """
    mat_A = np.array(A, dtype=float)

    # Must be square
    rows, cols = mat_A.shape
    if rows != cols:
        raise ValueError(
            f"Inverse requires a square matrix, but got {rows}×{cols}."
        )

    # Check if singular: singular matrices have det = 0
    det = np.linalg.det(mat_A)
    if abs(det) < 1e-10:
        raise ValueError(
            f"Matrix is singular (det ≈ 0). Inverse does not exist."
        )

    # np.linalg.inv computes the matrix inverse
    result = np.linalg.inv(mat_A)

    # Clean up floating-point noise (tiny values near zero → 0)
    result = np.round(result, 6)

    return {
        "result": result.tolist()
    }
