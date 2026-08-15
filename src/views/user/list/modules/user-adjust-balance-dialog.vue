<template>
  <ElDialog
    v-model="dialogVisible"
    title="调整用户余额"
    width="460px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElAlert
      :title="`当前积分: ${currentPoints}  |  当前金币: ${currentCoins}`"
      type="info"
      :closable="false"
      class="mb-4"
    />
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="用户名">
        <ElInput :value="username" disabled />
      </ElFormItem>
      <ElFormItem label="类型" prop="type">
        <ElRadioGroup v-model="form.type">
          <ElRadio value="points">积分</ElRadio>
          <ElRadio value="coins">金币</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="变动值" prop="amount">
        <ElInputNumber
          v-model="form.amount"
          :min="-999999"
          :max="999999"
          :step="1"
          placeholder="正数增加，负数扣减"
          style="width: 100%"
        />
        <div class="form-tip">正数增加余额，负数扣减余额（不低于0）</div>
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

  defineOptions({ name: 'UserAdjustBalanceDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const username = ref('')
  const currentPoints = ref(0)
  const currentCoins = ref(0)

  const form = reactive({
    type: 'points' as 'points' | 'coins',
    amount: 0
  })

  const rules = computed<FormRules>(() => ({
    type: [{ required: true, message: '请选择类型', trigger: 'change' }],
    amount: [{ required: true, message: '请输入变动值', trigger: 'blur' }]
  }))

  const open = (row: Api.UserManage.UserListItem) => {
    dialogVisible.value = true
    id.value = row.id
    username.value = row.username
    currentPoints.value = row.available_points
    currentCoins.value = row.available_coins
    form.type = 'points'
    form.amount = 0
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchAdjustUserBalance(id.value!, {
          type: form.type,
          amount: form.amount
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
