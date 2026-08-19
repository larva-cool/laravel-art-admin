<template>
  <div class="art-full-height">
    <AttachmentSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @reset-search-params="resetSearchParams"
    />

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton
              type="danger"
              :disabled="selectedRows.length === 0"
              @click="handleBatchDelete"
              v-ripple
              >批量删除</ElButton
            >
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <AttachmentRenameDialog ref="renameDialogRef" @refresh="refreshCreate" />
    <AttachmentMoveDialog ref="moveDialogRef" @refresh="refreshCreate" />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchGetAttachmentList,
    fetchDeleteAttachment,
    fetchBatchDeleteAttachments,
    fetchDownloadAttachment
  } from '@/api/system-manage'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElImage, ElMessageBox, ElTag, ElMessage } from 'element-plus'
  import AttachmentSearch from './modules/attachment-search.vue'
  import AttachmentRenameDialog from './modules/attachment-rename-dialog.vue'
  import AttachmentMoveDialog from './modules/attachment-move-dialog.vue'

  defineOptions({ name: 'Attachment' })

  type AttachmentListItem = Api.SystemManage.AttachmentListItem

  /** 文件类型图标和颜色映射 */
  const fileTypeTagType: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    image: 'success',
    video: 'primary',
    audio: 'info',
    document: 'warning',
    archive: 'danger',
    other: 'info'
  }

  /** 存储磁盘标签映射 */
  const diskLabel: Record<string, string> = {
    local: '本地',
    public: '公共',
    s3: 'S3'
  }

  const showSearchBar = ref(true)
  const renameDialogRef = ref<InstanceType<typeof AttachmentRenameDialog>>()
  const moveDialogRef = ref<InstanceType<typeof AttachmentMoveDialog>>()
  const selectedRows = ref<AttachmentListItem[]>([])

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
    refreshCreate
  } = useTable({
    core: {
      apiFn: fetchGetAttachmentList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { type: 'selection', width: 55 },
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'preview',
          label: '预览',
          width: 100,
          formatter: (row: AttachmentListItem) => {
            if (row.type.value === 'image') {
              return h(ElImage, {
                src: row.url,
                fit: 'cover',
                style: { width: '60px', height: '60px', borderRadius: '4px', cursor: 'pointer' },
                previewSrcList: [row.url],
                previewTeleported: true
              })
            }
            return h(
              'div',
              {
                class: 'w-[60px] h-[60px] flex items-center justify-center bg-gray-100 rounded',
                style: { fontSize: '24px' }
              },
              {
                default: () => getFileIcon(row.type.value)
              }
            )
          }
        },
        { prop: 'name', label: '文件名', minWidth: 180, showOverflowTooltip: true },
        { prop: 'original_name', label: '原始名', minWidth: 160, showOverflowTooltip: true },
        {
          prop: 'type',
          label: '类型',
          width: 100,
          formatter: (row: AttachmentListItem) =>
            h(
              ElTag,
              { type: fileTypeTagType[row.type.value] || 'info', size: 'small' },
              () => row.type.label
            )
        },
        { prop: 'extension', label: '扩展名', width: 100 },
        { prop: 'size_text', label: '文件大小', width: 110 },
        {
          prop: 'disk',
          label: '磁盘',
          width: 100,
          formatter: (row: AttachmentListItem) =>
            h(ElTag, { type: 'info', size: 'small' }, () => diskLabel[row.disk] || row.disk)
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
          width: 150,
          fixed: 'right',
          formatter: (row: AttachmentListItem) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  { key: 'view', label: '查看', icon: 'ri:eye-line' },
                  { key: 'download', label: '下载', icon: 'ri:download-line' },
                  { key: 'rename', label: '重命名', icon: 'ri:edit-2-line' },
                  { key: 'move', label: '移动', icon: 'ri:arrow-right-line' },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c'
                  }
                ],
                onClick: (item: ButtonMoreItem) => handleAction(item, row)
              })
            ])
        }
      ]
    }
  })

  /** 获取文件图标 */
  function getFileIcon(type: string): string {
    const iconMap: Record<string, string> = {
      image: '🖼️',
      video: '🎬',
      audio: '🎵',
      document: '📄',
      archive: '📦'
    }
    return iconMap[type] || '📎'
  }

  const handleAction = async (item: ButtonMoreItem, row: AttachmentListItem) => {
    switch (item.key) {
      case 'view':
        if (row.url) {
          window.open(row.url, '_blank')
        }
        break
      case 'download':
        handleDownload(row)
        break
      case 'rename':
        renameDialogRef.value?.open(row)
        break
      case 'move':
        moveDialogRef.value?.open(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  const handleSearch = (params: Partial<Api.SystemManage.AttachmentSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleSelectionChange = (rows: AttachmentListItem[]) => {
    selectedRows.value = rows
  }

  const handleDownload = async (row: AttachmentListItem) => {
    try {
      const blob = await fetchDownloadAttachment(row.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = row.original_name || row.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      ElMessage.success('下载成功')
    } catch {
      ElMessage.error('下载失败，请重试')
    }
  }

  const handleDelete = (row: AttachmentListItem) => {
    ElMessageBox.confirm(`确定删除文件"${row.name}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchDeleteAttachment(row.id)
        refreshCreate()
      })
      .catch(() => {})
  }

  const handleBatchDelete = () => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要删除的文件')
      return
    }
    ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 个文件吗？`, '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        const ids = selectedRows.value.map((item) => item.id)
        await fetchBatchDeleteAttachments(ids)
        selectedRows.value = []
        refreshCreate()
      })
      .catch(() => {})
  }
</script>
