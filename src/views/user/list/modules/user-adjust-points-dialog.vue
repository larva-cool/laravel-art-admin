<template>
  <ElDialog
    v-model="dialogVisible"
    title="调整用户积分"
    width="460px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElAlert :title="`当前可用积分：${currentPoints}`" type="info" :closable="false" class="mb-4" />
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="用户名">
        <ElInput :value="username" disabled />
      </ElFormItem>
      <ElFormItem label="变动积分" prop="amount">
        <ElInputNumber
          v-model="form.amount"
          :min="-999999"
          :max="999999"
          :step="1"
          placeholder="正数增加，负数扣减"
          style="width: 100%"
        />
        <div class="form-tip">正数为发放积分，负数为扣减积分，扣减不可超过当前可用积分</div>
      </ElFormItem>
      <ElFormItem label="备注" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入备注信息"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认调整</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchAdjustUserBalance } from '@/api/user-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'UserAdjustPointsDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const username = ref('')
  const currentPoints = ref(0)

  const form = reactive({
    amount: 0,
    description: ''
  })

  const rules = computed<FormRules>(() => ({
    amount: [
      { required: true, message: '请输入变动积分', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (!value) {
            callback(new Error('变动积分不能为 0'))
            return
          }
          if (value < 0 && Math.abs(value) > currentPoints.value) {
            callback(new Error(`扣减积分不能超过当前可用积分 ${currentPoints.value}`))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }))

  const open = (row: Api.UserManage.UserListItem) => {
    dialogVisible.value = true
    id.value = row.id
    username.value = row.username
    currentPoints.value = row.available_points
    form.amount = 0
    form.description = ''
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchAdjustUserBalance(id.value!, {
          type: 'points',
          amount: form.amount,
          description: form.description
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

<style scoped lang="scss">
  .mb-4 {
    margin-bottom: 12px;
  }

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }
</style>
