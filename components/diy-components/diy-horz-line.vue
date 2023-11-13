<template>
	<view :style="{ borderTop: '2rpx ' + value.borderStyle + ' ' + value.color }"></view>
</template>

<script>
// 辅助线
export default {
	name: 'diy-horz-line',
	props: {
		value: {
			type: Object
		}
	},
	data() {
		return {};
	},
	watch: {
		// 组件刷新监听
		componentRefresh: function(nval) {}
	},
	methods: {}
};
</script>

<style></style>
