import { defineQuery, useQuery, useMutation, useQueryCache } from '@pinia/colada'
import { ref, computed, watch } from 'vue'
import { ElMessage } from "element-plus";

const queryCache = useQueryCache()

export const useDeleteItem = (deleteFn, pageName) => {
    if (!deleteFn) return { mutate: () => { } }
    return useMutation({
        mutation: (params) => {
            return deleteFn(pageName, params.id)
        },
        onSuccess: (data, vars, context) => {
            ElMessage({
                type: "success",
                message: "删除成功！",
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
                message: "删除失败！",
            });
        },
        onSettled: (data, error, params) => {
            params.callback && params.callback();
        },
    })
};

export const usePageListQuery = (requestFn) => {
    return defineQuery(() => {
        const pageName = ref('')
        const apiUrl = ref('')
        const pageNO = ref(1)
        const pageCount = ref(10)
        const params = ref({
            pageNO: 0,
            pageCount: 10
        })

        const currentList = ref([])
        const currentTotalCount = ref(0)


        const query = useQuery({
            key: () => [pageName.value, 'query-list'],
            query: async () => {
                const res = await requestFn(pageName.value, apiUrl.value, params.value)
                return res
            },
            refetchOnWindowFocus: false,
            staleTime: 0,
            enabled: false,
            refetchOnMount: false
        })

        watch(
            () => query.data.value,
            (newData) => {
                if (newData) {
                    currentList.value = newData.data
                    currentTotalCount.value = newData.rowSize
                }
            }
        )

        const pageList = computed(() => currentList.value)
        const totalCount = computed(() => currentTotalCount.value)

        // 设置页面名称
        const setPageName = (name, url) => {
            pageName.value = name
            apiUrl.value = url
        }

        // 更新分页参数
        const updatePagination = ({ pageNO: page, pageCount: size }) => {
            pageNO.value = page
            pageCount.value = size
            params.value = {
                ...params.value,
                pageNO: page,
                pageCount: size
            }
            query.refresh()
        }

        // 更新查询参数
        const updateSearchParams = (searchParams) => {
            params.value = {
                ...params.value,
                ...searchParams
            }
            query.refresh()
        }

        // 重置所有参数
        const reset = () => {
            pageNO.value = 1
            pageCount.value = 10
            params.value = {
                pageNO: 1,
                pageCount: 10
            }
            query.refresh()
        }

        // 监听查询缓存的变化 删除/批量删除/新增/编辑
        queryCache.$onAction(({ name, after, args }) => {
            after(() => {
                if (name === 'invalidateQueries') {
                    const [filters] = args
                    if (filters?.key?.[0] === pageName.value &&
                        filters?.key?.[1] === 'query-list' &&
                        filters?.exact === true) {
                        updatePagination({
                            pageNO: 1,
                            pageCount: pageCount.value
                        })
                    }
                }
            })
        })

        return {
            pageNO,
            pageCount,
            pageList,
            totalCount,
            loading: computed(() => query.asyncStatus.value === 'loading'),
            error: computed(() => query.error.value),
            setPageName,
            updatePagination,
            updateSearchParams,
            reset,
            refresh: query.refresh
        }
    })
}