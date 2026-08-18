<template>
  <div ref="chartRef" class="metrics-chart"></div>
</template>

<script setup lang="ts">
  import { echarts, type EChartsOption } from '@/plugins/echarts'
  import { useSettingStore } from '@/store/modules/setting'
  import { getCssVar } from '@/utils/ui'
  import { storeToRefs } from 'pinia'
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import type { HorizonMetricSnapshot } from '@/api/queue'

  const props = defineProps<{
    snapshots: HorizonMetricSnapshot[]
    title: string
    type: 'job' | 'queue'
  }>()

  const chartRef = ref<HTMLElement>()
  let chart: echarts.ECharts | null = null
  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)

  function safeHex(color: string): string {
    const c = color.trim()
    if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(c)) return c
    return '#409eff'
  }

  function themeColor(): string {
    return safeHex(getCssVar('--el-color-primary'))
  }

  function secondaryColor(): string {
    return safeHex(getCssVar('--el-color-success'))
  }

  function buildOption(): EChartsOption {
    const primary = themeColor()
    const secondary = secondaryColor()
    const isDarkMode = isDark.value
    const textColor = isDarkMode ? '#aaa' : '#666'
    const splitLineColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

    const labels = props.snapshots.map((s) => s.time)
    const runtimes = props.snapshots.map((s) => s.runtime)
    const throughputs = props.snapshots.map((s) => s.throughput)

    return {
      title: {
        text: props.title,
        left: 'center',
        textStyle: { fontSize: 13, fontWeight: 500, color: textColor }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
        borderColor: isDarkMode ? '#333' : '#ddd',
        borderWidth: 1,
        textStyle: { color: isDarkMode ? '#fff' : '#333' }
      },
      legend: {
        data: ['运行时间', '吞吐量'],
        bottom: 0,
        textStyle: { color: textColor }
      },
      grid: { left: 50, right: 50, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: textColor, fontSize: 10 },
        axisLine: { lineStyle: { color: splitLineColor } }
      },
      yAxis: [
        {
          type: 'value',
          name: '秒',
          nameTextStyle: { color: textColor, fontSize: 10 },
          axisLabel: { color: textColor, fontSize: 10 },
          splitLine: { lineStyle: { color: splitLineColor } }
        },
        {
          type: 'value',
          name: '吞吐',
          nameTextStyle: { color: textColor, fontSize: 10 },
          axisLabel: { color: textColor, fontSize: 10 },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '运行时间',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: runtimes,
          itemStyle: { color: primary },
          lineStyle: { width: 2, color: primary },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: primary + '30' },
              { offset: 1, color: primary + '00' }
            ])
          }
        },
        {
          name: '吞吐量',
          type: 'bar',
          yAxisIndex: 1,
          data: throughputs,
          itemStyle: { color: secondary, opacity: 0.5 },
          barWidth: '60%'
        }
      ]
    }
  }

  function renderChart() {
    if (!chartRef.value || !props.snapshots.length) return
    if (!chart) chart = echarts.init(chartRef.value)
    chart.setOption(buildOption(), true)
  }

  function handleResize() {
    chart?.resize()
  }

  onMounted(() => {
    renderChart()
    window.addEventListener('resize', handleResize)
  })

  watch(() => props.snapshots, renderChart, { deep: true })
  watch(isDark, renderChart)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    chart?.dispose()
    chart = null
  })
</script>

<style scoped>
  .metrics-chart {
    width: 100%;
    height: 240px;
  }
</style>
