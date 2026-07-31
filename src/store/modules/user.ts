/**
 * 管理员状态管理模块
 *
 * 提供管理后台登录用户（管理员）的状态管理
 *
 * ## 主要功能
 *
 * - 管理员登录状态管理
 * - 管理员信息存储（与 C 端普通用户区分）
 * - 访问令牌管理
 * - 语言设置
 * - 搜索历史记录
 * - 锁屏状态和密码管理
 * - 登出清理逻辑
 *
 * @module store/modules/user
 */
import { fetchLogout } from '@/api/auth'
import { LanguageEnum } from '@/enums/appEnum'
import { router } from '@/router'
import { resetRouterState } from '@/router/guards/beforeEach'
import { AppRouteRecord } from '@/types/router'
import { setPageTitle } from '@/utils/router'
import { StorageConfig } from '@/utils/storage/storage-config'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useMenuStore } from './menu'
import { useSettingStore } from './setting'
import { useWorktabStore } from './worktab'

/**
 * 管理员状态管理
 * 管理后台登录状态、管理员信息、语言设置、搜索历史、锁屏状态等
 */
export const useUserStore = defineStore(
  'userStore',
  () => {
    // 语言设置
    const language = ref(LanguageEnum.ZH)
    // 登录状态
    const isLogin = ref(false)
    // 锁屏状态
    const isLock = ref(false)
    // 锁屏密码
    const lockPassword = ref('')
    // 管理员信息（登录后台的管理员）
    const adminInfo = ref<Partial<Api.Auth.UserInfo>>({})
    // 搜索历史记录
    const searchHistory = ref<AppRouteRecord[]>([])
    // 访问令牌
    const accessToken = ref('')
    // 刷新令牌（后端暂不返回，保留字段）
    const refreshToken = ref('')

    // 计算属性：获取管理员信息
    const getAdminInfo = computed(() => adminInfo.value)
    // 计算属性：获取设置状态
    const getSettingState = computed(() => useSettingStore().$state)
    // 计算属性：获取工作台状态
    const getWorktabState = computed(() => useWorktabStore().$state)

    /**
     * 设置管理员信息
     * @param newInfo 新的管理员信息
     */
    const setAdminInfo = (newInfo: Api.Auth.UserInfo) => {
      adminInfo.value = newInfo
    }

    /**
     * 设置登录状态
     * @param status 登录状态
     */
    const setLoginStatus = (status: boolean) => {
      isLogin.value = status
    }

    /**
     * 设置语言
     * @param lang 语言枚举值
     */
    const setLanguage = (lang: LanguageEnum) => {
      setPageTitle(router.currentRoute.value)
      language.value = lang
    }

    /**
     * 设置搜索历史
     * @param list 搜索历史列表
     */
    const setSearchHistory = (list: AppRouteRecord[]) => {
      searchHistory.value = list
    }

    /**
     * 设置锁屏状态
     * @param status 锁屏状态
     */
    const setLockStatus = (status: boolean) => {
      isLock.value = status
    }

    /**
     * 设置锁屏密码
     * @param password 锁屏密码
     */
    const setLockPassword = (password: string) => {
      lockPassword.value = password
    }

    /**
     * 设置令牌
     * @param newAccessToken 访问令牌
     */
    const setToken = (newAccessToken: string) => {
      accessToken.value = newAccessToken
    }

    /**
     * 退出登录
     * 通知后端吊销 token，清空所有管理员状态并跳转到登录页
     */
    const logOut = async () => {
      // 通知后端吊销当前 token（忽略失败，本地始终清理）
      try {
        if (accessToken.value) {
          await fetchLogout()
        }
      } catch {
        // 后端登出失败不影响本地清理
      }

      // 保存当前管理员 ID，用于下次登录时判断是否为同一管理员
      const currentAdminId = adminInfo.value.user_id
      if (currentAdminId) {
        localStorage.setItem(StorageConfig.LAST_USER_ID_KEY, String(currentAdminId))
      }

      // 清空管理员信息
      adminInfo.value = {}
      // 重置登录状态
      isLogin.value = false
      // 重置锁屏状态
      isLock.value = false
      // 清空锁屏密码
      lockPassword.value = ''
      // 清空访问令牌
      accessToken.value = ''
      // 清空刷新令牌
      refreshToken.value = ''
      // 移除iframe路由缓存
      sessionStorage.removeItem('iframeRoutes')
      // 清空主页路径
      useMenuStore().setHomePath('')
      // 重置路由状态
      resetRouterState(500)
      // 跳转到登录页，携带当前路由作为 redirect 参数
      const currentRoute = router.currentRoute.value
      const redirect = currentRoute.path !== '/login' ? currentRoute.fullPath : undefined
      router.push({
        name: 'Login',
        query: redirect ? { redirect } : undefined
      })
    }

    /**
     * 检查并清理工作台标签页
     * 如果不是同一管理员登录，清空工作台标签页
     * 应在登录成功后调用
     */
    const checkAndClearWorktabs = () => {
      const lastAdminId = localStorage.getItem(StorageConfig.LAST_USER_ID_KEY)
      const currentAdminId = adminInfo.value.user_id

      // 无法获取当前管理员 ID，跳过检查
      if (!currentAdminId) return

      // 首次登录或缓存已清除，保留现有标签页
      if (!lastAdminId) {
        return
      }

      // 不同管理员登录，清空工作台标签页
      if (String(currentAdminId) !== lastAdminId) {
        const worktabStore = useWorktabStore()
        worktabStore.opened = []
        worktabStore.keepAliveExclude = []
      }

      // 清除临时存储
      localStorage.removeItem(StorageConfig.LAST_USER_ID_KEY)
    }

    return {
      language,
      isLogin,
      isLock,
      lockPassword,
      adminInfo,
      searchHistory,
      accessToken,
      refreshToken,
      getAdminInfo,
      getSettingState,
      getWorktabState,
      setAdminInfo,
      setLoginStatus,
      setLanguage,
      setSearchHistory,
      setLockStatus,
      setLockPassword,
      setToken,
      logOut,
      checkAndClearWorktabs
    }
  },
  {
    persist: {
      key: 'user',
      storage: localStorage
    }
  }
)
