<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view :style="{ backgroundColor: bgColor, minHeight: openBottomNav ? 'calc(100vh - 55px)' : '' }" class="page-img">
		<view class="site-info-box"
			v-if="$util.isWeiXin() && followOfficialAccount && followOfficialAccount.isShow && wechatQrcode">
			<view class="site-info">
				<view class="img-box" v-if="siteInfo.logo_square">
					<image :src="$util.img(siteInfo.logo_square)" mode="aspectFill"></image>
				</view>
				<view class="info-box" :style="{ color: '#ffffff' }">
					<text class="font-size-base">{{ siteInfo.site_name }}</text>
					<text>{{ followOfficialAccount.welcomeMsg }}</text>
				</view>
			</view>
			<view class="dite-button" @click="officialAccountsOpen">关注公众号</view>
		</view>

		<view class="page-header" v-if="diyData.global && diyData.global.navBarSwitch"
			:style="{ backgroundImage: bgImg }">
			<ns-navbar :title-color="textNavColor" :data="diyData.global" :scrollTop="scrollTop"
				:isBack="false"></ns-navbar>
		</view>

		<diy-index-page v-if="topIndexValue" ref="indexPage" :value="topIndexValue" :bgUrl="bgUrl"
			:scrollTop="scrollTop" :diyGlobal="diyData.global" class="diy-index-page">
			<template v-slot:components>
				<diy-group ref="diyGroup" v-if="diyData.value" :diyData="diyData" :scrollTop="scrollTop"
					:haveTopCategory="true" :followOfficialAccount="followOfficialAccount"></diy-group>
			</template>
			<template v-slot:default>
				<ns-copyright></ns-copyright>
			</template>
		</diy-index-page>

		<view v-else class="bg-index"
			:style="{ backgroundImage: backgroundUrl, paddingTop: paddingTop, marginTop: marginTop }">
			<diy-group ref="diyGroup" v-if="diyData.value" :diyData="diyData" :scrollTop="scrollTop"
				:followOfficialAccount="followOfficialAccount"></diy-group>
			<ns-copyright></ns-copyright>
		</view>

		<template
			v-if="diyData.global && diyData.global.popWindow && diyData.global.popWindow.count != -1 && diyData.global.popWindow.imageUrl">
			<view @touchmove.prevent.stop>
				<uni-popup ref="uniPopupWindow" type="center" class="wap-floating" :maskClick="false">
					<view class="image-wrap">
						<image :src="$util.img(diyData.global.popWindow.imageUrl)" :style="popWindowStyle"
							@click="uniPopupWindowFn()" mode="aspectFit"></image>
					</view>
					<text class="iconfont icon-round-close" @click="closePopupWindow"></text>
				</uni-popup>
			</view>
		</template>

		<!-- 底部tabBar -->
		<view class="page-bottom" v-if="openBottomNav"><diy-bottom-nav @callback="callback"
				:name="name"></diy-bottom-nav></view>

		<!-- 关注公众号弹窗 -->
		<view @touchmove.prevent class="official-accounts-inner" v-if="wechatQrcode">
			<uni-popup ref="officialAccountsPopup" type="center">
				<view class="official-accounts-wrap">
					<image class="content" :src="$util.img(wechatQrcode)" mode="aspectFit"></image>
					<text class="desc">关注了解更多</text>
					<text class="close iconfont icon-round-close" @click="officialAccountsClose"></text>
				</view>
			</uni-popup>
		</view>

		<!-- 收藏 -->
		<uni-popup ref="collectPopupWindow" type="top" class="wap-floating wap-floating-collect">
			<view v-if="showTip" class="collectPopupWindow"
				:style="{ marginTop: (collectTop + statusBarHeight) * 2 + 'rpx' }">
				<image :src="$util.img('public/uniapp/index/collect2.png')" mode="aspectFit"></image>
				<text @click="closeCollectPopupWindow">我知道了</text>
			</view>
		</uni-popup>

		<!-- 选择门店弹出框，定位当前位置，展示最近的一个门店 -->
		<view @touchmove.prevent.stop class="choose-store">
			<uni-popup ref="chooseStorePopup" type="center" :maskClick="false" class="choose-store">
				<view class="choose-store-popup">
					<view class="head-wrap" @click="closeChooseStorePopup">请确认门店</view>
					<view class="position-wrap">
						<text class="iconfont icon-dizhi"></text>
						<text class="address">{{ currentPosition }}</text>
						<view class="reposition" @click="reposition"
							v-if="globalStoreConfig && globalStoreConfig.is_allow_change == 1">
							<text class="iconfont icon-dingwei"></text>
							<text>重新定位</text>
						</view>
					</view>
					<view class="store-wrap" v-if="nearestStore">
						<text class="tag">当前门店</text>
						<view class="store-name">{{ nearestStore.store_name }}</view>
						<view class="address">{{ nearestStore.show_address }}</view>
						<view class="distance" v-if="nearestStore.distance">
							<text class="iconfont icon-dizhi"></text>
							<text>{{ nearestStore.distance > 1 ? nearestStore.distance + 'km' : nearestStore.distance * 1000 + 'm' }}</text>
						</view>
					</view>
					<button type="primary" @click="enterStore">确认进入</button>
					<view class="other-store" @click="chooseOtherStore"
						v-if="globalStoreConfig && globalStoreConfig.is_allow_change == 1">
						<text>选择其他门店</text>
						<text class="iconfont icon-right"></text>
					</view>
				</view>
			</uni-popup>
		</view>

		<loading-cover ref="loadingCover"></loading-cover>
	</view>
</template>

<script>
	import uniPopup from '@/components/uni-popup/uni-popup.vue';
	import nsNavbar from '@/components/ns-navbar/ns-navbar.vue';
	import diyJs from '@/common/js/diy.js';
	import indexJs from './public/js/index.js';

	export default {
		components: {
			uniPopup,
			nsNavbar
		},
		mixins: [diyJs, indexJs]
	};
</script>

<style lang="scss">
	@import '@/common/css/diy.scss';
	@import './public/css/index.scss';
</style>
<style scoped>
	.wap-floating>>>.uni-popup__wrapper.uni-custom .uni-popup__wrapper-box {
		background: none !important;
	}

	.choose-store>>>.goodslist-uni-popup-box {
		width: 80%;
	}

	/deep/.diy-index-page .uni-popup .uni-popup__wrapper-box {
		border-radius: 0;
	}

	/deep/ .placeholder {
		height: 0;
	}

	/deep/::-webkit-scrollbar {
		width: 0;
		height: 0;
		background-color: transparent;
		display: none;
	}
</style>