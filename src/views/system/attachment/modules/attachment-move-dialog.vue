<template>
  <ElDialog
    v-model="dialogVisible"
    title="移动文件"
    width="550px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="当前文件" prop="original_path">
        <ElInput v-model="currentPath" disabled />
      </ElFormItem>
      <ElFormItem label="存储磁盘" prop="disk">
        <ElSelect v-model="form.disk" placeholder="请选择目标存储磁盘" style="width: 100%">
          <ElOption label="本地存储" value="local" />
          <ElOption label="公共存储" value="public" />
          <ElOption label="S3 云存储" value="s3" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="目标路径" prop="path">
        <ElInput
          v-model="form.path"
          placeholder="请输入目标路径，例如：uploads/new-folder/"
          clearable
        />
        <div class="text-xs text-gray-500 mt-1">路径以 / 结尾，如不填则保留原路径</div>
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

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const currentPath = ref('')

  const form = reactive<Api.SystemManage.AttachmentMoveParams>({
    disk: 'public',
    path: ''
  })

  const rules = computed<FormRules>(() => ({
    disk: [{ required: true, message: '请选择目标存储磁盘', trigger: 'change' }],
    path: []
  }))

  const open = (row: Api.SystemManage.AttachmentListItem) => {
    dialogVisible.value = true
    id.value = row.id
    currentPath.value = `${row.disk}://${row.path}`
    form.disk = row.disk
    form.path = ''
  }

  const handleSubmit = async () => {
    if (!formRef.value || !id.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchMoveAttachment(id.value, form)
        dialogVisible.value = false
        emit('refresh')
      } catch {
        ElMessage.error('移动失败，请重试')
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

<style scoped lang="scss"></style>
