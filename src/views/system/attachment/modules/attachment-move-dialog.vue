<template>
  <ElDialog
    v-model="dialogVisible"
    title="移动文件"
    width="550px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="当前位置">
        <ElInput :model-value="currentPath" disabled />
      </ElFormItem>
      <ElFormItem label="目标目录" prop="directory">
        <ElInput v-model="form.directory" placeholder="例如：uploads/2026/06/01" clearable />
        <div class="text-xs text-g-500 mt-1">
          必须位于 uploads 目录下，仅支持同一存储磁盘内移动
        </div>
      </ElFormItem>
      <ElFormItem label="目标路径">
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

  defineOptions({ name: 'AttachmentMoveDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const currentPath = ref('')
  const fileName = ref('')

  const form = reactive({
    directory: ''
  })

  /** 目标完整路径预览 */
  const targetPath = computed(() => {
    const directory = form.directory.replace(/^\/+|\/+$/g, '')
    return directory ? `${directory}/${fileName.value}` : fileName.value
  })

  const rules = computed<FormRules>(() => ({
    directory: [
      { required: true, message: '请输入目标目录', trigger: 'blur' },
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          const directory = String(value || '').replace(/^\/+|\/+$/g, '')
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

  const open = (row: Api.SystemManage.AttachmentListItem) => {
    dialogVisible.value = true
    id.value = row.id
    currentPath.value = `${row.disk}://${row.path}`
    fileName.value = row.path.split('/').pop() || row.name
    form.directory = row.path.split('/').slice(0, -1).join('/')
  }

  const handleSubmit = async () => {
    if (!formRef.value || !id.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchMoveAttachment(id.value!, { path: targetPath.value })
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
