<template>
  <ElDialog
    v-model="dialogVisible"
    :title="`分配权限 - ${roleName}`"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading" class="permission-tree-wrapper">
      <ElTree
        ref="treeRef"
        :data="treeData"
        show-checkbox
        node-key="key"
        :props="{ label: 'label', children: 'children' }"
        :default-checked-keys="checkedKeys"
      />
    </div>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { ElTree } from 'element-plus'
  import {
    fetchAssignRolePermissions,
    fetchGetAllPermissions,
    fetchGetMenuTree,
    fetchGetRolePermissions
  } from '@/api/system-manage'

  defineOptions({ name: 'RolePermissionDialog' })

  interface PermissionTreeNode {
    key: string
    label: string
    permissionId?: number
    children?: PermissionTreeNode[]
  }

  const dialogVisible = ref(false)
  const loading = ref(false)
  const submitting = ref(false)
  const treeRef = ref<InstanceType<typeof ElTree>>()
  const roleId = ref<number | null>(null)
  const roleName = ref('')

  // 权限 name → permissions 表 id 的映射
  const permissionNameToId = ref<Map<string, number>>(new Map())
  // 菜单树转换后的权限树
  const treeData = ref<PermissionTreeNode[]>([])
  // 初始选中的按钮节点 key（key 为按钮菜单 id，提交时需要映射成 permission id）
  const checkedKeys = ref<string[]>([])
  // 按钮节点 key → permissionId 的映射（用于提交时转换）
  const buttonKeyToPermissionId = ref<Map<string, number>>(new Map())

  // 将后端菜单树递归转换为权限树，只保留目录/菜单/按钮节点
  const transformMenuTree = (menus: Api.SystemManage.MenuTreeItem[]): PermissionTreeNode[] => {
    const result: PermissionTreeNode[] = []

    for (const menu of menus) {
      // 跳过外链/iframe 等无权限节点和禁用节点
      if (!menu.is_enable) continue
      if (menu.type.value === 3 || menu.type.value === 4) continue

      if (menu.type.value === 2) {
        // 按钮节点
        if (!menu.permission) continue
        const permissionId = permissionNameToId.value.get(menu.permission)
        if (permissionId === undefined) continue
        const key = `btn-${menu.id}`
        buttonKeyToPermissionId.value.set(key, permissionId)
        result.push({
          key,
          label: menu.title,
          permissionId
        })
      } else {
        // 目录/菜单节点：递归处理子节点
        const children = transformMenuTree(menu.children || [])
        if (children.length > 0) {
          result.push({
            key: `menu-${menu.id}`,
            label: menu.title,
            children
          })
        }
      }
    }

    return result
  }

  // 收集所有按钮节点 key，用于根据已分配权限回显选中状态
  const collectCheckedKeys = (
    nodes: PermissionTreeNode[],
    assignedPermissionIds: Set<number>
  ): string[] => {
    const keys: string[] = []
    for (const node of nodes) {
      if (node.permissionId !== undefined && assignedPermissionIds.has(node.permissionId)) {
        keys.push(node.key)
      }
      if (node.children) {
        keys.push(...collectCheckedKeys(node.children, assignedPermissionIds))
      }
    }
    return keys
  }

  const open = async (row: Api.SystemManage.RoleListItem) => {
    roleId.value = row.id
    roleName.value = row.name
    dialogVisible.value = true
    loading.value = true

    // 重置状态
    buttonKeyToPermissionId.value = new Map()
    checkedKeys.value = []
    treeData.value = []

    try {
      // 并行加载：权限映射表、菜单树、角色已有权限
      const [allPermissions, menuTree, assignedIds] = await Promise.all([
        fetchGetAllPermissions(),
        fetchGetMenuTree(),
        fetchGetRolePermissions(row.id)
      ])

      // 建立 name → id 映射
      permissionNameToId.value = new Map((allPermissions || []).map((p) => [p.name, p.id]))

      // 转换菜单树
      treeData.value = transformMenuTree(menuTree || [])

      // 回显选中状态
      const assignedSet = new Set(assignedIds || [])
      checkedKeys.value = collectCheckedKeys(treeData.value, assignedSet)
    } finally {
      loading.value = false
    }
  }

  const handleSubmit = async () => {
    if (roleId.value === null) return
    submitting.value = true
    try {
      // ElTree getCheckedKeys 返回选中节点的 key，过滤出按钮节点
      const checkedButtonKeys = (treeRef.value?.getCheckedKeys(false) || []) as string[]
      const permissionIds = new Set<number>()

      for (const key of checkedButtonKeys) {
        const pid = buttonKeyToPermissionId.value.get(key)
        if (pid !== undefined) permissionIds.add(pid)
      }

      // 半选的父节点对应的按钮也要包含（但按钮是叶子节点，半选只影响目录/菜单，不会产生权限 id）
      await fetchAssignRolePermissions(roleId.value, Array.from(permissionIds))
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .permission-tree-wrapper {
    max-height: 480px;
    padding: 8px;
    overflow-y: auto;
  }
</style>
