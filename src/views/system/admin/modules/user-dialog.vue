<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑管理员' : '新增管理员'"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="用户名" prop="username">
        <ElInput v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" clearable />
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
      <ElFormItem label="密码" prop="password">
        <ElInput
          v-model="form.password"
          type="password"
          show-password
          :placeholder="isEdit ? '留空则不修改' : '请输入密码'"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio :value="1">正常</ElRadio>
          <ElRadio :value="0">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="角色" prop="roles">
        <ElSelect v-model="form.roles" multiple placeholder="请选择角色" style="width: 100%">
          <ElOption
            v-for="role in roleOptions"
            :key="role.id"
            :value="role.name"
            :label="role.name"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateAdmin, fetchGetRoleList, fetchUpdateAdmin } from '@/api/system-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'AdminEditDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)

  const roleOptions = ref<Api.SystemManage.RoleListItem[]>([])

  const form = reactive({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 1 as number,
    roles: [] as string[]
  })

  const rules = computed<FormRules>(() => ({
    username: [
      { required: !isEdit.value, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
    ],
    name: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    password: isEdit.value
      ? [{ min: 8, message: '密码至少 8 个字符', trigger: 'blur' }]
      : [{ required: true, message: '请输入密码', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }))

  const open = async (row?: Api.SystemManage.AdminListItem) => {
    dialogVisible.value = true
    // 加载角色选项
    if (roleOptions.value.length === 0) {
      const res = await fetchGetRoleList({ page: 1, per_page: 100 })
      roleOptions.value = res?.data || []
    }

    if (row) {
      id.value = row.id
      Object.assign(form, {
        username: row.username,
        name: row.name,
        email: row.email || '',
        phone: row.phone || '',
        password: '',
        status: row.status.value,
        roles: row.roles || []
      })
    } else {
      id.value = null
      Object.assign(form, {
        username: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        status: 1,
        roles: []
      })
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        if (isEdit.value && id.value) {
          await fetchUpdateAdmin(id.value, {
            name: form.name,
            email: form.email || null,
            phone: form.phone || null,
            password: form.password || null,
            status: form.status,
            roles: form.roles
          })
        } else {
          await fetchCreateAdmin({
            username: form.username,
            name: form.name,
            email: form.email || null,
            phone: form.phone || null,
            password: form.password,
            status: form.status,
            roles: form.roles
          })
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

<style scoped lang="scss"></style>
