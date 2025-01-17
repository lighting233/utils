import axios from 'axios';
import { showMessage, configureUI } from "./uiProvider";
import { startLoading, stopLoading } from './globalLoading';
import httpErrorStatusHandle from './handleError';
import { addPendingRquest, getRequestKey, removePendingRequest } from './handleRepeatRequest';

class StrongAxiosRequest {

  constructor(config) {
    // 添加默认配置
    const defaultConfig = {
      timeout: 10000,
      withCredentials: true,
      validateStatus: (status) => status >= 200 && status < 300,
    };

    this.instance = axios.create({ ...defaultConfig, ...config });
    this.showLoading = true; // 默认显示 Loading
    this.repeatRequestCancel = true; // 默认拦截重复请求
    this.abortControllers = new Map(); // 用于存储所有请求的 AbortController

    // 每个instance实例都添加拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 是否拦截重复请求
        if (this.repeatRequestCancel && config.repeatRequestCancel !== false) {
          addPendingRquest(this.abortControllers, config);
        }

        // 检查是否需要显示 Loading
        if (this.showLoading && config.showLoading !== false) {
          startLoading();
        }
        return config;
      },
      (err) => {
        return Promise.reject(err);
      }
    );

    this.instance.interceptors.response.use(
      (res) => {
        // 响应完成后关闭 Loading
        stopLoading();
        // 响应完成后移除请求
        removePendingRequest(this.abortControllers, res.config);
        return res.data;
      },
      (err) => {
        console.log("%c Line:50 🍯 封装的axios请求的err", "color:#7f2b82", err);
        // 响应完成后关闭 Loading
        stopLoading();
        // 响应完成后移除请求
        removePendingRequest(this.abortControllers, err.config);
        return Promise.reject(err);
      }
    );

    // 全局错误重试机制
    this.retryTimes = config.retryTimes || 2;
    this.retryDelay = config.retryDelay || 1000;

    // 请求超时自动重试
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        // 如果不是超时错误，或已经重试过，直接返回错误
        if (!error.message.includes('timeout') || config._retryCount >= this.retryTimes) {
          return Promise.reject(error);
        }

        // 设置重试计数
        config._retryCount = config._retryCount || 0;
        config._retryCount++;

        // 延迟重试
        const delay = new Promise((resolve) => {
          setTimeout(resolve, this.retryDelay);
        });

        await delay;
        return this.instance(config);
      }
    );

    // 针对特定的hyRequest实例添加拦截器
    this.instance.interceptors.request.use(
      config.interceptors?.requestSuccessFn,
      config.interceptors?.requestFailureFn
    );
    this.instance.interceptors.response.use(
      config.interceptors?.responseSuccessFn,
      config.interceptors?.responseFailureFn
    );
  };

  // 封装网络请求的方法
  request(config) {
    // 设置单次的拦截请求规则
    this.repeatRequestCancel = config.repeatRequestCancel !== false;
    // 设置单次请求的 Loading 显示规则
    this.showLoading = config.showLoading !== false;
    // 单次请求的成功拦截处理
    if (config.interceptors?.requestSuccessFn) {
      config = config.interceptors.requestSuccessFn(config);
    };

    return new Promise((resolve, reject) => {
      this.instance
        .request(config)
        .then((res) => {
          // 单词响应的成功拦截处理
          if (res?.code === 200) {
            if (config.interceptors?.responseSuccessFn) {
              res = config.interceptors.responseSuccessFn(res);
            }
          } else {
            if (config.interceptors?.responseFailureFn) {
              res = config.interceptors.responseFailureFn(res);
            };
            //针对业务接口成功，但是code不等于200的error
            if (config.showErrorMessage !== false) {
              showMessage({
                type: 'error',
                message: res.message,
              });
            }
          }
          resolve(res);
        })
        .catch((err) => {
          //针对接口调用报错与超时的error
          if (config.showGlobalErrorMessage !== false) {
            httpErrorStatusHandle(err);
          }
          reject(err);
        });
    });
  };

  get(config) {
    return this.request({ ...config, method: 'GET' });
  };
  getNoLoading(config) {
    return this.request({ ...config, method: 'GET', showLoading: false });
  };
  postNoLoading(config) {
    return this.request({ ...config, method: 'POST', showLoading: false });
  };
  post(config) {
    return this.request({ ...config, method: 'POST' });
  };
  delete(config) {
    return this.request({ ...config, method: 'DELETE' });
  };
  patch(config) {
    return this.request({ ...config, method: 'PATCH' });
  };

  // 文件上传方法
  upload(config) {
    const formData = new FormData();
    if (config.file) {
      formData.append(config.fileKey || 'file', config.file);
    }
    if (config.data) {
      Object.keys(config.data).forEach(key => {
        formData.append(key, config.data[key]);
      });
    }

    return this.request({
      ...config,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers
      }
    });
  }

  // 下载方法
  download(config) {
    return this.request({
      ...config,
      responseType: 'blob',
      showLoading: true
    });
  }

  // 取消单个请求
  cancelRequest(config) {
    const key = getRequestKey(config);
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    };
  };

  // 取消所有请求
  cancelAllRequests() {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  };

  static setupRequestUI(provider) {
    configureUI(provider);
  }

};

export default StrongAxiosRequest;
