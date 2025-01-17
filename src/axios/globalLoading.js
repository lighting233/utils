import { showLoading } from './uiProvider';

let loadingInstance = null;
let loadingCount = 0;

export const startLoading = () => {
  if (loadingCount === 0 && !loadingInstance) {
    loadingInstance = showLoading({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
    });
  }
  loadingCount++;
};

export const stopLoading = () => {
  if (loadingCount > 0) {
    loadingCount--;
  }
  if (loadingCount === 0 && loadingInstance) {
    loadingInstance.close();
    loadingInstance = null;
  }
};
