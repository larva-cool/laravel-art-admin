<template>
  <ElDialog
    v-model="dialogVisible"
    title="重命名文件"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="当前文件" prop="original_name">
        <ElInput v-model="currentName" disabled />
      </ElFormItem>
      <ElFormItem label="新文件名" prop="name">
        <ElInput v-model="form.name" placeholder="请输入新文件名" clearable>
          <template #append>.{{ fileExtension }}</template>
        </ElInput>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchRenameAttachment } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'AttachmentRenameDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const currentName = ref('')
  const fileExtension = ref('')

  const form = reactive<Api.SystemManage.AttachmentRenameParams>({
    name: ''
  })

  const rules = computed<FormRules>(() => ({
    name: [
      { required: true, message: '请输入新文件名', trigger: 'blur' },
      {
        pattern: /^[^\\/:*?"<>|]+$/,
        message: '文件名不能包含特殊字符：\\ / : * ? " < > |',
        trigger: 'blur'
      }
    ]
  }))

  const open = (row: Api.SystemManage.AttachmentListItem) => {
    dialogVisible.value = true
    id.value = row.id
    currentName.value = row.name
    fileExtension.value = row.extension
    form.name = row.name
  }

  const handleSubmit = async () => {
    if (!formRef.value || !id.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchRenameAttachment(id.value, form)
        dialogVisible.value = false
        emit('refresh')
      } catch {
        ElMessage.error('重命名失败，请重试')
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
