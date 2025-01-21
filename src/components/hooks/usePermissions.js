//作为插件注册
export default function setupUseLoginStoreForPermissions(useLoginStore) {
  return function usePermissions(permissionID) {
    const loginStore = useLoginStore()
    const { permissions = [] } = loginStore;
    //todo
    if(permissions.length === 0) return true;
    return !!permissions.find((item) => item.includes(permissionID))
  }
}

