<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isBatch ? '批量移动文件' : '移动文件'"
    width="550px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem v-if="isBatch" label="待移动文件">
        <div class="text-sm text-g-700">共 {{ rows.length }} 个文件</div>
      </ElFormItem>
      <template v-else>
        <ElFormItem label="当前位置">
          <ElInput :model-value="currentPath" disabled />
        </ElFormItem>
      </template>

      <ElFormItem label="目标目录" prop="directory">
        <ElInput v-model="form.directory" placeholder="例如：uploads/2026/06/01" clearable />
        <div class="text-xs text-g-500 mt-1">
          必须位于 uploads 目录下，仅支持同一存储磁盘内移动
        </div>
      </ElFormItem>

      <ElFormItem v-if="!isBatch" label="目标路径">
        <ElInput :model-value="targetPath" disabled />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认移动</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchMoveAttachment } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'AttachmentMoveDialog' })

  type AttachmentListItem = Api.SystemManage.AttachmentListItem

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const rows = ref<AttachmentListItem[]>([])

  const form = reactive({
    directory: ''
  })

  const isBatch = computed(() => rows.value.length > 1)
  const currentPath = computed(() => {
    const row = rows.value[0]
    return row ? `${row.disk}://${row.path}` : ''
  })

  /** 单文件模式下的目标完整路径预览 */
  const targetPath = computed(() => {
    const row = rows.value[0]
    if (!row) return ''
    return buildTargetPath(row)
  })

  const rules = computed<FormRules>(() => ({
    directory: [
      { required: true, message: '请输入目标目录', trigger: 'blur' },
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          const directory = normalizeDirectory(String(value || ''))
          if (!directory.startsWith('uploads')) {
            callback(new Error('目标目录必须以 uploads 开头'))
            return
          }
          if (directory.includes('..')) {
            callback(new Error('目标目录不能包含 ..'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }))

  /** 去除首尾斜杠 */
  function normalizeDirectory(directory: string): string {
    return directory.replace(/^\/+|\/+$/g, '')
  }

  /** 拼接单个文件的目标路径（保留原文件名） */
  function buildTargetPath(row: AttachmentListItem): string {
    const directory = normalizeDirectory(form.directory)
    const fileName = row.path.split('/').pop() || row.name
    return directory ? `${directory}/${fileName}` : fileName
  }

  const open = (target: AttachmentListItem | AttachmentListItem[]) => {
    const list = Array.isArray(target) ? target : [target]
    rows.value = list
    dialogVisible.value = true
    form.directory = list.length === 1 ? list[0].path.split('/').slice(0, -1).join('/') : ''
  }

  const handleSubmit = async () => {
    if (!formRef.value || rows.value.length === 0) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const results = await Promise.allSettled(
          rows.value.map((row) => fetchMoveAttachment(row.id, { path: buildTargetPath(row) }))
        )
        const failed = results.filter((result) => result.status === 'rejected').length
        const succeeded = results.length - failed

        if (failed === 0) {
          ElMessage.success(`移动成功 ${succeeded} 个文件`)
        } else {
          ElMessage.warning(`移动完成：成功 ${succeeded} 个，失败 ${failed} 个`)
        }

        dialogVisible.value = false
        emit('refresh')
      } finally {
        submitting.value = false
      }
    })
  }

  const handleClose = () => {
    formRef.value?.resetFields()
    dialogVisible.value = false
  }

  defineExpose({ open })
</script>
