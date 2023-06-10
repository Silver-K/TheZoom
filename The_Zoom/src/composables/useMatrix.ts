interface Matrix {
  row: number,
  col: number,
  value: number[][],
}
export function matrixTimes(...params: Matrix[]) {
  return params.reduce((acc, matrix) => {
    const { row: r1, col: c1, value: v1 } = acc;
    const { row: r2, col: c2, value: v2 } = matrix;
    if (c1 === r2) {
      const res: number[][] = [];
      for (let i = 0; i < r1; i++) {
        res[i] = [];
        for (let j = 0; j < c2; j++) {
          res[i][j] = 0;
          for (let k = 0; k < c1; k++) {
            res[i][j] += v1[i][k] * v2[k][j];
          }
        }
      }
      return {
        row: r1,
        col: c2,
        value: res,
      };
    } else {
      throw new Error('不符合矩阵运算规则')
    }
  });
}

export function makeMatrix(arr: number[], row: number, col: number) {
  const res: Matrix = {
    row,
    col,
    value: [],
  }
  for (let i = 0; i < row; i++) {
    res.value[i] = [];
  }
  arr.forEach((item, index) => {
    res.value[index % row][Math.floor(index / row)] = item;
  });
  return res;
}

export function makeTransformMatrix(arr: number[]) {
  const narr = [...arr];
  narr.splice(6, 0, 1);
  narr.splice(4, 0, 0);
  narr.splice(2, 0, 0);
  return makeMatrix(narr, 3, 3);
}

export function resolveTransformMatrix(m: Matrix) {
  return [m.value[0][0], m.value[1][0], m.value[0][1], m.value[1][1], m.value[0][2], m.value[1][2]];
}