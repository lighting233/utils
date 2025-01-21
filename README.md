# utils

## axios

```js
import StrongAxiosRequest from './axios/request';
import { Storage as storage } from "@/utils/storage.js";
import { ElMessage, ElLoading } from 'element-plus';

let BASE_URL = ''
if (import.meta.env.PROD) {
    // 生产环境
    BASE_URL = 'http://xxxxxxxx:4000'
} else {
    // 开发环境
    //   BASE_URL = CONFIG_g.VUE_APP_CAN
    BASE_URL = 'http://127.0.0.1:4523/m1/5662758-5343321-default/'
};
	
const TIME_OUT = 10000;


StrongAxiosRequest.setupRequestUI({ showMessage: ElMessage, showLoading: ElLoading.service });

const tkRequest = new StrongAxiosRequest({
  baseURL: BASE_URL,
  timeout: TIME_OUT,
  repeatRequestCancel: false,
  showLoading: false,
  interceptors: {
    requestSuccessFn: (config) => {
      const loginInfo = JSON.parse(storage.localStorageGet("loginInfo"));
      const token = loginInfo.authToken;
      if (config.headers && token) {
        config.headers.authtoken = token
      }
      return config
    }
  }
});

function postUsersListData(queryInfo) {
  return tkRequest.post({
    url: '/users/list',
    data: queryInfo
  })
}
```

## components
