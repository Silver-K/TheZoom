<script setup lang="ts">
import { shallowRef, onMounted, ref, computed, onUnmounted } from "vue";
import Img from "./assets/item.jpg";
import TheZoom from "./components/TheZoom.vue";
const canvasRef = shallowRef();
let ctx: CanvasRenderingContext2D;
const radio = 1080 / 1920;
const width = 1080 / window.devicePixelRatio;
const height = width / radio;
const widthCss = `${width}px`;
const heightCss = `${height}px`;
onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext("2d");
    const img = new Image();
    img.src = Img;
    img.onload = () => {
      canvasRef.value.width = img.naturalWidth;
      canvasRef.value.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0, canvasRef.value.width, canvasRef.value.height);
    };
  }
});
const currentScale = ref(1.5);
const scaleRatio = computed(() => `${Math.floor(currentScale.value * 100)}%`);
function scaleDown() {
  currentScale.value -= 0.01;
}
function scaleUp() {
  currentScale.value += 0.01;
}

function triggerDownload(url: string, name: string) {
  const anchor = document.createElement("a");
  document.body.appendChild(anchor);
  anchor.download = name;
  anchor.href = url;
  anchor.click();
  document.body.removeChild(anchor);
}
function handleClick() {
  if (!canvasRef.value) {
    return;
  }

  (canvasRef.value as HTMLCanvasElement).toBlob(
    (blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        triggerDownload(url, "data_zoom");
      }
    },
    "image/jpeg",
    0.85
  );
  // const dataUrl = (canvasRef.value as HTMLCanvasElement).toDataURL(
  //   "image/jpeg",
  //   0.85
  // );
}
</script>

<template>
  <div class="view-port">
    <TheZoom
      class="zoom-wrap"
      :min-scale="1"
      :max-scale="2"
      v-model:scale="currentScale"
    >
      <canvas ref="canvasRef" id="cvs"></canvas>
    </TheZoom>
    <div class="tool-bar">
      <div class="icon-minus tool-icon" @click="scaleDown"></div>
      <span class="scale-num">{{ scaleRatio }}</span>
      <div class="icon-plus tool-icon" @click="scaleUp"></div>
    </div>
  </div>
  <button class="the-btn" @click="handleClick">下载</button>
</template>

<style lang="scss" scoped>
#cvs {
  width: v-bind(widthCss);
  height: v-bind(heightCss);
}
.zoom-wrap {
  overflow: hidden;
}
.view-port {
  position: relative;
  display: inline-flex;
}
.tool-bar {
  position: absolute;
  right: 16px;
  top: 16px;
  padding: 3px 6px;
  border: 1px solid #2f2f2f;
  border-radius: 100px;
  background: rgba(32, 32, 32, 0.3);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #efefef;
}
.scale-num {
  display: inline-flex;
  justify-content: center;
  min-width: 40px;
  margin: 0 6px;
  user-select: none;
}
.tool-icon {
  --size: 16px;
  width: var(--size);
  height: var(--size);
  cursor: pointer;
  background: #2f2f2f;
  border-radius: 50%;
  border: 1px solid currentColor;
}
.icon-minus {
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    width: 8px;
    height: 1px;
    background: currentColor;
  }
}
.icon-plus {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 50%;
  border: 1px solid currentColor;
  &::before,
  &::after {
    content: "";
    width: 8px;
    height: 1px;
    background: currentColor;
  }
  &::after {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) rotate(90deg);
  }
}
.the-btn {
  margin-top: 12px;
  background: transparent;
  border: 1px solid currentColor;
  color: #098;
  outline: none;
  display: flex;
  justify-content: center;
  min-width: 88px;
  font-size: 16px;
  line-height: 24px;
  padding: 4px 16px;
  border-radius: 100px;
  user-select: none;
  cursor: pointer;
  &:active {
    background: #0a6;
    color: #efefef;
  }
}
</style>
