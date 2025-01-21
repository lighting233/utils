import { ref } from 'vue'

function usePageModal(
  newCallback,
  editCallback
) {
  const modalRef = ref()
  function handleNewClick() {
    modalRef.value?.setModalVisible()
    if (newCallback) newCallback()
  }
  function handleEditClick(itemData) {
    // 1.让modal显示出来
    modalRef.value?.setModalVisible(false, itemData)
    // 2.编辑的回调
    if (editCallback) editCallback(itemData)
  }

  return { modalRef, handleNewClick, handleEditClick }
}

export default usePageModal
