<template>
  <ElDialog
    v-model="dialogVisible"
    title="编辑用户"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="用户名" prop="username">
        <ElInput v-model="form.username" placeholder="用户名" disabled clearable />
      </ElFormItem>
      <ElFormItem label="昵称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入昵称" clearable />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="form.email" placeholder="请输入邮箱" clearable />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="form.phone" placeholder="请输入手机号" clearable />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio :value="1">正常</ElRadio>
          <ElRadio :value="0">冻结</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchUpdateUser } from '@/api/user-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'UserEditDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)

  const form = reactive({
    username: '',
    name: '',
    email: '',
    phone: '',
    status: 1 as number
  })

  const rules = computed<FormRules>(() => ({
    name: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ]
  }))

  const open = (row: Api.UserManage.UserListItem) => {
    dialogVisible.value = true
    id.value = row.id
    Object.assign(form, {
      username: row.username,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      status: row.status.value
    })
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchUpdateUser(id.value!, {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          status: form.status
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
