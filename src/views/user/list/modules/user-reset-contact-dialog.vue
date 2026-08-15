<template>
  <ElDialog
    v-model="dialogVisible"
    :title="`重置用户${contactType === 'email' ? '邮箱' : '手机号'}`"
    width="420px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="用户名">
        <ElInput :value="username" disabled />
      </ElFormItem>
      <ElFormItem :label="contactType === 'email' ? '新邮箱' : '新手机号'" prop="value">
        <ElInput
          v-model="form.value"
          :placeholder="contactType === 'email' ? '请输入新邮箱' : '请输入新手机号'"
          clearable
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认重置</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchResetUserContact } from '@/api/user-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'UserResetContactDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const username = ref('')
  const contactType = ref<'email' | 'phone'>('email')

  const form = reactive({
    value: ''
  })

  const rules = computed<FormRules>(() => ({
    value: [{ required: true, message: '请输入新的联系方式', trigger: 'blur' }]
  }))

  const open = (row: Api.UserManage.UserListItem, type: 'email' | 'phone') => {
    dialogVisible.value = true
    id.value = row.id
    username.value = row.username
    contactType.value = type
    form.value = ''
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchResetUserContact(id.value!, {
          type: contactType.value,
          value: form.value
        })
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

<style scoped lang="scss"></style>
