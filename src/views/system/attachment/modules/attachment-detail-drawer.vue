<template>
  <ElDrawer
    v-model="visible"
    size="480px"
    :destroy-on-close="true"
    :with-header="false"
    class="attachment-detail-drawer"
  >
    <div v-if="detail" class="h-full flex flex-col">
      <!-- 头部：文件名 + 公开/私有标记 -->
      <div class="shrink-0 pb-4 border-b-d">
        <div class="flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h4 class="text-base font-bold text-g-900 truncate" :title="detail.name">
                {{ detail.name }}
              </h4>
              <ElTag :type="isPrivate ? 'warning' : 'success'" size="small">
                {{ isPrivate ? '私有' : '公开' }}
              </ElTag>
            </div>
            <p class="text-xs text-g-400 mt-1 break-all">{{ detail.original_name }}</p>
          </div>
          <ArtSvgIcon
            icon="ri:close-line"
            class="text-lg text-g-400 cursor-pointer shrink-0 mt-1 hover:text-g-700"
            @click="visible = false"
          />
        </div>
      </div>

      <div v-loading="loading" class="flex-1 overflow-y-auto py-4 space-y-3">
        <!-- 预览区：图片直接展示，其他类型显示类型图标 -->
        <div class="p-4 rounded-md bg-(--art-gray-100) flex-cc">
          <ElImage
            v-if="isImage && detail.preview_url"
            :src="detail.preview_url"
            fit="contain"
            class="max-h-70 rounded"
            :preview-src-list="[detail.preview_url]"
            preview-teleported
          />
          <div v-else class="py-10 flex-cc flex-col gap-2 text-g-400">
            <ArtSvgIcon :icon="typeIcon(detail.type.value)" class="text-4xl" />
            <span class="text-xs">{{ detail.type.label }}暂不支持预览</span>
          </div>
        </div>

        <!-- 关键信息 -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-md bg-(--art-gray-100)">
            <div class="text-xs uppercase text-g-400">Storage</div>
            <div class="text-sm text-g-900 mt-1 truncate">{{ diskLabel(detail.disk) }}</div>
          </div>
          <div class="p-3 rounded-md bg-(--art-gray-100)">
            <div class="text-xs uppercase text-g-400">Size</div>
            <div class="text-sm text-g-900 mt-1">{{ detail.size_text }}</div>
          </div>
          <div class="p-3 rounded-md bg-(--art-gray-100)">
            <div class="text-xs uppercase text-g-400">Kind</div>
            <div class="text-sm text-g-900 mt-1">{{ detail.type.label }}</div>
          </div>
          <div class="p-3 rounded-md bg-(--art-gray-100)">
            <div class="text-xs uppercase text-g-400">Folder</div>
            <div class="text-sm text-g-900 mt-1 truncate" :title="directoryOf(detail.path)">
              {{ directoryOf(detail.path) }}
            </div>
          </div>
        </div>

        <!-- 元数据 -->
        <div class="p-3 rounded-md bg-(--art-gray-100) space-y-2">
          <div class="text-sm font-medium text-g-900">元数据</div>
          <div class="text-xs text-g-600">MIME：{{ detail.mime_type }}</div>
          <div class="text-xs text-g-600 break-all">对象 Key：{{ detail.path }}</div>
          <div class="text-xs text-g-600">上传者：{{ detail.uploader?.name ?? '-' }}</div>
          <div class="text-xs text-g-600">上传时间：{{ detail.created_at ?? '-' }}</div>
          <div v-if="detail.exists !== undefined" class="text-xs text-g-600">
            物理文件：{{ detail.exists ? '存在' : '已丢失' }}
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="shrink-0 pt-4 border-t-d flex justify-end gap-2">
        <ElButton type="primary" :loading="downloading" @click="handleDownload" v-ripple>
          下载
        </ElButton>
        <ElButton :loading="copying" @click="handleCopyLink" v-ripple>
          {{ isPrivate ? '临时链接' : '公开链接' }}
        </ElButton>
        <ElButton
          v-if="hasAuth('attachments.delete')"
          type="danger"
          plain
          @click="handleDelete"
          v-ripple
        >
          删除
        </ElButton>
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import {
    fetchDeleteAttachment,
    fetchDownloadAttachment,
    fetchGetAttachmentDetail,
    fetchTemporaryUrlAttachment
  } from '@/api/system-manage'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useClipboard } from '@vueuse/core'
  import { ElImage, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { diskLabel, directoryOf, isPrivateDisk, typeIcon } from '../utils'

  defineOptions({ name: 'AttachmentDetailDrawer' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const { hasAuth } = useAuth()
  const { copy } = useClipboard()

  type AttachmentListItem = Api.SystemManage.AttachmentListItem

  const visible = ref(false)
  const loading = ref(false)
  const downloading = ref(false)
  const copying = ref(false)
  const detail = ref<AttachmentListItem | null>(null)

  const isPrivate = computed(() => (detail.value ? isPrivateDisk(detail.value.disk) : false))
  const isImage = computed(() => detail.value?.type.value === 'image')

  /** 打开抽屉：先用列表行数据快速渲染，再拉详情补齐 exists 等字段 */
  const open = async (row: AttachmentListItem) => {
    detail.value = { ...row }
    visible.value = true
    loading.value = true
    try {
      detail.value = await fetchGetAttachmentDetail(row.id)
    } finally {
      loading.value = false
    }
  }

  const handleDownload = async () => {
    if (!detail.value) return
    downloading.value = true
    try {
      const blob = await fetchDownloadAttachment(detail.value.id)
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = detail.value.original_name || detail.value.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } finally {
      downloading.value = false
    }
  }

  /** 复制访问链接：公开文件复制直链，私有文件换取临时签名地址 */
  const handleCopyLink = async () => {
    if (!detail.value) return
    copying.value = true
    try {
      const url = detail.value.url ?? (await fetchTemporaryUrlAttachment(detail.value.id)).url
      await copy(url)
      ElMessage.success('链接已复制到剪贴板')
    } finally {
      copying.value = false
    }
  }

  const handleDelete = () => {
    if (!detail.value) return
    const target = detail.value
    ElMessageBox.confirm(`确定删除文件「${target.name}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchDeleteAttachment(target.id)
        visible.value = false
        emit('refresh')
      })
      .catch(() => {})
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .attachment-detail-drawer {
    :deep(.el-drawer__body) {
      padding: 20px;
      overflow: hidden;
    }
  }
</style>
