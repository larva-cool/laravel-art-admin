<template>
  <ElDialog
    v-model="dialogVisible"
    title="重置用户密码"
    width="420px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="用户名">
        <ElInput :value="username" disabled />
      </ElFormItem>
      <ElFormItem label="新密码" prop="password">
        <ElInput
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入新密码（至少8位）"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="确认密码" prop="password_confirmation">
        <ElInput
          v-model="form.password_confirmation"
          type="password"
          show-password
          placeholder="请再次输入新密码"
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
  import { fetchResetUserPassword } from '@/api/user-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'UserResetPasswordDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const username = ref('')

  const form = reactive({
    password: '',
    password_confirmation: ''
  })

  const validateConfirm = (_rule: any, value: string, callback: any) => {
    if (value !== form.password) {
      callback(new Error('两次输入的密码不一致'))
    } else {
      callback()
    }
  }

  const rules = computed<FormRules>(() => ({
    password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, message: '密码至少 8 个字符', trigger: 'blur' }
    ],
    password_confirmation: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      { validator: validateConfirm, trigger: 'blur' }
    ]
  }))

  const open = (row: Api.UserManage.UserListItem) => {
    dialogVisible.value = true
    id.value = row.id
    username.value = row.username
    form.password = ''
    form.password_confirmation = ''
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchResetUserPassword(id.value!, form.password)
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
