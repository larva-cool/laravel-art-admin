<template>
  <ElDialog
    v-model="dialogVisible"
    title="用户详情"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElTabs v-model="activeTab" @tab-change="handleTabChange">
      <ElTabPane label="基本资料" name="profile">
        <ElDescriptions :column="2" border class="mt-4">
          <ElDescriptionsItem label="ID" :span="1">{{ user?.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用户名" :span="1">{{ user?.username }}</ElDescriptionsItem>
          <ElDescriptionsItem label="昵称" :span="1">{{ user?.name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态" :span="1">
            <ElTag :type="user?.status?.value === 1 ? 'success' : 'danger'">
              {{ user?.status?.label }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="邮箱" :span="1">{{ user?.email || '—' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="手机号" :span="1">{{ user?.phone || '—' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="VIP" :span="1">
            <ElTag v-if="user?.is_vip" type="warning">VIP 至 {{ user.vip_expires_at }}</ElTag>
            <span v-else>普通用户</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="积分/金币" :span="1">
            积分 {{ user?.available_points ?? 0 }} | 金币 {{ user?.available_coins ?? 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="登录次数" :span="1">{{
            user?.login_count ?? 0
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="最后登录IP" :span="1">{{
            user?.last_login_ip || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="最后登录时间" :span="1">{{
            user?.last_login_at || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="最后活跃时间" :span="1">{{
            user?.last_active_at || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="注册时间" :span="1">{{
            user?.created_at || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间" :span="1">{{
            user?.updated_at || '—'
          }}</ElDescriptionsItem>
        </ElDescriptions>

        <!-- 用户资料 -->
        <ElDivider content-position="left">扩展资料</ElDivider>
        <ElDescriptions v-if="user?.profile" :column="2" border>
          <ElDescriptionsItem label="性别" :span="1">{{
            user.profile.gender?.label || '未设置'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="生日" :span="1">{{
            user.profile.birthday || '未设置'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="个人网站" :span="1">{{
            user.profile.website || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="简介" :span="1">{{
            user.profile.intro || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="个人签名" :span="2">{{
            user.profile.bio || '—'
          }}</ElDescriptionsItem>
        </ElDescriptions>
        <ElEmpty v-else description="暂无扩展资料" :image-size="80" />
      </ElTabPane>

      <ElTabPane label="登录历史" name="histories" lazy>
        <div class="tab-filters mt-4">
          <ElDatePicker
            v-model="historyDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleDateRangeChange"
          />
        </div>
        <ElTable
          v-loading="historyLoading"
          :data="historyList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn type="index" label="#" width="60" align="center" />
          <ElTableColumn prop="ip" label="登录IP" min-width="130" />
          <ElTableColumn prop="address" label="地址" min-width="120">
            <template #default="{ row }">{{ row.address || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="device" label="设备" min-width="100">
            <template #default="{ row }">{{ row.device || row.platform || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="browser" label="浏览器" min-width="120">
            <template #default="{ row }">{{ row.browser || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="login_at" label="登录时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="historyPage.page"
            v-model:page-size="historyPage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="historyTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadHistories"
            @current-change="loadHistories"
          />
        </div>
      </ElTabPane>

      <ElTabPane label="社交账户" name="socials" lazy>
        <ElTable
          v-loading="socialLoading"
          :data="socialList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn type="index" label="#" width="60" align="center" />
          <ElTableColumn prop="provider" label="渠道" min-width="120">
            <template #default="{ row }">
              <ElTag type="primary">{{ row.provider?.label || row.provider?.value || '—' }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="openid" label="OpenID" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.openid || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="unionid" label="UnionID" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.unionid || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="expiry_at" label="令牌过期时间" min-width="170">
            <template #default="{ row }">{{ row.expiry_at || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="created_at" label="绑定时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="socialPage.page"
            v-model:page-size="socialPage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="socialTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadSocials"
            @current-change="loadSocials"
          />
        </div>
      </ElTabPane>

      <ElTabPane label="积分记录" name="points" lazy>
        <div class="tab-filters mt-4">
          <ElInput
            v-model="pointKeyword"
            placeholder="搜索描述"
            clearable
            style="width: 200px"
            @keyup.enter="handlePointSearch"
            @clear="handlePointSearch"
          />
          <ElDatePicker
            v-model="pointDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handlePointSearch"
          />
          <ElButton type="primary" @click="handlePointSearch">搜索</ElButton>
        </div>
        <ElTable
          v-loading="pointLoading"
          :data="pointList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn prop="id" label="流水号" width="100" />
          <ElTableColumn prop="points" label="变动积分" width="110" align="right">
            <template #default="{ row }">
              <span :class="row.points >= 0 ? 'amount-plus' : 'amount-minus'">
                {{ row.points >= 0 ? '+' : '' }}{{ row.points }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="type" label="类型" min-width="110">
            <template #default="{ row }">
              <ElTag type="info">{{ row.type?.label || row.type?.value || '—' }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="description" label="描述" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="expired_at" label="过期时间" min-width="170">
            <template #default="{ row }">{{ row.expired_at || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="created_at" label="发生时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="pointPage.page"
            v-model:page-size="pointPage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="pointTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadPointTrades"
            @current-change="loadPointTrades"
          />
        </div>
      </ElTabPane>

      <ElTabPane label="金币记录" name="coins" lazy>
        <div class="tab-filters mt-4">
          <ElInput
            v-model="coinKeyword"
            placeholder="搜索描述"
            clearable
            style="width: 200px"
            @keyup.enter="handleCoinSearch"
            @clear="handleCoinSearch"
          />
          <ElDatePicker
            v-model="coinDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleCoinSearch"
          />
          <ElButton type="primary" @click="handleCoinSearch">搜索</ElButton>
        </div>
        <ElTable
          v-loading="coinLoading"
          :data="coinList"
          stripe
          border
          size="default"
          class="mt-4"
          style="width: 100%"
        >
          <ElTableColumn prop="id" label="流水号" width="100" />
          <ElTableColumn prop="coins" label="变动金币" width="110" align="right">
            <template #default="{ row }">
              <span :class="row.coins >= 0 ? 'amount-plus' : 'amount-minus'">
                {{ row.coins >= 0 ? '+' : '' }}{{ row.coins }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="type" label="类型" min-width="110">
            <template #default="{ row }">
              <ElTag type="info">{{ row.type?.label || row.type?.value || '—' }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="description" label="描述" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description || '—' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="created_at" label="发生时间" min-width="170" />
        </ElTable>

        <div class="tab-pagination">
          <ElPagination
            v-model:current-page="coinPage.page"
            v-model:page-size="coinPage.per_page"
            :page-sizes="[10, 15, 20, 30, 50]"
            :total="coinTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadCoinTrades"
            @current-change="loadCoinTrades"
          />
        </div>
      </ElTabPane>
    </ElTabs>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchGetUserDetail,
    fetchUserCoinTrades,
    fetchUserLoginHistories,
    fetchUserPointTrades,
    fetchUserSocials
  } from '@/api/user-manage'

  defineOptions({ name: 'UserDetailDialog' })

  type UserDetail = Api.UserManage.UserDetail
  type LoginHistoryItem = Api.UserManage.LoginHistoryItem
  type SocialItem = Api.UserManage.SocialItem
  type PointTradeItem = Api.UserManage.PointTradeItem
  type CoinTradeItem = Api.UserManage.CoinTradeItem

  const dialogVisible = ref(false)
  const activeTab = ref<'profile' | 'histories' | 'socials' | 'points' | 'coins'>('profile')

  const user = ref<UserDetail | null>(null)

  // 登录历史
  const historyList = ref<LoginHistoryItem[]>([])
  const historyLoading = ref(false)
  const historyLoaded = ref(false)
  const historyTotal = ref(0)
  const historyDateRange = ref<string[]>([])
  const historyPage = reactive({ page: 1, per_page: 15 })

  // 社交账户
  const socialList = ref<SocialItem[]>([])
  const socialLoading = ref(false)
  const socialLoaded = ref(false)
  const socialTotal = ref(0)
  const socialPage = reactive({ page: 1, per_page: 15 })

  // 积分记录
  const pointList = ref<PointTradeItem[]>([])
  const pointLoading = ref(false)
  const pointLoaded = ref(false)
  const pointTotal = ref(0)
  const pointKeyword = ref('')
  const pointDateRange = ref<string[]>([])
  const pointPage = reactive({ page: 1, per_page: 15 })

  // 金币记录
  const coinList = ref<CoinTradeItem[]>([])
  const coinLoading = ref(false)
  const coinLoaded = ref(false)
  const coinTotal = ref(0)
  const coinKeyword = ref('')
  const coinDateRange = ref<string[]>([])
  const coinPage = reactive({ page: 1, per_page: 15 })

  const open = async (row: Api.UserManage.UserListItem) => {
    dialogVisible.value = true
    activeTab.value = 'profile'

    historyPage.page = 1
    historyLoaded.value = false
    historyList.value = []
    historyTotal.value = 0
    historyDateRange.value = []

    socialPage.page = 1
    socialLoaded.value = false
    socialList.value = []
    socialTotal.value = 0

    pointPage.page = 1
    pointLoaded.value = false
    pointList.value = []
    pointTotal.value = 0
    pointKeyword.value = ''
    pointDateRange.value = []

    coinPage.page = 1
    coinLoaded.value = false
    coinList.value = []
    coinTotal.value = 0
    coinKeyword.value = ''
    coinDateRange.value = []

    // 拉取详情（含 profile）
    try {
      user.value = await fetchGetUserDetail(row.id)
    } catch {
      user.value = { ...row } as UserDetail
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
    user.value = null
  }

  const handleTabChange = (name: string | number) => {
    if (!user.value) return
    if (name === 'histories' && !historyLoaded.value) loadHistories()
    if (name === 'socials' && !socialLoaded.value) loadSocials()
    if (name === 'points' && !pointLoaded.value) loadPointTrades()
    if (name === 'coins' && !coinLoaded.value) loadCoinTrades()
  }

  const handleDateRangeChange = () => {
    historyPage.page = 1
    loadHistories()
  }

  const loadHistories = async () => {
    if (!user.value) return
    historyLoading.value = true
    try {
      const params: Api.Common.LaravelPaginationRequest & {
        login_start?: string
        login_end?: string
      } = {
        page: historyPage.page,
        per_page: historyPage.per_page
      }
      if (historyDateRange.value?.length === 2) {
        params.login_start = historyDateRange.value[0]
        params.login_end = historyDateRange.value[1]
      }
      const res = await fetchUserLoginHistories(user.value.id, params)
      historyList.value = res?.data || []
      historyTotal.value = res?.meta?.total || 0
      historyLoaded.value = true
    } finally {
      historyLoading.value = false
    }
  }

  const loadSocials = async () => {
    if (!user.value) return
    socialLoading.value = true
    try {
      const res = await fetchUserSocials(user.value.id, {
        page: socialPage.page,
        per_page: socialPage.per_page
      })
      socialList.value = res?.data || []
      socialTotal.value = res?.meta?.total || 0
      socialLoaded.value = true
    } finally {
      socialLoading.value = false
    }
  }

  const handlePointSearch = () => {
    pointPage.page = 1
    loadPointTrades()
  }

  const loadPointTrades = async () => {
    if (!user.value) return
    pointLoading.value = true
    try {
      const params: Api.Common.LaravelPaginationRequest & {
        keyword?: string
        start_date?: string
        end_date?: string
      } = {
        page: pointPage.page,
        per_page: pointPage.per_page
      }
      if (pointKeyword.value) params.keyword = pointKeyword.value
      if (pointDateRange.value?.length === 2) {
        params.start_date = pointDateRange.value[0]
        params.end_date = pointDateRange.value[1]
      }
      const res = await fetchUserPointTrades(user.value.id, params)
      pointList.value = res?.data || []
      pointTotal.value = res?.meta?.total || 0
      pointLoaded.value = true
    } finally {
      pointLoading.value = false
    }
  }

  const handleCoinSearch = () => {
    coinPage.page = 1
    loadCoinTrades()
  }

  const loadCoinTrades = async () => {
    if (!user.value) return
    coinLoading.value = true
    try {
      const params: Api.Common.LaravelPaginationRequest & {
        keyword?: string
        start_date?: string
        end_date?: string
      } = {
        page: coinPage.page,
        per_page: coinPage.per_page
      }
      if (coinKeyword.value) params.keyword = coinKeyword.value
      if (coinDateRange.value?.length === 2) {
        params.start_date = coinDateRange.value[0]
        params.end_date = coinDateRange.value[1]
      }
      const res = await fetchUserCoinTrades(user.value.id, params)
      coinList.value = res?.data || []
      coinTotal.value = res?.meta?.total || 0
      coinLoaded.value = true
    } finally {
      coinLoading.value = false
    }
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .mt-4 {
    margin-top: 12px;
  }

  .tab-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .tab-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .amount-plus {
    font-weight: 500;
    color: var(--el-color-success);
  }

  .amount-minus {
    font-weight: 500;
    color: var(--el-color-danger);
  }
</style>
