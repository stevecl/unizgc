<template>
	<!-- #ifdef MP -->
	<view v-if="value.isShow">
		<official-account></official-account>
	</view>
	<!--#endif -->
</template>

<script>
	// 关注公众号
	export default {
		name: 'diy-follow-official-account',
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