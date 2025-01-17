// 移除还没开始的重复请求或添加到记录
export function addPendingRquest(abortControllers, config) {
    const controller = new AbortController();
    config.signal = controller.signal;
    const key = getRequestKey(config);
    if (abortControllers.get(key)) {
        controller.abort();
    } else {
        abortControllers.set(key, controller);
    }
}
// 生成请求的唯一标识，用于区分请求
export function getRequestKey(config) {
    const { url, method, params, data } = config;
    const paramsString = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    const dataString = formatRepeatMessage(data);
    return [url, method, paramsString, dataString].join('&');
}

export function formatRepeatMessage(data) {
    const strData = typeof data === 'string' ? data : JSON.stringify(data);
    // 更精确地处理 params 和 data，确保 JSON 序列化唯一性
    return data ? JSON.stringify(strData, Object.keys(strData).sort()) : '';
}

// 移除已记录的请求
export function removePendingRequest(abortControllers, config) {
    const key = getRequestKey(config);
    if (abortControllers.has(key)) {
        abortControllers.delete(key);
    };
}