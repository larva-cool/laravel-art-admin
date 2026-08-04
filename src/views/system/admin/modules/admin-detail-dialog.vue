<template>
  <ElDialog
    v-model="dialogVisible"
    title="管理员详情"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElTabs v-model="activeTab" @tab-change="handleTabChange">
      <ElTabPane label="基本资料" name="profile">
        <ElDescriptions :column="2" border class="mt-4">
          <ElDescriptionsItem label="ID" :span="1">{{ admin?.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用户名" :span="1">
            {{ admin?.username }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="昵称" :span="1">{{ admin?.name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="邮箱" :span="1">
            {{ admin?.email || '—' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="手机号" :span="1">
            {{ admin?.phone || '—' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态" :span="1">
            <ElTag :type="admin?.status?.value === 1 ? 'success' : 'danger'">
              {{ admin?.status?.label }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="角色" :span="2">
            <template v-if="admin?.roles && admin.roles.length > 0">
              <ElTag v-for="role in admin.roles" :key="role" type="info" size="small" class="mr-1">
                {{ role }}
              </ElTag>
            </template>
            <span v-else>—</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最后登录IP" :span="1">
            {{ admin?.last_login_ip || '—' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最后登录时间" :span="1">
            {{ admin?.last_login_at || '—' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="登录次数" :span="1">
            {{ admin?.login_count ?? 0 }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间" :span="1">
            {{ admin?.created_at || '—' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElTabPane>

      <ElTabPane label="登录历史" name="histories" lazy>
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
            <template #default="{ row }">
              {{ row.address || '—' }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="device" label="设备" min-width="100">
            <template #default="{ row }">
              {{ row.device || row.platform || '—' }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="browser" label="浏览器" min-width="120">
            <template #default="{ row }">
              {{ row.browser || '—' }}
            </template>
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
  import { fetchAdminLoginHistories } from '@/api/system-manage'

  defineOptions({ name: 'AdminDetailDialog' })

  type AdminListItem = Api.SystemManage.AdminListItem
  type LoginHistoryItem = Api.SystemManage.AdminLoginHistoryItem

  const dialogVisible = ref(false)
  const activeTab = ref<'profile' | 'histories'>('profile')

  const admin = ref<AdminListItem | null>(null)

  // 登录历史相关状态
  const historyList = ref<LoginHistoryItem[]>([])
  const historyLoading = ref(false)
  const historyLoaded = ref(false)
  const historyTotal = ref(0)
  const historyPage = reactive({
    page: 1,
    per_page: 15
  })

  const open = (row: AdminListItem) => {
    admin.value = row
    dialogVisible.value = true
    activeTab.value = 'profile'
    // 重置登录历史分页/加载标记
    historyPage.page = 1
    historyPage.per_page = 15
    historyLoaded.value = false
    historyList.value = []
    historyTotal.value = 0
  }

  const handleClose = () => {
    dialogVisible.value = false
    admin.value = null
  }

  const handleTabChange = (name: string | number) => {
    if (name === 'histories' && !historyLoaded.value && admin.value) {
      loadHistories()
    }
  }

  const loadHistories = async () => {
    if (!admin.value) return
    historyLoading.value = true
    try {
      const res = await fetchAdminLoginHistories(admin.value.id, {
        page: historyPage.page,
        per_page: historyPage.per_page
      })
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

  .mr-1 {
    margin-right: 4px;
  }

  .history-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
</style>
