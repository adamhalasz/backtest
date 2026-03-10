let isInitialized = false;

export async function initSciChart() {
  isInitialized = true;
}

export const isSciChartInitialized = () => isInitialized;