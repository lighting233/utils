import { ref } from 'vue'

function usePageContent() {
  const contentRef = ref()
  function handleQueryClick(queryInfo) {
    contentRef.value?.fetchPageListData(queryInfo)
  }
  function handleResetClick(queryInfo) {
    contentRef.value?.fetchPageListData(queryInfo)
  }

  return {
    contentRef,
    handleQueryClick,
    handleResetClick
  }
}

export default usePageContent
