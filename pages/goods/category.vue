<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view>
		<block v-if="diyData">
			<block v-for="(item, index) in diyData.value" :key="index">
				<view v-if="item.componentName == 'GoodsCategory'">
					<diy-category @tologin="toLogin" ref="category" :value="item"></diy-category>
				</view>
			</block>
		</block>
		
		<ns-login ref="login"></ns-login>
		<loading-cover ref="loadingCover"></loading-cover>

		<!-- 底部tabBar -->
		<view id="tab-bar">
			<diy-bottom-nav></diy-bottom-nav>
		</view>
	</view>
</template>

<script>
export default {
	components: {},
	data() {
		return {
			diyData: null
		};
	},
	onLoad() {
		uni.hideTabBar();
		this.getDiyInfo();
	},
	onShow() {
		if (this.$refs.category) this.$refs.category[0].pageShow();
	},
	methods: {
		getDiyInfo() {
			this.$api.sendRequest({
				url: '/api/diyview/info',
				data: {
					name: 'DIY_VIEW_GOODS_CATEGORY'
				},
				success: res => {
					if (res.code == 0 && res.data) {
						this.diyData = res.data;
						if (this.diyData.value) {
							this.diyData = JSON.parse(this.diyData.value);
							if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
						}
						uni.stopPullDownRefresh();
					}
				}
			});
		},
		toLogin(){
			this.$refs.login.open('/pages/goods/category')
		}
	},
	onPullDownRefresh(){
		uni.hideTabBar();
		this.getDiyInfo();
	}
};
</script>

<style lang="scss">
/deep/ .uni-popup__wrapper.uni-center {
	background: rgba(0, 0, 0, 0.6);
}
/deep/ .uni-popup__wrapper-box {
	border-radius: 0!important;
}
/deep/ .uni-popup__wrapper.uni-custom.center .uni-popup__wrapper-box {
	overflow-y: visible;
}
/deep/ .loading-layer {
	background: #fff!important;
}

// 分类四一级展开
/deep/ .category-template-4 .template-four .uni-popup__wrapper-box{
	border-radius: 0px 0px 14px 14px !important;
	overflow: hidden;
}
/deep/ .category-template-4 .content-wrap .categoty-goods-wrap .goods-list{
	margin-top: 30rpx;
}
/deep/ .category-template-4 .content-wrap .goods-list .goods-item .footer-wrap .right-wrap .num-action{
	width: 46rpx;
	height: 46rpx;
}
/deep/ .uni-page-refresh-inner .uni-page-refresh__path{
	stroke: rgb(1,1,1) !important;
}
</style>