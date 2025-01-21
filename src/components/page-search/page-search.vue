<template>
  <div
    class="search"
    v-if="isQuery"
  >
    <!-- 1.输入搜索关键字的表单 -->
    <el-form
      :model="searchForm"
      ref="formRef"
      :label-width="searchConfig.labelWidth ?? '80px'"
      size="large"
    >
      <el-row :gutter="20">
        <template
          v-for="item in searchConfig.formItems"
          :key="item.prop"
        >
          <el-col :span="8">
            <el-form-item
              :label="item.label"
              :prop="item.prop"
            >
              <template v-if="item.type === 'input'">
                <el-input
                  v-model="searchForm[item.prop]"
                  :placeholder="item.placeholder"
                />
              </template>
              <template v-if="item.type === 'date-picker'">
                <el-date-picker
                  v-model="searchForm[item.prop]"
                  type="daterange"
                  range-separator="-"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                />
              </template>
              <template v-if="item.type === 'select'">
                <el-select
                  v-model="searchForm[item.prop]"
                  :placeholder="item.placeholder"
                  style="width: 100%"
                >
                  <template
                    v-for="option in item.options"
                    :key="option.value"
                  >
                    <el-option
                      :label="option.label"
                      :value="option.value"
                    />
                  </template>
                </el-select>
              </template>
            </el-form-item>
          </el-col>
        </template>
      </el-row>
    </el-form>

    <!-- 2.重置和搜索的按钮 -->
    <div class="btns">
      <el-button
        icon="Refresh"
        @click="handleResetClick"
        >重置</el-button
      >
      <el-button
        icon="Search"
        type="primary"
        @click="handleQueryClick"
        >查询</el-button
      >
    </div>
  </div>
</template>

<script setup lang="js">
import { reactive, ref } from "vue";

const emit = defineEmits(["queryClick", "resetClick", "update:searchValue"]);
const props = defineProps({
  searchConfig: {
    type: Object,
  },
  usePermissions: {
    type: Function
  }
});

// 修改权限检查的调用
let isQuery = true;
if (typeof props.usePermissions === 'function') {
  isQuery = props.usePermissions(`${props.searchConfig.pageName}:query`);
}


// 定义form的数据
const initialForm = {};
for (const item of props.searchConfig.formItems) {
  initialForm[item.prop] = item.initialValue ?? "";
}
const searchForm = reactive(initialForm);

// 重置操作
const formRef = ref();
function handleResetClick() {
  // 1.form中的数据全部重置为初始值
  formRef.value?.resetFields();
  // 2.将事件出去, content内部重新发送网络请求
  emit("resetClick", searchForm);
}

function handleQueryClick() {
  emit("queryClick", searchForm);
}

watch(
  () => searchForm,
  (val) => {
    console.log("%c Line:119 🍊 val", "color:#4fff4B", val);
    emit("update:searchValue", val);
  },
  { deep: true },
);

// 暴露的属性和方法
defineExpose({ searchForm })
</script>

<style lang="scss" scoped>
.search {
  background-color: #fff;
  padding: 20px;

  .el-form-item {
    padding: 20px 30px;
    margin-bottom: 0;
  }

  .btns {
    text-align: right;
    padding: 0 50px 10px 0;

    .el-button {
      height: 36px;
    }
  }
}
</style>
