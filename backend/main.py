"""
main.py — Backend Test Runner
==============================

This file tests all operations defined in operations.py.
In Version 2, this will be replaced by a Flask app that exposes
these functions as REST API endpoints.

Run this file directly:
    python backend/main.py

You should see clean output for each operation.
"""

# We import our own module — Python looks for it relative to where you run the script
from operations import (
    multiply_matrices,
    transpose_matrix,
    determinant_matrix,
    inverse_matrix
)


def print_matrix(label, matrix):
    """Helper to pretty-print a 2D list as a matrix grid."""
    print(f"\n{label}:")
    for row in matrix:
        # Format each value with consistent width for alignment
        print("  [ " + "  ".join(f"{val:8.4g}" for val in row) + " ]")


def print_separator(title):
    """Print a section divider for readability."""
    print(f"\n{'=' * 50}")
    print(f"  {title}")
    print("=" * 50)


# ─────────────────────────────────────────────
# Test Data
# ─────────────────────────────────────────────
A = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

B = [
    [9, 8, 7],
    [6, 5, 4],
    [3, 2, 1]
]

# An invertible matrix (det ≠ 0)
C = [
    [2, 1, 0],
    [1, 3, 1],
    [0, 1, 2]
]

# A singular matrix (det = 0, no inverse)
SINGULAR = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]  # Row 3 = Row1 + Row2 scaled, so det = 0
]


# ─────────────────────────────────────────────
# Test 1: Matrix Multiplication
# ─────────────────────────────────────────────
print_separator("TEST 1: Matrix Multiplication (A × B)")
try:
    output = multiply_matrices(A, B)
    print_matrix("Matrix A", A)
    print_matrix("Matrix B", B)
    print_matrix("Result A × B", output["result"])
    print("\nStep-by-Step:")
    for step in output["steps"]:
        print(f"  {step}")
except ValueError as e:
    print(f"  ERROR: {e}")


# ─────────────────────────────────────────────
# Test 2: Transpose
# ─────────────────────────────────────────────
print_separator("TEST 2: Transpose of A")
try:
    output = transpose_matrix(A)
    print_matrix("Matrix A", A)
    print_matrix("Transpose A^T", output["result"])
except ValueError as e:
    print(f"  ERROR: {e}")


# ─────────────────────────────────────────────
# Test 3: Determinant (invertible matrix)
# ─────────────────────────────────────────────
print_separator("TEST 3: Determinant of C (invertible)")
try:
    output = determinant_matrix(C)
    print_matrix("Matrix C", C)
    print(f"\n  det(C) = {output['result']}")
except ValueError as e:
    print(f"  ERROR: {e}")


# ─────────────────────────────────────────────
# Test 4: Determinant (singular matrix)
# ─────────────────────────────────────────────
print_separator("TEST 4: Determinant of SINGULAR matrix")
try:
    output = determinant_matrix(SINGULAR)
    print_matrix("Singular Matrix", SINGULAR)
    print(f"\n  det = {output['result']} (→ this matrix has no inverse)")
except ValueError as e:
    print(f"  ERROR: {e}")


# ─────────────────────────────────────────────
# Test 5: Inverse (invertible matrix)
# ─────────────────────────────────────────────
print_separator("TEST 5: Inverse of C")
try:
    output = inverse_matrix(C)
    print_matrix("Matrix C", C)
    print_matrix("Inverse C⁻¹", output["result"])
except ValueError as e:
    print(f"  ERROR: {e}")


# ─────────────────────────────────────────────
# Test 6: Inverse (singular matrix — should error)
# ─────────────────────────────────────────────
print_separator("TEST 6: Inverse of SINGULAR matrix (expect error)")
try:
    output = inverse_matrix(SINGULAR)
    print_matrix("Result", output["result"])
except ValueError as e:
    print(f"  ERROR (expected): {e}")


print("\n" + "=" * 50)
print("  All tests complete!")
print("=" * 50 + "\n")
