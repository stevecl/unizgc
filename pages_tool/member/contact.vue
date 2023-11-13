<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view class="contact">
		<image :src="$util.img('public/uniapp/member/contact_service.png')" mode="widthFix"></image>
		<ns-contact><button type="primary">联系客服</button></ns-contact>
	</view>
</template>

<script>
export default {
	data() {
		return {};
	},
	onLoad(options) {},
	onShow() {},
	methods: {}
};
</script>

<style lang="scss">
.contact {
	width: 80%;
	text-align: center;
	margin: 0 auto;
	image {
		width: 500rpx;
	}
}
</style>
