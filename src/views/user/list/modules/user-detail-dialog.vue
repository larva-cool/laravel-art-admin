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
        <div class="history-filters mt-4">
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

        <div class="history-pagination">
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
    </ElTabs>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchGetUserDetail, fetchUserLoginHistories } from '@/api/user-manage'

  defineOptions({ name: 'UserDetailDialog' })

  type UserDetail = Api.UserManage.UserDetail
  type LoginHistoryItem = Api.UserManage.LoginHistoryItem

  const dialogVisible = ref(false)
  const activeTab = ref<'profile' | 'histories'>('profile')

  const user = ref<UserDetail | null>(null)

  // 登录历史相关状态
  const historyList = ref<LoginHistoryItem[]>([])
  const historyLoading = ref(false)
  const historyLoaded = ref(false)
  const historyTotal = ref(0)
  const historyDateRange = ref<string[]>([])
  const historyPage = reactive({
    page: 1,
    per_page: 15
  })

  const open = async (row: Api.UserManage.UserListItem) => {
    dialogVisible.value = true
    activeTab.value = 'profile'
    // 重置历史
    historyPage.page = 1
    historyPage.per_page = 15
    historyLoaded.value = false
    historyList.value = []
    historyTotal.value = 0
    historyDateRange.value = []

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
    if (name === 'histories' && !historyLoaded.value && user.value) {
      loadHistories()
    }
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

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .mt-4 {
    margin-top: 12px;
  }

  .history-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
</style>
