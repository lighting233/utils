<template>
    <div class="content">
        <div class="header">
            <el-button v-if="isDelete && contentConfig?.header?.batchDelete" type="primary" @click="batchDeletePagList">
                批量删除
            </el-button>
            <el-button v-if="isCreate" type="primary" @click="handleNewUserClick">
                {{ contentConfig?.header?.btnTitle ?? "新建数据" }}
            </el-button>
        </div>
        <div class="table">
            <el-table ref="tableRef" :data="pageList" :row-key="rowKey" :default-sort="contentConfig.defaultSort"
                @selection-change="handleSelectionChange" @sort-change="handleSortChange" border style="width: 100%"
                v-bind="contentConfig.childrenTree" v-loading="loading">
                <template v-for="item in contentConfig.propsList" :key="item.prop">
                    <template v-if="item.type === 'timer'">
                        <el-table-column align="center" v-bind="item">
                            <template #default="scope">
                                {{ scope.row[item.prop] }}
                            </template>
                        </el-table-column>
                    </template>
                    <template v-else-if="item.type === 'handler'">
                        <el-table-column align="center" v-bind="item">
                            <template #default="scope">
                                <el-button v-if="isUpdate" size="small" icon="Edit" type="primary" text
                                    @click="handleEditBtnClick(scope.row)">
                                    编辑
                                </el-button>
                                <el-button v-if="isDelete" size="small" icon="Delete" type="danger" text
                                    @click="handleDeleteBtnClick(scope.row[rowKey])">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </template>
                    <template v-else-if="item.type === 'custom'">
                        <el-table-column align="center" v-bind="item">
                            <template #default="scope">
                                <slot :name="item.slotName" v-bind="scope" :prop="item.prop" hName="why"></slot>
                            </template>
                        </el-table-column>
                    </template>
                    <template v-else>
                        <el-table-column align="center" v-bind="item" />
                    </template>
                </template>
            </el-table>
        </div>
        <div class="pagination">
            <el-pagination v-model:current-page="pageNO" v-model:page-size="pageCount" :page-sizes="[10, 20, 30]"
                layout="total, sizes, prev, pager, next, jumper" :total="totalCount" @size-change="handleSizeChange"
                @current-change="handleCurrentChange"/>
        </div>
    </div>
</template>

<script setup lang="js" name="PageContentColada">
import { ref, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePageListQuery, useDeleteItem } from '../query/pageContentQuery';

const props = defineProps({
    contentConfig: {
        required: true,
        type: Object,
        default: () => ({
            pageName: "",
            rowKey: "",
            header: {
                title: "",
                btnTitle: "",
            },
            defaultSort: null,
            sortMap: {},
            propsList: [],
            pageListUrl: "",
            searchDefaultValues: {}
        }),
    },
    actions: {
        required: true,
        type: Object
    },
    usePermissions: {
        type: Function
    }
});

let cacheFormData = { ...props.contentConfig.searchDefaultValues };
let sort = {};

const formatSort = (prop, order) => {
    const { sortMap } = props.contentConfig;
    sort[sortMap.key] = prop;
    sort.order = order ? sortMap[order] : null;
}

if (props.contentConfig?.defaultSort) {
    const { prop, order } = props.contentConfig.defaultSort;
    formatSort(prop, order);
}
//每一行的主键id
const rowKey = computed(() => {
    return props.contentConfig.rowKey ? props.contentConfig.rowKey : "oid";
});

// 定义事件
const emit = defineEmits(["newClick", "editClick", "selectedList"]);

// 0.获取是否有对应的增删改查的权限
let isCreate = true;
let isDelete = true;
let isUpdate = true;
let isQuery = true;
if (typeof props.usePermissions === 'function') {
    isCreate = props.usePermissions(`${props.contentConfig.pageName}:create`)
    isDelete = props.usePermissions(`${props.contentConfig.pageName}:delete`)
    isUpdate = props.usePermissions(`${props.contentConfig.pageName}:update`)
    isQuery = props.usePermissions(`${props.contentConfig.pageName}:query`)
}

const tableRef = ref();
const selectedLists = ref([]);

// 1.获取List数据,进行展示
const usePageListQuery = usePageListQuery(props.actions.postPageListData)
const { mutate: deleteItem } = useDeleteItem(props.actions.deleteItem, props.contentConfig.pageName)
const {
    pageNO,
    pageCount,
    pageList,
    totalCount,
    loading,
    setPageName,
    updatePagination,
    updateSearchParams,
    reset
} = usePageListQuery()

//为请求添加页面名称与url
setPageName(props.contentConfig.pageName, props.contentConfig.pageListUrl)

fetchPageListData();
// 2.页码相关的逻辑
function handleSizeChange() {
      updatePagination({
        pageNO: pageNO.value,
        pageCount: pageCount.value
    })
}
function handleCurrentChange() {
      updatePagination({
        pageNO: pageNO.value,
        pageCount: pageCount.value
    })
}

// 3.定义函数, 用于发送网络请求,接收filter的查询参数
function fetchPageListData(formData) {
    if (!isQuery) return;

    if (formData && typeof formData === "object") {
        cacheFormData = formData;
    }
    // 2.发起网络请求
    const searchForm = { ...sort, ...cacheFormData };
    updateSearchParams(searchForm)
}

// 5.删除/新建/编辑的操作
function handleDeleteBtnClick(id) {
    selectedLists.value = [id];
    open();
}
function handleNewUserClick() {
    emit("newClick");
}
function handleEditBtnClick(itemData) {
    emit("editClick", itemData);
}

// 批量选择操作
function handleSelectionChange(rows = []) {
    selectedLists.value = rows;
    emit("selectedList", rows);
}

function batchDeletePagList() {
    if (selectedLists.value.length === 0) {
        ElMessage({
            message: "请选择要处理的数据",
            type: "warning",
            duration: 3 * 1000,
        });
        return;
    }
    open();
}

const open = () => {
    ElMessageBox({
        title: "提示",
        message: `确定进行${selectedLists.value.length > 1 ? "批量" : ""}删除吗?`,
        showCancelButton: true,
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        beforeClose: (action, instance, done) => {
            try {
                if (action === "confirm") {
                    instance.confirmButtonLoading = true;
                    instance.confirmButtonText = "处理中...";
                    const callback = () => {
                        selectedLists.value = [];
                        tableRef.value.clearSelection();
                        done();
                        setTimeout(() => {
                            instance.confirmButtonLoading = false;
                        }, 300);
                    };
                    deleteItem({ id: selectedLists.join(','), callback })
                } else {
                    done();
                }
            } catch (error) {
                done();
                ElMessage({
                    type: "error",
                    message: "删除失败！",
                });
            }
        },
    })
};

// 排序操作
function handleSortChange(data) {
    const { prop, order } = data;
    formatSort(prop, order);
    fetchPageListData();
}

// 6.暴露给外部执行的方法
defineExpose({ fetchPageListData, batchDeletePagList });
</script>

<style lang="scss" scoped>
.content {
    margin-top: 20px;
    padding: 20px;
    background-color: #fff;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 10px;

    .title {
        font-size: 22px;
    }
}

.table {
    :deep(.el-table__cell) {
        padding: 12px 0;
    }

    .el-button {
        margin-left: 0;
        padding: 5px 8px;
    }
}

.pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
}
</style>