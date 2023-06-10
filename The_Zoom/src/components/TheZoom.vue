<script setup lang="ts">
import { TouchState, useTouch } from "../composables/useTouch";
import {
  makeTransformMatrix,
  resolveTransformMatrix,
  matrixTimes,
} from "../composables/useMatrix";
import { shallowRef, ref, watch, computed, onMounted } from "vue";
interface ZoomPropT {
  minScale?: number;
  maxScale?: number;
  scale?: number;
}
const props = withDefaults(defineProps<ZoomPropT>(), {
  minScale: 0.6,
  maxScale: 2,
  scale: 1,
});
interface EmitsT {
  (event: "update:scale", value: number): void;
}
const emits = defineEmits<EmitsT>();

const zoomRef = shallowRef();
const {
  changeX,
  changeY,
  changeScale,
  lastOrigin,
  changeOriginX,
  changeOriginY,
  start,
  move,
  currentState,
} = useTouch();
const zeroX = ref(0);
const zeroY = ref(0);
const bounding = {
  min: {
    x: 0,
    y: 0,
    x1: 0,
    y1: 0,
  },
  x: 0,
  y: 0,
  x1: 0,
  y1: 0,
  width: 0,
  height: 0,
  centerX: 0,
  centerY: 0,
};

const matrix = ref([1, 0, 0, 1, 0, 0]);
watch(matrix, (m) => {
  emits("update:scale", m[0]);
});
watch(
  () => props.scale,
  (scl) => {
    if (props.scale === matrix.value[0]) {
      return;
    }
    matrix.value = toScale(matrix.value, scl / matrix.value[0], {
      x: bounding.centerX,
      y: bounding.centerY,
    });
  }
);
const transformStyle = computed(() => `matrix(${matrix.value.join()})`);
watch(transformStyle, (style) => {
  setTransformStyle(style);
});
let setTransformStyle: (s: string) => void = (style: string) => {
  style;
  return;
};

const minBeyond = {
  left: false,
  right: false,
  top: false,
  bottom: false,
};
function resetBeyond(by: {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}) {
  by.left = false;
  by.right = false;
  by.top = false;
  by.bottom = false;
}
function limitMatrix(matrix: number[], oldMatrix: number[]) {
  resetBeyond(minBeyond);

  const nx = Number((0 * matrix[0] + matrix[4]).toFixed(3));
  const ny = Number((0 * matrix[0] + matrix[5]).toFixed(3));
  if (nx > bounding.min.x) {
    minBeyond.left = true;
  }
  if (ny > bounding.min.y) {
    minBeyond.top = true;
  }

  const nx1 = Number((bounding.width * matrix[0] + matrix[4]).toFixed(3));
  const ny1 = Number((bounding.height * matrix[0] + matrix[5]).toFixed(3));
  if (nx1 < bounding.min.x1) {
    minBeyond.right = true;
  }
  if (ny1 < bounding.min.y1) {
    minBeyond.bottom = true;
  }

  if (minBeyond.left && minBeyond.right) {
    matrix[0] = oldMatrix[0];
    matrix[3] = oldMatrix[3];
    matrix[4] = oldMatrix[4];
    matrix[5] = oldMatrix[5];
  } else if (minBeyond.left) {
    matrix[4] = bounding.min.x - 0 * matrix[0];
  } else if (minBeyond.right) {
    matrix[4] = bounding.min.x1 - bounding.width * matrix[0];
  }

  if (
    (minBeyond.top && minBeyond.bottom) ||
    matrix[0] > props.maxScale ||
    matrix[0] < props.minScale
  ) {
    matrix[0] = oldMatrix[0];
    matrix[3] = oldMatrix[3];
    matrix[4] = oldMatrix[4];
    matrix[5] = oldMatrix[5];
  } else if (minBeyond.top) {
    matrix[5] = bounding.min.y - 0 * matrix[0];
  } else if (minBeyond.bottom) {
    matrix[5] = bounding.min.y1 - bounding.height * matrix[0];
  }

  return matrix.map((item) => Number(item.toFixed(3)));
}
function toScale(
  state: number[],
  value: number,
  origin: { x: number; y: number }
) {
  let s = value;
  if (value * state[0] < props.minScale) {
    s = props.minScale / state[0];
  } else if (value * state[0] > props.maxScale) {
    s = props.maxScale / state[0];
  }

  const ox = origin.x - zeroX.value;
  const oy = origin.y - zeroY.value;
  const tx = ox - ox * s;
  const ty = oy - oy * s;

  const newMatrix = resolveTransformMatrix(
    matrixTimes(
      makeTransformMatrix([s, 0, 0, s, tx, ty]),
      makeTransformMatrix(state)
    )
  ).map((item) => Number(item.toFixed(3)));
  return limitMatrix(newMatrix, state);
}
let setWillChange: (opt: "add" | "remove") => void = () => {};
let isTouched = false;
function onStart(evt: Event) {
  start(evt);
  isTouched = true;
  setWillChange("add");
}
function onMove(evt: Event) {
  if (!isTouched) {
    return;
  }
  move(evt);
  let newMatrix = [...matrix.value];
  if (TouchState.SINGLE === currentState.value) {
    newMatrix[4] += changeX.value[0];
    newMatrix[5] += changeY.value[0];
    matrix.value = limitMatrix(newMatrix, matrix.value);
  } else {
    if (Math.abs(changeScale.value - 1) < 0.01) {
      // 认为是移动
      newMatrix[4] += changeOriginX.value;
      newMatrix[5] += changeOriginY.value;
      matrix.value = limitMatrix(newMatrix, matrix.value);
    } else {
      // 缩放
      matrix.value = toScale(matrix.value, changeScale.value, lastOrigin.value);
    }
  }
}
function onEnd() {
  isTouched = false;
  setWillChange("remove");
}
function onWheel(evt: WheelEvent) {
  evt.preventDefault();
  const { deltaY, clientX, clientY } = evt;
  let scaleNum = 1;
  if (deltaY > 0) {
    scaleNum = 0.99;
  } else {
    scaleNum = 1 / 0.99;
  }

  matrix.value = toScale(matrix.value, scaleNum, {
    x: clientX,
    y: clientY,
  });
}

function setCoordinate(el: HTMLElement) {
  const { x, y, width, height } = el.getBoundingClientRect();
  zeroX.value = x;
  zeroY.value = y;
  const centerX = (x + width + x) / 2;
  const centerY = (y + height + y) / 2;
  bounding.centerX = Number(centerX.toFixed(3));
  bounding.centerY = Number(centerY.toFixed(3));
  bounding.x = Number(x.toFixed(3));
  bounding.y = Number(y.toFixed(3));
  bounding.x1 = Number((x + width).toFixed(3));
  bounding.y1 = Number((y + height).toFixed(3));
  bounding.width = width;
  bounding.height = height;

  bounding.min.x = Number(
    (centerX - x - (centerX - x) * props.minScale).toFixed(3)
  );
  bounding.min.y = Number(
    (centerY - y - (centerY - y) * props.minScale).toFixed(3)
  );
  bounding.min.x1 = Number(
    ((x + width - centerX) * props.minScale + centerX - x).toFixed(3)
  );
  bounding.min.y1 = Number(
    ((y + height - centerY) * props.minScale + centerY - y).toFixed(3)
  );
}
function bindEventListener(el: HTMLElement) {
  el.addEventListener("touchstart", onStart);
  el.addEventListener("mousedown", onStart);
  el.addEventListener("touchmove", onMove);
  el.addEventListener("mousemove", onMove);
  el.addEventListener("touchend", onEnd);
  el.addEventListener("mouseup", onEnd);
  el.addEventListener("mouseleave", onEnd);
  el.addEventListener("wheel", onWheel);
}
function initScale() {
  matrix.value = toScale(matrix.value, props.scale, {
    x: bounding.centerX,
    y: bounding.centerY,
  });
  setTransformStyle(transformStyle.value);
}
onMounted(() => {
  if (zoomRef.value) {
    const mo = new MutationObserver(() => {
      const child = zoomRef.value.children[0] as HTMLElement;
      child.style.transformOrigin = "0 0";
      setTransformStyle = (style) => {
        child.style.transform = style;
      };
      setWillChange = (opt: "add" | "remove") => {
        child.classList[opt]("will-change");
      };
      bindEventListener(child);
      setCoordinate(child);
      initScale();
      mo.disconnect();
    });
    mo.observe(zoomRef.value, {
      subtree: true,
      childList: true,
      attributes: true,
    });
    zoomRef.value.children[0].setAttribute("data-zoom", "true");
  }
});
</script>

<template>
  <div ref="zoomRef" class="the-zoom">
    <slot></slot>
  </div>
</template>

<style lang="scss">
.the-zoom {
  display: inline-flex;
}
.will-change {
  will-change: transform;
}
</style>
