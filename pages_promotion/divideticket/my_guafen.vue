<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view :class="isIphoneX ? 'iphone-x' : ''">
		<view class="order-nav" v-if="token">
			<view v-for="(statusItem, statusIndex) in statusList" :key="statusIndex" class="uni-tab-item" @click="ontabtap(statusItem.status)">
				<text class="uni-tab-item-title" :class="statusItem.status == status ? 'uni-tab-item-title-active color-base-border  color-base-text' : ''">
					{{ statusItem.name }}
				</text>
			</view>
		</view>
		<mescroll-uni ref="mescroll" top="20" @getData="getMemberCounponList" v-if="token">
			<block slot="list">
				<view class="coupon-listone" v-if="list.length>0">
					<view class="item" v-for="(item, index) in list" :key="index">
						<view class="item-top font-size-tag">
							<view class="use_price color-base-border">发起组队  {{ $util.timeStampTurnTime(item.start_time) }}</view>
							<view class="tag " v-if="item.g_status==2">组队失败</view>
							<view class="tag " v-if="item.g_status==1">组队成功</view>
							<view class="tag " v-if="item.g_status==0">组队中</view>
						</view>
						<view class="item-left">
							<view class="item-flex">
								<view class="item-base">
									<image v-if="item.image" :src="$util.img(item.image)" mode="aspectFit" @error="imageError(index)"></image>
									<image v-else :src="$util.img('public/uniapp/divideticket/coupon_list_img.png')" mode="aspectFit"></image>
								</view>
								<view class="item-info">
									<view class="use_name">{{item.name}}</view>
									<view class="use_title">{{item.divide_num}}名好友瓜分{{ item.money|int}}元优惠券</view>
									<view class="use_time" v-if="item.validity_type">有效期：领取之日起{{ item.fixed_term }}日内有效</view>
									<view class="use_time" v-else>有效期：{{ $util.timeStampTurnTime(item.end_time) }}</view>
								</view>
							</view>
						</view>
						<view class="item-right">
							<view class="use_price color-base-border color-base-text" v-if="item.group_member_list.length==0">+</view>
							<view class="" v-else>
								<view class="image-lists" v-if="item.group_member_list.length>5">
									<image :src="item.group_member_list[0].headimg?$util.img(item.group_member_list[0].headimg):$util.getDefaultImage().head" @error="memberImageError()"></image>
									<image :src="item.group_member_list[1].headimg?$util.img(item.group_member_list[1].headimg):$util.getDefaultImage().head" @error="memberImageError()" class="posi-one"></image>
									<image :src="item.group_member_list[2].headimg?$util.img(item.group_member_list[2].headimg):$util.getDefaultImage().head" @error="memberImageError()" class="posi-two"></image>
									<image :src="item.group_member_list[3].headimg?$util.img(item.group_member_list[3].headimg):$util.getDefaultImage().head" @error="memberImageError()" class="posi-three"></image>
									<image :src="item.group_member_list[4].headimg?$util.img(item.group_member_list[4].headimg):$util.getDefaultImage().head" @error="memberImageError()" class="posi-four"></image>
									<view class="use_price color-base-border color-base-text posi" v-if="item.g_status==1||item.g_status==2"><text class="icon-ellipsis iconfont"></text></view>
									<view class="use_price color-base-border color-base-text posi" v-if="item.g_status==0">+</view>
								</view>
								<view class="img-list" v-else>
									<image :src="items.headimg ? $util.img(items.headimg) : $util.getDefaultImage().head" @error="memberImageError()" v-for="(items,indexs) in item.group_member_list" :key="indexs"></image>
									<view class="use_price color-base-border color-base-text" v-if="item.g_status==0 ">+</view>
								</view>
							</view>
							<view class="tag color-base-bg" @click="toGoodsList(item)" v-if="item.g_status==2&&item.is_look==0">重新组队</view>
							<view class="tag color-base-bg" @click="toGoods(item)" v-if="item.g_status==2&&item.is_look==1">去查看</view>
							<view class="tag color-base-bg" @click="toGoodsList(item)" v-if="item.g_status==1">去查看</view>
							<view class="tag color-base-bg" @click="toGoodsList(item)" v-if="item.g_status==0">组队中</view>
						</view>
					</view>
				</view>
				<view v-else>
					<ns-empty :isIndex="true" :emptyBtn ="{url: '/pages_promotion/divideticket/list',text: '去逛逛'}" text="暂无瓜分订单"></ns-empty>
				</view>
			</block>
		</mescroll-uni>
		<ns-login ref="ns-login"></ns-login>
		<loading-cover ref="loadingCover"></loading-cover>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				type: '',
				types:'',
				state: 1,
				sort: 1,
				list: [],
				isIphoneX: false, //判断手机是否是iphoneX以上
				token: null,
				showEmpty: false,
				status:'',
				statusList:[
					{name:"全部",status:''},
					{name:'组队中',status:'0'},
					{name:'组队成功',status:'1'},
					{name:'组队失败',status:'2'}
				]
			};
		},
		onLoad(data) {
			this.isIphoneX = this.$util.uniappIsIPhoneX();
		},
		filters:{
			int(val){
				var str = String(val);
				var arr = str.split('.');
				if(parseInt(arr[1])>0){
					return str
				}else{
					return arr[0]
				}
			}
		},
		onShow() {
			/* if (!this.addonIsExist.divideticket) {
				this.$util.showToast({
					title: '商家未开启好友瓜分券',
					mask: true,
					duration: 2000
				});
				setTimeout(() => {
					this.$util.redirectTo('/pages/index/index');
				}, 2000);
				return;
			} */

			if (uni.getStorageSync('token')) {
				this.token = uni.getStorageSync('token');
				if (this.$refs.mescroll) this.$refs.mescroll.refresh();
			} else {
				setTimeout(() => {
					this.$refs.login.open('/pages_promotion/divideticket/list');
				});
			}		
		},
		methods: {
			ontabtap(e) {
				this.status = e
				this.$refs.mescroll.refresh();
			},
			memberImageError() {
				this.list.headimg = this.$util.getDefaultImage().head;
			},
			getMemberCounponList(mescroll) {
				
				this.showEmpty = false;
				this.$api.sendRequest({
					url: '/divideticket/api/divideticket/launchPage',
					data: {
						page: mescroll.num,
						page_size: mescroll.size,
						status:this.status
					},
					success: res => {
						this.showEmpty = true;
						let newArr = [];
						let msg = res.message;
						if (res.code == 0 && res.data) {
							newArr = res.data.list;
						} else {
							this.$util.showToast({
								title: msg
							});
						}
						mescroll.endSuccess(newArr.length);
						//设置列表数据
						if (mescroll.num == 1) this.list = []; //如果是第一页需手动制空列表
						this.list = this.list.concat(newArr); //追加新数据
						let data = res.data;
						if (data) this.couponList = data;
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
					},
					fail: res => {
						mescroll.endErr();
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
					}
				});
			},
			imageError(index) {
				this.list[index].image = this.$util.getDefaultImage().goods;
				this.$forceUpdate();
			},
			toGoodsList(item) {
				this.$util.redirectTo('/pages_promotion/divideticket/index', {
					coupon_id: item.coupon_id
				});
			},
			toGoods(item){
				this.$util.redirectTo('/pages_promotion/divideticket/index', {
					coupon_id: item.coupon_id,
					group_id:item.group_id
				});
			}
		},
		watch: {
			storeToken: function(nVal, oVal) {
				if (nVal) {
					this.token = nVal;
					this.$refs.mescroll.refresh();
				}
			}
		}
	};
</script>

<style lang="scss" scoped>
	.cart-empty {
		margin-top: 104px !important;
	}

	.active {
		border-bottom: 4rpx solid;
	}
	
	.coupon-head {
		display: flex;
		background: #fff;
		padding: 20rpx 50rpx;
		
		.sort {
			border: 1px solid #c5c5c5;
			padding: 1rpx 20rpx;
			border-radius: 50rpx;
			cursor: pointer;
			margin-right: 15rpx;
		}
	}
	.cf-container {
		background: #fff;
		overflow: hidden;
	}

	.tab {
		display: flex;
		justify-content: space-between;
		height: 86rpx;

		>view {
			text-align: center;
			width: 33%;
			height: 86rpx;

			text {
				display: inline-block;
				line-height: 86rpx;
				height: 80rpx;
				font-size: 30rpx;
			}
		}
	}

	.coupon-listone {
		margin: 0 30rpx;
		
		.item {
			display: flex;
			align-items: center;
			// justify-content: space-between;
			flex-direction: column;
			background-color: #FFF; 
			background-size: 100% 100%;
			border-radius: 20rpx;
			align-items: stretch;
			margin-top: $padding;
			overflow: hidden;
			padding: 20rpx;
			.item-top{
				display: flex;
				justify-content: space-between;
				margin-bottom: 30rpx;
			}
			.item-left {
				margin-bottom: 40rpx;
				.use_name{
					font-weight: bold;
					width: 460rpx;    
					word-break: break-word;
					overflow: hidden;
					text-overflow: ellipsis;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
				}
				.item-flex {
					display: flex;
					align-items: center;
				}
				.use_time {
					font-size: $font-size-tag;
					color: #909399;
				
				}
				.item-base {
					width: 160rpx;
					height: 160rpx;
					border-radius: 10rpx;
					& image {
						width: 100%;
						height: 100%;
						border-radius: 10rpx;
					}
				}
				.item-info {
					margin-left: $padding;
					overflow: hidden;
					background-repeat-x: no-repeat;
					background-repeat-y: repeat;
					
					
					.use_title {
						font-size: $font-size-tag;
						max-width: 330rpx;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
						color: $color-sub;
				
						.max_price {
							font-weight: 400;
							font-size: $font-size-tag;
						}
					}
					.use_type {
						max-width: 330rpx;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
						border-radius: 5rpx;
						background-color: #FF9988;
					}
				}
			}
			.item-right {
				// padding-top: 20rpx;
				display: flex;
				justify-content: space-between;
				align-items: center;
				position: relative;
				// border-top: 1px solid $color-line;
				image{
					width: 50rpx;
					height: 50rpx;
					border-radius: 50%;
				}
				.posi{
					position: absolute;
					bottom: 12rpx;
					left: 100rpx;
					background-color: #fff;
				}
				.img-list{
					padding-left: 40rpx;
					display: flex;
					image{
						margin-right: 10rpx;
						border: 1px solid #fff;
						margin-left: -40rpx;
					}
				}
				.use_price {
					width: 50rpx;
					height: 50rpx;
					line-height: 50rpx;
					border: 1px dashed;
					border-radius: 50%;
					font-size: 40rpx;
					text-align: center;
					/* color:#FA5B14;
					font-weight: bold;
					font-size: 36rpx;
					& text {
						font-size: $font-size-base;
						margin-right: 10rpx;
						font-weight: 400;
					} */
				}
				.tag {
					height: 50rpx;
					border-radius: 26rpx;
					line-height: 50rpx;
					padding:0 19.5px;
					text-align: center;
					// background: linear-gradient(90deg, #FF7200 0%, #FF1E00 100%);
					color: #fff;
					font-size: $font-size-tag;
			
					&.disabled {
						background: $color-line !important;
						color: $color-tip !important;
					}
				}
				.image-lists{
					image{
						border: 1px solid #fff;
					}
				}
				.posi-one{
					position: absolute;
					top: 0;
					left: 20rpx;
				}
				.posi-two{
					position: absolute;
					top: 0;
					left: 40rpx;
				}
				.posi-three{
					position: absolute;
					top: 0;
					left: 60rpx;
				}
				.posi-four{
					position: absolute;
					top: 0;
					left: 80rpx;
				}
			}
		}
	}
	.order-nav {
		width: 100vw;
		height: 90rpx;
		flex-direction: row;
		/* #ifdef H5 */
		// padding-top: 14rpx;
		/* #endif */
		/* #ifndef APP-PLUS */
		white-space: nowrap;
		/* #endif */
		background: #fff;
		display: flex;
		// border-bottom-left-radius: 24rpx;
		// border-bottom-right-radius: 24rpx;
		// padding-bottom: 30rpx;
		/* #ifdef H5 */
		// padding-bottom: 20rpx;
		/* #endif */
		position: fixed;
		left: 0;
		z-index: 998;
	
		.uni-tab-item {
			flex: 1;
			padding-left: 24rpx;
			padding-right: 24rpx;
		}
	
		.uni-tab-item-title {
			font-size: $font-size-base;
			display: block;
			height: 86rpx;
			line-height: 90rpx;
			border-bottom: 1px solid #fff;
			padding: 0 10rpx;
			flex-wrap: nowrap;
			/* #ifndef APP-PLUS */
			white-space: nowrap;
			/* #endif */
			text-align: center;
			font-size: 30rpx;
		}
	
		.uni-tab-item-title-active {
			display: block;
			height: 86rpx;
			border-bottom: 2px solid #ffffff;
			padding: 0 10rpx;
		}
	
		::-webkit-scrollbar {
			width: 0;
			height: 0;
			color: transparent;
		}
	}
</style>
<style>
	/deep/ .mescroll-uni-fixed{
		top: 100rpx !important;
	}
</style>