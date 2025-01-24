import { useMutation, useQueryCache } from '@pinia/colada'
import { ElMessage } from "element-plus";

const queryCache = useQueryCache()

export const useModalQuery = (type) => {
    const modalQuery = (func, pageName) => {
        if (!func) return { mutate: () => { } }
        return useMutation({
            mutation: (params) => {
                return func(pageName, params.data)
            },
            onSuccess: (data, vars, context) => {
                ElMessage({
                    type: "success",
                    message: `${type}成功！`,
                });
                //给缓存失效一个比‘[pageName, 'query-list']’类型小的key，因为这样不会触发重新的请求，
                //因为删除，批量删除，新增等操作后页码会重置为1，而store的$onAction为异步操作，在invalidateQueries缓存失效时，
                //发出的请求为同步的，异步修改pageNo后再发请求会重复请求
                queryCache.invalidateQueries({
                    key: [pageName, 'query-list', 'refresh'],
                    exact: true //精准匹配
                })
            },
            onError: (error, variables, { previousTodos }) => {
                ElMessage({
                    type: "error",
                    message: `${type}失败！`,
                });
            },
            onSettled: (data, error, params) => {
                params.callback && params.callback();
            },
        })
    };
    return modalQuery;
}