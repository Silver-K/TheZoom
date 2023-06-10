import { ref } from "vue";
export const enum TouchState {
  SINGLE,
  DOUBLE,
};
interface Coordinate {
  x: number,
  y: number,
}

function getDistance(point1: Coordinate, point2: Coordinate) {
  return Math.hypot(point1.x - point2.x, point1.y - point2.y);
}
function getScale(dis1: number, dis2: number) {
  return Number((dis1 / dis2).toFixed(4));
}

export function useTouch() {
  const currentState = ref<TouchState>(TouchState.SINGLE);
  const startPoints = ref<[Coordinate, Coordinate]>([
    {
      x: 0,
      y: 0,
    },
    {
      x: 0,
      y: 0,
    }
  ]);
  const lastPoints = ref<[Coordinate, Coordinate]>([
    {
      x: 0,
      y: 0,
    },
    {
      x: 0,
      y: 0,
    }
  ]);
  const changeX = ref<[number, number]>([0, 0]);
  const changeY = ref<[number, number]>([0, 0]);
  const startOrigin = ref<Coordinate>({
    x: 0,
    y: 0,
  });
  const lastOrigin = ref<Coordinate>({
    x: 0,
    y: 0,
  });
  const changeOriginX = ref(0);
  const changeOriginY = ref(0);
  const startDistance = ref(0);
  const lastDistance = ref(0);
  const scale = ref(1);
  const changeScale = ref(1);

  const reset = () => {
    lastPoints.value = [
      {
        x: 0,
        y: 0,
      },
      {
        x: 0,
        y: 0,
      }
    ];
    scale.value = 1;
    changeScale.value = 1;
    changeX.value[0] = 0;
    changeY.value[0] = 0;
    currentState.value = TouchState.SINGLE;
  };

  const start = ((event: TouchEvent | MouseEvent) => {
    if (event instanceof MouseEvent) {
      reset();
      const { clientX, clientY } = event;
      startPoints.value[0].x = clientX;
      startPoints.value[0].y = clientY;
      lastPoints.value[0] = {
        x: clientX,
        y: clientY,
      }
    } else {
      const { touches } = event;
      if (1 === touches.length) {
        reset();
        const [point] = touches;
        startPoints.value[0].x = point.clientX < 0 ? point.clientX * -1 : point.clientX;
        startPoints.value[0].y = point.clientY;
        lastPoints.value[0] = { ...startPoints.value[0] };
      } else if (2 === touches.length) {
        currentState.value = TouchState.DOUBLE;
        const [point1, point2] = touches;
        startPoints.value[0] = {
          x: point1.clientX < 0 ? point1.clientX * -1 : point1.clientX,
          y: point1.clientY,
        }
        startPoints.value[1] = {
          x: point2.clientX < 0 ? point2.clientX * -1 : point2.clientX,
          y: point2.clientY,
        }
        lastPoints.value[0] = { ...startPoints.value[0] };
        lastPoints.value[1] = { ...startPoints.value[1] };
        startOrigin.value.x = (startPoints.value[0].x + startPoints.value[1].x) / 2;
        startOrigin.value.y = (startPoints.value[0].y + startPoints.value[1].y) / 2;
        lastOrigin.value = { ...startOrigin.value };
        startDistance.value = getDistance(startPoints.value[0], startPoints.value[1]);
        lastDistance.value = startDistance.value;
      }
    }
  }) as EventListener;

  const move = ((event: TouchEvent | MouseEvent) => {
    if (event instanceof MouseEvent) {
      const { clientX, clientY } = event;
      changeX.value[0] = clientX - lastPoints.value[0].x;
      changeY.value[0] = clientY - lastPoints.value[0].y;
      lastPoints.value[0].x = clientX;
      lastPoints.value[0].y = clientY;
    } else {
      if (TouchState.SINGLE === currentState.value) {
        const { touches } = event;
        const [point] = touches;
        changeX.value[0] = point.clientX < 0 ? point.clientX * -1 : point.clientX - lastPoints.value[0].x;
        changeY.value[0] = point.clientY - lastPoints.value[0].y;
        lastPoints.value[0].x = point.clientX < 0 ? point.clientX * -1 : point.clientX;
        lastPoints.value[0].y = point.clientY;
      } else {
        const { touches } = event;
        const [point1, point2] = touches;
        changeX.value[0] = point1.clientX < 0 ? point1.clientX * -1 : point1.clientX - lastPoints.value[0].x;
        changeY.value[0] = point1.clientY - lastPoints.value[0].y;
        lastPoints.value[0].x = point1.clientX < 0 ? point1.clientX * -1 : point1.clientX;
        lastPoints.value[0].y = point1.clientY;

        changeX.value[1] = point2.clientX < 0 ? point2.clientX * -1 : point2.clientX - lastPoints.value[1].x;
        changeY.value[1] = point2.clientY - lastPoints.value[1].y;
        lastPoints.value[1].x = point2.clientX < 0 ? point2.clientX * -1 : point2.clientX;
        lastPoints.value[1].y = point2.clientY;
        changeOriginX.value = (lastPoints.value[0].x + lastPoints.value[1].x) / 2 - lastOrigin.value.x;
        changeOriginY.value = (lastPoints.value[0].y + lastPoints.value[1].y) / 2 - lastOrigin.value.y;
        lastOrigin.value.x = (lastPoints.value[0].x + lastPoints.value[1].x) / 2;
        lastOrigin.value.y = (lastPoints.value[0].y + lastPoints.value[1].y) / 2;

        const distance = getDistance(lastPoints.value[0], lastPoints.value[1]);
        changeScale.value = getScale(distance, lastDistance.value);
        scale.value = getScale(distance, startDistance.value);
        lastDistance.value = distance;
      }
    }
  }) as EventListener;

  return {
    move,
    start,
    reset,
    changeX,
    changeY,
    changeOriginX,
    changeOriginY,
    scale,
    changeScale,
    currentState,
    startPoints,
    lastPoints,
    startOrigin,
    lastOrigin,
  };
}