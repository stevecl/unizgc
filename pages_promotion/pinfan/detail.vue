<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view>
		<!-- #ifndef H5 -->
		<view class="page-header"
			v-if="goodsSkuDetail && goodsSkuDetail.config && goodsSkuDetail.config.nav_bar_switch == 0">
			<ns-navbar :data="navbarData" :isBack="true"></ns-navbar>
		</view>
		<!-- #endif -->

		<goods-detail-view :goodsSkuDetail="goodsSkuDetail" ref="goodsDetailView">
			<!-- 价格区域 -->
			<template v-slot:price>
				<view v-if="goodsSkuDetail.timeMachine" class="goods-promotion">
					<view class="price-info">
						<view class="icon-box"><text class="iconfont icon-pintuanfanli"></text></view>
						<view class="price-box">
							<view class="promotion-text">拼团返利</view>
							<view class="sale-num">
								<view class="pintuan-num">{{ goodsSkuDetail.pintuan_num }}人拼</view>
								<view v-if="goodsSkuDetail.sale_show">
									已成团{{ goodsSkuDetail.order_num }}{{ goodsSkuDetail.unit }}</view>
							</view>
						</view>
					</view>
					<view class="countdown">
						<view class="txt">距结束仅剩</view>
						<view class="clockrun">
							<uni-count-down :day="goodsSkuDetail.timeMachine.d" :hour="goodsSkuDetail.timeMachine.h"
								:minute="goodsSkuDetail.timeMachine.i" :second="goodsSkuDetail.timeMachine.s"
								splitorColor="#ffffff" backgroundColor="#ffffff" />
						</view>
					</view>
				</view>

				<view class="group-wrap padding-top">
					<view class="goods-module-wrap">
						<text class="promotion-tag ">拼团价</text>
						<text class="price-symbol price-font">￥</text>
						<text class="price price-font">
							{{
								parseFloat(goodsSkuDetail.pintuan_price)
									.toFixed(2)
									.split('.')[0]
							}}
						</text>
						<text class="price-symbol price-font">
							.{{
								parseFloat(goodsSkuDetail.pintuan_price)
									.toFixed(2)
									.split('.')[1]
							}}
						</text>

						<view class="market-price-wrap" v-if="goodsSkuDetail.price > 0">
							<text class="unit price-font">￥</text>
							<text class="money price-font">{{ goodsSkuDetail.price }}</text>
						</view>
						<view class="follow-and-share">
							<text class="follow iconfont icon-share" @click="openSharePopup()"></text>
							<text class="share iconfont" @click="editCollection()"
								:class="whetherCollection == 1 ? 'icon-likefill color-base-text' : 'icon-guanzhu'"></text>
						</view>
					</view>
					<view class="goods-module-wrap promotion-price-wrap">
						<!-- <text class="label color-base-text">团长价</text>
				 		<text class="price-symbol color-base-text">{{ $lang('common.currencySymbol') }}</text>
				 		<text class="price color-base-text">{{ goodsSkuDetail.promotion_price }}</text> -->
						拼中得商品，未拼中
						<text class=""
							v-if="goodsSkuDetail.reward_type == 4">返{{ goodsSkuDetail.reward_type_num }}积分</text>
						<text class=""
							v-if="goodsSkuDetail.reward_type == 1 || goodsSkuDetail.reward_type == 2">返￥{{ goodsSkuDetail.reward_type_num }}</text>
						<text class="" v-if="goodsSkuDetail.reward_type == 3">返优惠券</text>
					</view>
					<view class="goods-module-wrap info">
						<text class="sku-name-wrap">{{ goodsSkuDetail.goods_name }}</text>
						<text class="introduction" v-if="goodsSkuDetail.introduction"
							:style="{ color: goodsSkuDetail.config ? goodsSkuDetail.config.introduction_color : '' }">
							{{ goodsSkuDetail.introduction }}
						</text>
						<view class="goods-tag-list" v-if="goodsSkuDetail.label_name">
							<text class="tag-item">{{ goodsSkuDetail.label_name }}</text>
						</view>
						<view class="logistics-wrap">
							<text v-if="goodsSkuDetail.stock_show">库存 {{ goodsSkuDetail.stock }}
								{{ goodsSkuDetail.unit }}</text>
							<text v-if="goodsSkuDetail.sale_show">销量 {{ goodsSkuDetail.sale_num }}
								{{ goodsSkuDetail.unit }}</text>
						</view>
					</view>
				</view>

				<view class="step">
					<view class="step-title font-size-toolbar">拼团返利玩法</view>
					<view class="pin-step">
						<view class="">
							<image :src="$util.img('public/uniapp/pinfan/open_group.png')" mode=""></image>
							<view>
								参与拼团
								<view class="">
									<text class="color-base-text">{{ goodsSkuDetail.pintuan_num }}</text>
									人拼团
								</view>
							</view>
						</view>
						<image :src="$util.img('public/uniapp/pinfan/spot.png')" mode=""></image>
						<view class="">
							<image :src="$util.img('public/uniapp/pinfan/deliver_goods.png')" mode=""></image>
							<view>
								<text class="color-base-text">{{ goodsSkuDetail.chengtuan_num }}</text>
								人拼中发货
								<view class="">
									<text
										class="color-base-text">{{ goodsSkuDetail.pintuan_num - goodsSkuDetail.chengtuan_num }}</text>
									人未中退款
								</view>
							</view>
						</view>
						<image :src="$util.img('public/uniapp/pinfan/spot.png')" mode=""></image>
						<view class="">
							<image :src="$util.img('public/uniapp/pinfan/gift.png')" mode=""></image>
							<view>
								未拼中获得奖励
								<view class="color-base-text">
									<text class="font-size-activity-tag"
										v-if="goodsSkuDetail.reward_type == 4">返{{ goodsSkuDetail.reward_type_num }}积分</text>
									<text class="font-size-activity-tag"
										v-if="goodsSkuDetail.reward_type == 1 || goodsSkuDetail.reward_type == 2">
										返￥{{ goodsSkuDetail.reward_type_num }}
									</text>
									<text class="font-size-activity-tag"
										v-if="goodsSkuDetail.reward_type == 3">返优惠券</text>
								</view>
							</view>
						</view>
					</view>
				</view>
				<view class="group-wrap swiper" v-if="newList.length > 0">
					<!-- 已有拼团块 -->
					<swiper vertical="true" autoplay="true" interval="5000" class="spelling-block">
						<swiper-item v-for="(item, index) in newList" :key="index">
							<view class="item" v-if="item.end_time > timestamp">
								<view class="user-logo">
									<image :src="item.headimg ? $util.img(item.headimg) : $util.getDefaultImage().head"
										@error="pintuanImageError(index)" mode="aspectFill" />
								</view>
								<text class="user-name" v-if="item.nickname">{{ item.nickname }}</text>
								<view class="info">
									<template v-if="item.timeMachine">
										<view class="tip">
											还差
											<text
												class="color-base-text">{{ item.pintuan_num - item.pintuan_count }}人</text>
											拼成
										</view>
										<text class="color-tip font-size-activity-tag">剩余</text>
										<uni-count-down :day="item.timeMachine.d" :hour="item.timeMachine.h"
											:minute="item.timeMachine.i" :second="item.timeMachine.s" color="#909399"
											splitorColor="#909399 !important" background-color="transparent"
											borderColor="transparent" />
									</template>
								</view>

								<template v-if="item.timeMachine">
									<button type="primary" size="mini"
										@click="openPinTuan(item.group_id, item.pintuan_num - item.pintuan_count, item.end_time - item.currentTime, item.headimg, item.head_id)">
										去拼单
									</button>
								</template>
								<template v-else>
									<button disabled size="mini" class="mini">已结束</button>
								</template>
							</view>
						</swiper-item>
					</swiper>
					<view @touchmove.prevent.stop>
						<uni-popup ref="pintuanPopup" type="center" class="pintuan-popup-layer">
							<view class="layer">
								<view class="title">参与的拼单</view>
								<view class="info" v-if="currentPintuan">
									仅剩
									<text class="color-base-text">{{ currentPintuan.pintuan_num }}</text>
									个名额，
									<uni-count-down v-if="openPopup" :day="currentPintuan.timeMachine.d"
										:hour="currentPintuan.timeMachine.h" :minute="currentPintuan.timeMachine.i"
										:second="currentPintuan.timeMachine.s" color="#333" splitorColor="#333"
										background-color="transparent" borderColor="transparent" />
									<text>后结束</text>
								</view>
								<image class="mask-layer-spelling-close"
									:src="$util.img('public/uniapp/goods/mask_layer_pintuan_close.png')"
									@click="closePinTuanPopup()" />
								<view class="user-list">
									<scroll-view scroll-x class="imgX">
										<view class="item">
											<text class="boss color-base-bg">拼主</text>
											<image
												:src="currentPintuan.headimg != '' ? $util.img(currentPintuan.headimg) : $util.getDefaultImage().head"
												@error="currentPintuan.headimg = $util.getDefaultImage().head"
												mode="aspectFill" />
										</view>
										<view class="item">
											<image :src="$util.img('public/uniapp/common/spelling_who.png')" />
										</view>
									</scroll-view>
								</view>
								<button type="primary" @click="joinPintuan()">参与拼单</button>
							</view>
						</uni-popup>
					</view>
				</view>
			</template>

			<!-- 入口区域 -->
			<template v-slot:entrance>
				<!-- 已选规格 -->
				<view class="item selected-sku-spec" v-if="goodsSkuDetail.sku_spec_format" @click="pintuan">
					<view class="label">选择</view>
					<view class="box">
						<text v-for="(item, index) in goodsSkuDetail.sku_spec_format"
							:key="index">{{ item.spec_name }}/{{ item.spec_value_name }}</text>
					</view>
					<text class="iconfont icon-right"></text>
					<!-- <view class="img-wrap"><image :src="$util.img('public/uniapp/goods/detail_more.png')" mode="aspectFit" /></view> -->
				</view>
			</template>

			<!-- 业务区域 -->
			<template v-slot:business>
				<!-- SKU选择 -->
				<ns-goods-sku v-if="goodsSkuDetail.goods_id" ref="goodsSku" @refresh="refreshGoodsSkuDetail"
					:goods-id="goodsSkuDetail.goods_id" :goods-detail="goodsSkuDetail"></ns-goods-sku>
			</template>

			<!-- 参与流程 -->
			<template v-slot:articipation>
				<!-- 活动规则 -->
				<view class="goods-detail-tab rule-wrap" v-if="goodsSkuDetail.remark">
					<view class="detail-tab">
						<view class="tab-item">活动规则</view>
					</view>
					<view class="content">{{ goodsSkuDetail.remark }}</view>
				</view>
			</template>

			<!-- 操作区域 -->
			<template v-slot:action>
				<!-- 商品底部导航 -->
				<ns-goods-action :safeArea="isIphoneX">
					<template v-if="goodsSkuDetail.goods_state == 1">

						<!-- 拼团弹层 -->
						<view class="mask" v-if="pinfanPopShow" @click="pinfanPopShow = false"></view>

						<view class="pintuan-pop" v-if="pinfanPopShow && groupDetail">
							<block v-if="groupDetail.status == 2">
								<view class="pintuan-pop-head">
									<view class="pintuan-headimg">
										<image
											:src="$util.img(groupDetail.headimg || 'public/uniapp/default_img/head.png')">
										</image>
									</view>
									<view class="pintuan-txt">
										<text>{{ cutStrByte(groupDetail.nickname, 8) || '好友' }}</text>
										邀请你加入TA的团
									</view>
								</view>
								<view class="pintuan-pop-time">
									仅剩
									<text>{{ parseInt(groupDetail.pintuan_num - groupDetail.pintuan_count) }}</text>
									个名额，距结束
									<uni-count-down :day="groupDetail.timeMachine.d" :hour="groupDetail.timeMachine.h"
										:minute="groupDetail.timeMachine.i" :second="groupDetail.timeMachine.s"
										color="#FFF" splitorColor="#000000" backgroundColor="#000000" />
								</view>

								<view class="pintuan-pop-member" v-if="groupDetail.pintuan_num <= 5">
									<view class="member-item" v-for="(item, index) in groupDetail.member_list">
										<image
											:src="item.member_img ? $util.img(item.member_img) : $util.img('public/uniapp/default_img/head.png')">
										</image>
										<view v-if="item.member_id == groupDetail.head_id"
											:style="{ background: themeStyle.main_color }">
											<image class="pintuan-text" mode="widthFix"
												:src="$util.img('public/uniapp/pintuan/icon-tuanzhang.png')"></image>
										</view>
									</view>
									<view v-for="item in parseInt(groupDetail.pintuan_num - groupDetail.pintuan_count)"
										class="member-item icon">
										<text class="iconfont icon-add1"></text>
									</view>
								</view>
								<view class="pintuan-pop-member more" v-else>
									<view class="member-item-box">
										<view class="member-item" v-for="(item, index) in groupDetail.member_list"
											v-if="index < 5">
											<image
												:src="item.member_img ? $util.img(item.member_img) : $util.img('public/uniapp/default_img/head.png')">
											</image>
											<view v-if="item.member_id == groupDetail.head_id"
												:style="{ background: themeStyle.main_color }">
												<image class="pintuan-text" mode="widthFix"
													:src="$util.img('public/uniapp/pintuan/icon-tuanzhang.png')">
												</image>
											</view>
										</view>
										<view class="member-item icon"><text class="iconfont icon-caidan"></text></view>
									</view>
									<view class="member-item icon"><text class="iconfont icon-add1"></text></view>
								</view>
							</block>
							<block v-else>
								<view class="pintuan-pop-head">
									<view class="pintuan-headimg">
										<image
											:src="$util.img(groupDetail.headimg || 'public/uniapp/default_img/head.png')">
										</image>
									</view>
									<view class="pintuan-txt">
										<text>{{ cutStrByte(groupDetail.nickname, 8) || '好友' }}</text>
										的团 {{ groupDetail.status == '1' ? '已关闭' : '已完成' }}
									</view>
								</view>

								<view class="pintuan-pop-time">非常抱歉，您来晚了一步~</view>

								<view class="pintuan-pop-member txt">
									<view class="pintuan-member-right">点击下方开团</view>
									<view class="pintuan-member-left">
										<image :src="$util.img('public/uniapp/pintuan/pintuan-down.png')"
											mode="widthFix"></image>
									</view>
								</view>
							</block>
						</view>

						<ns-goods-action-icon text="首页" icon="icon-shouye1" @click="goHome" />
						<ns-goods-action-icon text="客服" icon="icon-kefu" :send-data="contactData"
							:chatParam="chatRoomParams" />
						<ns-goods-action-icon text="购物车" :cornerMarkBg="themeStyle.goods_detail.goods_cart_num_corner"
							icon="icon-gouwuche2" :corner-mark="cartCount > 0 ? cartCount + '' : ''" @click="goCart" />

						<template
							v-if="goodsSkuDetail.goods_stock < goodsSkuDetail.pintuan_num && !goodsSkuDetail.sku_spec_format">
							<ns-goods-action-button class="goods-action-button active4" disabled-text="库存不足"
								:disabled="true" />
						</template>

						<template v-else>
							<ns-goods-action-button v-if="goodsSkuDetail.is_single_buy == 1" class="goods-action-button"
								:text-price="'¥ ' + goodsSkuDetail.price" text="单独购买"
								:class="goodsSkuDetail.is_single_buy == 1 ? 'active1' : ''"
								:backgroundColor="themeStyle.goods_detail.goods_btn_color_shallow" @click="buyNow" />

							<ns-goods-action-button class="goods-action-button"
								:class="goodsSkuDetail.is_single_buy == 1 ? 'active2' : 'active4'"
								:text-price="'¥ ' + goodsSkuDetail.show_price"
								:backgroundColor="themeStyle.goods_detail.goods_btn_color"
								:textColor="themeStyle.btn_text_color"
								:text="groupDetail && groupDetail.status == 2 ? '参与拼团' : '发起拼团'"
								@click="pintuan(false)" />

						</template>
					</template>
					<template v-else>
						<ns-goods-action-button class="goods-action-button active3" disabled-text="该商品已下架"
							:disabled="true" />
					</template>
				</ns-goods-action>
			</template>

			<template v-slot:fixedbtn>
				<!-- 悬浮,别人分享并且在拼团中显示 -->
				<view v-if="groupDetail && groupDetail.status == 2" class="fiexd-icon" @click="pintuan()">
					<view>
						<text>{{ parseFloat(goodsSkuDetail.pintuan_price).toFixed(2) }}元</text>
						<text>去开团</text>
					</view>
					<image mode="widthFix" :src="$util.img('public/uniapp/pintuan/pintuan-join-icon.png')"></image>
				</view>
			</template>
		</goods-detail-view>

		<to-top v-if="showTop" @toTop="scrollToTopNative()"></to-top>
		<ns-login ref="login"></ns-login>
		<loading-cover ref="loadingCover"></loading-cover>
	</view>
</template>

<script>
	import nsGoodsAction from '@/components/ns-goods-action/ns-goods-action.vue';
	import nsGoodsActionIcon from '@/components/ns-goods-action-icon/ns-goods-action-icon.vue';
	import nsGoodsActionButton from '@/components/ns-goods-action-button/ns-goods-action-button.vue';
	import uniPopup from '@/components/uni-popup/uni-popup.vue';
	import nsGoodsSku from '@/components/ns-goods-sku/ns-goods-sku.vue';
	import uniCountDown from '@/components/uni-count-down/uni-count-down.vue';
	import detail from './public/js/detail.js';
	import scroll from '@/common/js/scroll-view.js';
	import goodsDetailBase from '@/common/js/goods_detail_base.js';
	import goodsDetailView from '@/components/goods-detail-view/goods-detail-view.vue';
	import toTop from '@/components/toTop/toTop.vue';

	export default {
		components: {
			nsGoodsAction,
			nsGoodsActionIcon,
			nsGoodsActionButton,
			uniPopup,
			nsGoodsSku,
			uniCountDown,
			goodsDetailView,
			toTop
		},
		mixins: [goodsDetailBase, detail, scroll]
	};
</script>

<style lang="scss">
	@import '@/common/css/goods_detail.scss';
	@import './public/css/detail.scss';
</style>
<style scoped>
	/deep/ .action-icon-wrap .iconfont.icon-shouye1 {
		font-size: 40rpx;
	}

	/deep/ .uni-video-cover {
		background: none;
	}

	/deep/ .uni-video-cover-duration {
		display: none;
	}

	/deep/ .uni-video-cover-play-button {
		border-radius: 50%;
		border: 4rpx solid #fff;
		width: 120rpx;
		height: 120rpx;
		background-size: 30%;
	}

	.poster-layer>>>.uni-popup__wrapper-box {
		max-height: initial !important;
	}

	/deep/ .sku-layer .uni-popup__wrapper-box {
		overflow-y: initial !important;
	}

	.goods-promotion .countdown .clockrun>>>.uni-countdown__number {
		min-width: 32rpx;
		height: 32rpx;
		text-align: center;
		line-height: 32rpx;
		border-radius: 4px;
		display: inline-block;
		padding: 4rpx;
		margin: 0;
		border: none;
	}

	.goods-promotion .countdown .clockrun>>>.uni-countdown__splitor {
		width: 10rpx;
		height: 32rpx;
		line-height: 40rpx;
		text-align: center;
		display: inline-block;
	}

	.goods-promotion .countdown .clockrun>>>.uni-countdown__splitor.day {
		width: initial;
	}

	.spelling-block>>>.uni-countdown__splitor {
		padding: 0;
		font-size: 20rpx;
	}

	.sku-layer>>>.uni-popup__wrapper-box {
		overflow-y: initial !important;
	}

	.poster-layer>>>.uni-popup__wrapper-box {
		max-height: initial !important;
	}

	.spelling-block>>>.uni-countdown__number {
		padding: 0;
		margin: 0;
		font-size: 20rpx;
	}

	.pintuan-popup-layer>>>.uni-popup__wrapper-box {
		overflow-y: initial !important;
		border-radius: 10rpx;
	}

	.pintuan-popup-layer>>>.uni-countdown__number {
		padding: 0;
		margin: 0;
	}

	/deep/ .uni-popup__wrapper.uni-custom .uni-popup__wrapper-box {
		max-height: unset !important;
	}

	/deep/ .goods-action-button.active1 {}

	/deep/ .goods-action-button.active2 {}

	/deep/ .goods-action-button.active3 {}

	/deep/ .goods-action-button.active4 {}

	/deep/ .goods-action-button .action-buttom-wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	/deep/ .goods-action-button.active1 .action-buttom-wrap {
		height: 84rpx;
		line-height: 84rpx;
	}

	/deep/ .goods-action-button.active2 .action-buttom-wrap {
		height: 84rpx;
		line-height: 84rpx;
	}

	/deep/ .goods-action-button.active3 .action-buttom-wrap {
		height: 84rpx;
		line-height: 84rpx;
		margin: 10px 0;
	}

	/deep/ .goods-action-button.active4 .action-buttom-wrap {
		height: 84rpx;
		line-height: 84rpx;
	}

	/deep/ .goods-action-button .action-buttom-wrap text {
		line-height: 1.1;
	}
</style>