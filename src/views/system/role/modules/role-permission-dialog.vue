<template>
  <ElDialog
    v-model="dialogVisible"
    :title="`分配权限 - ${roleName}`"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElAlert
      v-if="loading"
      title="加载中..."
      type="info"
      :closable="false"
      style="margin-bottom: 12px"
    />

    <ElCheckboxGroup v-else v-model="checkedIds">
      <div v-for="group in groupedPermissions" :key="group.resource" style="margin-bottom: 16px">
        <div style="margin-bottom: 8px; font-weight: 600">{{ group.label }}</div>
        <ElCheckbox
          v-for="perm in group.items"
          :key="perm.id"
          :value="perm.id"
          style="display: block; margin-bottom: 4px; margin-left: 16px"
        >
          {{ permissionLabel(perm) }}
          <span style="font-size: 12px; color: #999">（{{ perm.name }}）</span>
        </ElCheckbox>
      </div>
    </ElCheckboxGroup>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchAssignRolePermissions,
    fetchGetAllPermissions,
    fetchGetRolePermissions
  } from '@/api/system-manage'

  defineOptions({ name: 'RolePermissionDialog' })

  const dialogVisible = ref(false)
  const loading = ref(false)
  const submitting = ref(false)
  const roleId = ref<number | null>(null)
  const roleName = ref('')
  const allPermissions = ref<Api.SystemManage.PermissionItem[]>([])
  const checkedIds = ref<number[]>([])

  // 按权限名第一段（资源名）分组
  const groupedPermissions = computed(() => {
    const map = new Map<
      string,
      { resource: string; label: string; items: Api.SystemManage.PermissionItem[] }
    >()

    for (const perm of allPermissions.value) {
      const parts = perm.name.split('.')
      const resource = parts[0] || 'other'
      if (!map.has(resource)) {
        map.set(resource, { resource, label: resourceLabel(resource), items: [] })
      }
      map.get(resource)!.items.push(perm)
    }

    return Array.from(map.values())
  })

  const resourceLabel = (resource: string): string => {
    const labels: Record<string, string> = {
      admins: '管理员管理',
      roles: '角色管理',
      menus: '菜单管理',
      settings: '系统配置',
      areas: '地区管理'
    }
    return labels[resource] || resource
  }

  const actionLabels: Record<string, string> = {
    index: '列表',
    list: '列表',
    view: '查看',
    show: '查看',
    create: '新增',
    store: '新增',
    edit: '编辑',
    update: '编辑',
    delete: '删除',
    destroy: '删除',
    export: '导出',
    import: '导入'
  }

  // 权限中文名：优先使用后端 display_name，否则从 name（resource.action）推导
  const permissionLabel = (perm: Api.SystemManage.PermissionItem): string => {
    if (perm.display_name) return perm.display_name
    const parts = perm.name.split('.')
    const action = parts[parts.length - 1]
    return actionLabels[action] || action
  }

  const open = async (row: Api.SystemManage.RoleListItem) => {
    roleId.value = row.id
    roleName.value = row.name
    dialogVisible.value = true
    loading.value = true
    try {
      const [all, checked] = await Promise.all([
        fetchGetAllPermissions(),
        fetchGetRolePermissions(row.id)
      ])
      allPermissions.value = all || []
      checkedIds.value = checked || []
    } finally {
      loading.value = false
    }
  }

  const handleSubmit = async () => {
    if (roleId.value === null) return
    submitting.value = true
    try {
      await fetchAssignRolePermissions(roleId.value, checkedIds.value)
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    checkedIds.value = []
    allPermissions.value = []
    dialogVisible.value = false
  }

  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
