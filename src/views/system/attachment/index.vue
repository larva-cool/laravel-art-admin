<template>
  <div class="art-full-height">
    <!-- 顶部：标题 + 上传操作 -->
    <div class="art-card p-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 class="text-base font-medium text-g-900">文件中心</h4>
          <p class="text-xs text-g-500 mt-1">上传、整理目录并管理文件公开分发</p>
        </div>
        <ElSpace wrap>
          <ElRadioGroup v-model="uploadMode" size="default">
            <ElRadioButton value="direct">直传云存储</ElRadioButton>
            <ElRadioButton value="proxy">中转上传</ElRadioButton>
          </ElRadioGroup>
          <ElButton type="primary" :loading="uploading" @click="triggerUpload" v-ripple>
            上传文件
          </ElButton>
        </ElSpace>
      </div>

      <!-- 统计指标 -->
      <div class="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="p-3 rounded-md bg-(--art-gray-100)">
          <div class="text-xl font-bold text-g-900 tabular-nums">{{ stats.total }}</div>
          <div class="text-xs text-g-500 mt-1">总文件数</div>
          <div class="text-xs text-g-400 mt-0.5">台账登记的文件总数</div>
        </div>
        <div class="p-3 rounded-md bg-(--art-gray-100)">
          <div class="text-xl font-bold text-g-900 tabular-nums">{{ stats.private }}</div>
          <div class="text-xs text-g-500 mt-1">私有文件</div>
          <div class="text-xs text-g-400 mt-0.5">需签名地址才能访问的内容</div>
        </div>
        <div class="p-3 rounded-md bg-(--art-gray-100)">
          <div class="text-xl font-bold text-g-900 tabular-nums">{{ stats.public }}</div>
          <div class="text-xs text-g-500 mt-1">公开文件</div>
          <div class="text-xs text-g-400 mt-0.5">可生成公开链接直接分发</div>
        </div>
        <div class="p-3 rounded-md bg-(--art-gray-100)">
          <div class="text-xl font-bold text-g-900">{{ uploadModeLabel }}</div>
          <div class="text-xs text-g-500 mt-1">当前上传模式</div>
          <div class="text-xs text-g-400 mt-0.5">{{ uploadModeHint }}</div>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row items-start gap-4 mt-3">
      <!-- 左侧：按文件类型筛选 -->
      <div class="w-full md:w-66 shrink-0">
        <div class="art-card p-4">
          <div class="text-sm uppercase font-bold text-g-500 mb-1">文件类型管理</div>
          <p class="text-xs text-g-400 mb-3">按文件类型归类，切换后自动筛选列表</p>

          <div class="space-y-0.5">
            <div
              v-for="item in typeItems"
              :key="item.value"
              class="flex items-center gap-2 px-2.5 py-2.5 rounded-md cursor-pointer transition-all duration-200"
              :class="
                activeType === item.value
                  ? 'bg-theme/10 text-theme font-medium'
                  : 'text-g-700 hover:bg-hover-color'
              "
              @click="handleTypeChange(item.value)"
            >
              <ArtSvgIcon :icon="item.icon" class="text-lg shrink-0" />
              <span class="text-[15px] truncate flex-1">{{ item.label }}</span>
              <span class="text-sm tabular-nums">{{ typeCounts[item.value] ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：搜索 + 列表 -->
      <div class="flex-1 min-w-0 w-full">
        <AttachmentSearch
          v-show="showSearchBar"
          @search="handleSearch"
          @reset-search-params="handleResetSearch"
        />

        <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
          <ArtTableHeader
            v-model:columns="columnChecks"
            v-model:showSearchBar="showSearchBar"
            :loading="loading"
            @refresh="handleRefresh"
          >
            <template #right>
              <ElSpace v-if="selectedRows.length" wrap class="ml-2">
                <ElTag size="small" type="success">已选 {{ selectedRows.length }} 项</ElTag>
                <ElButton
                  v-if="hasAuth('attachments.edit')"
                  size="small"
                  @click="handleBatchMove"
                  v-ripple
                >
                  批量移动
                </ElButton>
                <ElButton
                  v-if="hasAuth('attachments.delete')"
                  size="small"
                  type="danger"
                  @click="handleBatchDelete"
                  v-ripple
                >
                  批量删除
                </ElButton>
              </ElSpace>
            </template>
          </ArtTableHeader>

          <ArtTable
            :loading="loading"
            :data="data"
            :columns="columns"
            :pagination="pagination"
            row-key="id"
            class="attachment-table"
            @row-click="handleRowClick"
            @selection-change="handleSelectionChange"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
          />
        </ElCard>
      </div>
    </div>

    <input ref="fileInputRef" type="file" class="hidden" @change="handleFileChange" />

    <ElImageViewer
      v-if="previewVisible"
      :url-list="previewUrlList"
      teleported
      @close="previewVisible = false"
    />

    <AttachmentDetailDrawer ref="detailDrawerRef" @refresh="handleRemoved" />
    <AttachmentRenameDialog ref="renameDialogRef" @refresh="handleUpdated" />
    <AttachmentMoveDialog ref="moveDialogRef" @refresh="handleUpdated" />
  </div>
</template>

<script setup lang="ts">
  import axios from 'axios'
  import {
    fetchAttachmentUploadToken,
    fetchBatchDeleteAttachments,
    fetchDeleteAttachment,
    fetchDownloadAttachment,
    fetchGetAttachmentList,
    fetchRegisterAttachment,
    fetchTemporaryUrlAttachment,
    fetchUploadAttachmentFile
  } from '@/api/system-manage'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import { useClipboard } from '@vueuse/core'
  import { ElImage, ElImageViewer, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { diskLabel, directoryOf, typeIcon, typeItems, typeTagType } from './utils'
  import AttachmentSearch from './modules/attachment-search.vue'
  import AttachmentDetailDrawer from './modules/attachment-detail-drawer.vue'
  import AttachmentRenameDialog from './modules/attachment-rename-dialog.vue'
  import AttachmentMoveDialog from './modules/attachment-move-dialog.vue'

  defineOptions({ name: 'Attachment' })

  const { hasAuth } = useAuth()
  const { copy } = useClipboard()

  type AttachmentListItem = Api.SystemManage.AttachmentListItem

  const showSearchBar = ref(true)
  const uploadMode = ref<'direct' | 'proxy'>('proxy')
  const uploading = ref(false)
  const activeType = ref('')
  const selectedRows = ref<AttachmentListItem[]>([])
  const fileInputRef = ref<HTMLInputElement>()
  const detailDrawerRef = ref<InstanceType<typeof AttachmentDetailDrawer>>()
  const renameDialogRef = ref<InstanceType<typeof AttachmentRenameDialog>>()
  const moveDialogRef = ref<InstanceType<typeof AttachmentMoveDialog>>()
  const typeCounts = ref<Record<string, number>>({})
  const privateCount = ref(0)
  const previewVisible = ref(false)
  const previewUrlList = ref<string[]>([])

  const uploadModeLabel = computed(() => (uploadMode.value === 'direct' ? '直传' : '中转'))
  const uploadModeHint = computed(() =>
    uploadMode.value === 'direct' ? '浏览器直接上传至对象存储' : '文件经服务端写入存储'
  )

  const stats = computed(() => ({
    total: typeCounts.value[''] ?? 0,
    private: privateCount.value,
    public: Math.max((typeCounts.value[''] ?? 0) - privateCount.value, 0)
  }))

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    refreshCreate,
    refreshUpdate,
    refreshRemove
  } = useTable({
    core: {
      apiFn: fetchGetAttachmentList,
      apiParams: {
        page: 1,
        per_page: 12
      },
      columnsFactory: () => [
        { type: 'selection', width: 55 },
        {
          prop: 'name',
          label: '文件',
          minWidth: 280,
          formatter: (row: AttachmentListItem) =>
            h('div', { class: 'flex items-center gap-3' }, [
              row.type.value === 'image'
                ? h(
                    'div',
                    {
                      class: 'w-11 h-11 shrink-0 cursor-zoom-in',
                      onClick: (event: MouseEvent) => {
                        event.stopPropagation()
                        handlePreview(row)
                      }
                    },
                    row.preview_url
                      ? h(ElImage, {
                          src: row.preview_url,
                          fit: 'cover',
                          class: 'w-11 h-11 rounded'
                        })
                      : h(
                          'div',
                          {
                            class:
                              'w-11 h-11 rounded flex-cc bg-(--art-gray-100) text-g-500 text-lg'
                          },
                          h(ArtSvgIcon, { icon: 'ri:image-line' })
                        )
                  )
                : h(
                    'div',
                    {
                      class:
                        'w-11 h-11 rounded shrink-0 flex-cc bg-(--art-gray-100) text-g-500 text-lg'
                    },
                    h(ArtSvgIcon, { icon: typeIcon(row.type.value) })
                  ),
              h('div', { class: 'min-w-0' }, [
                h('div', { class: 'text-sm text-g-900 truncate' }, row.original_name || row.name),
                h('div', { class: 'text-xs text-g-400 truncate' }, row.path)
              ])
            ])
        },
        {
          prop: 'type',
          label: '类型',
          width: 100,
          formatter: (row: AttachmentListItem) =>
            h(
              ElTag,
              { type: typeTagType[row.type.value] ?? 'info', size: 'small' },
              () => row.type.label
            )
        },
        { prop: 'size_text', label: '大小', width: 110 },
        {
          prop: 'path',
          label: '目录',
          minWidth: 160,
          showOverflowTooltip: true,
          formatter: (row: AttachmentListItem) => directoryOf(row.path)
        },
        {
          prop: 'disk',
          label: '存储',
          width: 110,
          formatter: (row: AttachmentListItem) => diskLabel(row.disk)
        },
        {
          prop: 'uploader',
          label: '上传者',
          width: 120,
          formatter: (row: AttachmentListItem) => row.uploader?.name ?? '-'
        },
        { prop: 'created_at', label: '上传时间', width: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 270,
          fixed: 'right',
          formatter: (row: AttachmentListItem) =>
            h('div', { class: 'flex items-center' }, [
              h(ArtButtonTable, {
                type: 'view',
                iconClass: 'bg-g-200 text-g-600',
                onClick: () => handleView(row)
              }),
              h(ArtButtonTable, {
                icon: 'ri:download-line',
                iconClass: 'bg-info/12 text-info',
                onClick: () => handleDownload(row)
              }),
              h(ArtButtonTable, {
                icon: 'ri:link',
                iconClass: 'bg-success/12 text-success',
                onClick: () => handleCopyLink(row)
              }),
              hasAuth('attachments.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => renameDialogRef.value?.open(row)
                  })
                : null,
              hasAuth('attachments.edit')
                ? h(ArtButtonTable, {
                    icon: 'ri:folder-transfer-line',
                    iconClass: 'bg-warning/12 text-warning',
                    onClick: () => moveDialogRef.value?.open(row)
                  })
                : null,
              hasAuth('attachments.delete')
                ? h(ArtButtonTable, { type: 'delete', onClick: () => handleDelete(row) })
                : null
            ])
        }
      ]
    }
  })

  /** 加载左侧目录计数与顶部统计 */
  const loadStats = async () => {
    const typeValues = typeItems.map((item) => item.value)
    const [counts, privateResult] = await Promise.all([
      Promise.all(
        typeValues.map((type) =>
          fetchGetAttachmentList({ page: 1, per_page: 1, ...(type ? { type } : {}) })
        )
      ),
      fetchGetAttachmentList({ page: 1, per_page: 1, disk: 'local' })
    ])

    typeCounts.value = typeValues.reduce<Record<string, number>>((result, type, index) => {
      result[type] = counts[index]?.meta?.total ?? 0
      return result
    }, {})
    privateCount.value = privateResult?.meta?.total ?? 0
  }

  /** 切换左侧目录 */
  const handleTypeChange = (type: string) => {
    if (activeType.value === type) return
    activeType.value = type
    const params = searchParams as Record<string, unknown>
    if (type) {
      params.type = type
    } else {
      delete params.type
    }
    getData()
  }

  const handleSearch = (params: Partial<Api.SystemManage.AttachmentSearchParams>) => {
    const target = searchParams as Record<string, unknown>
    Object.keys(target).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete target[key]
      }
    })
    if (activeType.value) {
      target.type = activeType.value
    }
    Object.assign(target, params)
    getData()
  }

  const handleResetSearch = () => {
    activeType.value = ''
    resetSearchParams()
  }

  const handleRefresh = async () => {
    refreshData()
    await loadStats()
  }

  const handleSelectionChange = (rows: AttachmentListItem[]) => {
    selectedRows.value = rows
  }

  const handleUpdated = async () => {
    selectedRows.value = []
    refreshUpdate()
    await loadStats()
  }

  const handleRemoved = async () => {
    selectedRows.value = []
    refreshRemove()
    await loadStats()
  }

  /** 点击图片缩略图：优先用列表已返回的展示地址，缺失时再换取临时签名地址 */
  const handlePreview = async (row: AttachmentListItem) => {
    const url = row.preview_url ?? (await fetchTemporaryUrlAttachment(row.id)).url
    previewUrlList.value = [url]
    previewVisible.value = true
  }

  /** 点击行：打开详情抽屉；勾选列与操作列不触发 */
  const handleRowClick = (
    row: AttachmentListItem,
    column: { type?: string; property?: string }
  ) => {
    if (column?.type === 'selection' || column?.property === 'operation') {
      return
    }
    detailDrawerRef.value?.open(row)
  }

  /** 查看：打开详情抽屉 */
  const handleView = (row: AttachmentListItem) => {
    detailDrawerRef.value?.open(row)
  }

  /** 复制访问链接：公开文件用直链，私有文件换取临时签名地址 */
  const handleCopyLink = async (row: AttachmentListItem) => {
    const url = row.url ?? (await fetchTemporaryUrlAttachment(row.id)).url
    await copy(url)
    ElMessage.success('链接已复制到剪贴板')
  }

  const handleDownload = async (row: AttachmentListItem) => {
    const blob = await fetchDownloadAttachment(row.id)
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = row.original_name || row.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(objectUrl)
  }

  const handleDelete = (row: AttachmentListItem) => {
    ElMessageBox.confirm(`确定删除文件「${row.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchDeleteAttachment(row.id)
        refreshRemove()
        await loadStats()
      })
      .catch(() => {})
  }

  const handleBatchMove = () => {
    moveDialogRef.value?.open([...selectedRows.value])
  }

  const handleBatchDelete = () => {
    ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 个文件吗？`, '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchBatchDeleteAttachments(selectedRows.value.map((item) => item.id))
        selectedRows.value = []
        refreshRemove()
        await loadStats()
      })
      .catch(() => {})
  }

  const triggerUpload = () => {
    fileInputRef.value?.click()
  }

  const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    uploading.value = true
    try {
      if (uploadMode.value === 'direct') {
        await uploadDirect(file)
      } else {
        await fetchUploadAttachmentFile(file)
      }
      ElMessage.success('上传成功')
      refreshCreate()
      await loadStats()
    } finally {
      uploading.value = false
    }
  }

  /**
   * 直传云存储：先取预签名地址，浏览器直接 PUT 到对象存储，成功后登记台账。
   * 预签名地址自带签名信息，必须绕过项目 http 封装以避免注入 Authorization 头。
   */
  const uploadDirect = async (file: File) => {
    const { url, headers, path } = await fetchAttachmentUploadToken(file.name)
    await axios.put(url, file, {
      headers: { 'Content-Type': file.type, ...headers }
    })
    await fetchRegisterAttachment({ path, original_name: file.name })
  }

  onMounted(loadStats)
</script>

<style scoped lang="scss">
  .attachment-table {
    :deep(.el-table__body tr) {
      cursor: pointer;
    }
  }
</style>
