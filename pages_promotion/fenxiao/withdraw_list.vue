<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view>
		<mescroll-uni @getData="getData" class="member-point">
			<view slot="list">
				<block v-if="withdrawList.length">
					<view class="detailed-wrap">
						<view class="cont">
							<view class="detailed-item" v-for="(item, index) in withdrawList" :key="index" @click="toDetail(item.id)">
								<view class="info">
									<view class="event">{{ item.transfer_type=='balance'&&'余额' || item.transfer_type=='alipay'&&'支付宝' || item.transfer_type=='bank'&&'银行卡' || item.transfer_type=='wechatpay'&&'微信' }}</view>
									<view>
										<text class="time">{{ $util.timeStampTurnTime(item.create_time) }}</text>
									</view>
								</view>
								<view class="right-wrap">
									<view class="num color-base-text">￥{{ item.money }}</view>
									<view class="status-name" :style="withdrawState[item.status].color">{{ item.status_name }}</view>
								</view>
							</view>
						</view>
					</view>
				</block>
				<block v-else>
					<ns-empty :isIndex="false" text="暂无提现记录"></ns-empty>
				</block>
			</view>
		</mescroll-uni>
		<ns-login ref="login"></ns-login>
		<loading-cover ref="loadingCover"></loading-cover>
	</view>
</template>
<script>
import fenxiaoWords from 'common/js/fenxiao-words.js';
export default {
	data() {
		return {
			withdrawState: {
				'3': {
					color: 'color: rgb(255, 69, 68)',
					text: '已转账'
				},
				'1': {
					color: 'color: rgb(255, 160, 68)',
					text: '待审核'
				},
				'2': {
					color: 'color: rgb(17, 189, 100)',
					text: '已审核'
				},
				'-1': {
					color: 'color: rgb(255, 69, 68)',
					text: '已拒绝'
				}
			},
			withdrawList: [],
			emptyShow: false,
			token: null
		};
	},
	onShow() {
		
		setTimeout( () => {
			if (this.addonIsExist && !this.addonIsExist.fenxiao) {
				this.$util.showToast({
					title: '商家未开启分销',
					mask: true,
					duration: 2000
				});
				setTimeout(() => {
					this.$util.redirectTo('/pages/index/index');
				}, 2000);
				return;
			}
		}, 1000);
		
		if(this.fenxiaoWords && this.fenxiaoWords.withdraw)this.$langConfig.title(this.fenxiaoWords.withdraw + '明细');

		if (uni.getStorageSync('token')) {
			this.token = uni.getStorageSync('token');
		} else {
			setTimeout(() => {
				this.$refs.login.open('/pages_promotion/fenxiao/withdraw_list');
			});
		}
	},
	mixins: [fenxiaoWords],
	methods: {
		//获得列表数据
		getData(mescroll) {
			this.emptyShow = false;
			if (mescroll.num == 1) {
				this.withdrawList = [];
			}
			this.$api.sendRequest({
				url: '/fenxiao/api/withdraw/page',
				data: {
					page_size: mescroll.size,
					page: mescroll.num,
				},
				success: res => {
					this.emptyShow = true;
					let newArr = [];
					let msg = res.message;
					if (res.code == 0 && res.data && res.data.list) {
						newArr = res.data.list;
					} else {
						this.$util.showToast({
							title: msg
						});
					}
					mescroll.endSuccess(newArr.length);
					//设置列表数据
					if (mescroll.num == 1) this.withdrawList = []; //如果是第一页需手动制空列表
					this.withdrawList = this.withdrawList.concat(newArr); //追加新数据
					if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
				},
				fail: res => {
					mescroll.endErr();
					if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
				}
			});
		},
		toDetail(id) {
			this.$util.redirectTo('/pages_promotion/fenxiao/withdrawal_detail', {
				id: id
			});
		}
	}
};
</script>

<style lang="scss">
.account-box {
	width: 100vw;
	padding: 30rpx;
	box-sizing: border-box;
	padding-bottom: 10rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;

	.tit {
		color: #fff;
		line-height: 1;
	}

	.iconmn_jifen_fill {
		font-size: 60rpx;
		color: #fff;
	}

	.point {
		color: #fff;
		font-size: 60rpx;
		margin-left: 10rpx;
	}
}

.detailed-wrap {
	.head {
		display: flex;
		height: 90rpx;

		& > view {
			flex: 1;
			text-align: left;
			padding: 0 $padding;
			line-height: 90rpx;
		}
	}

	.cont {
		background: #fff;

		.detailed-item {
			padding: $padding 10rpx;
			margin: 0 $margin-both;
			border-bottom: 2rpx solid #eee;
			position: relative;

			&:last-of-type {
				border-bottom: none;
			}

			.info {
				padding-right: 180rpx;

				.event {
					font-size: $font-size-base;
					line-height: 1.3;
				}

				.time {
					font-size: $font-size-base;
					color: $color-tip;
				}
			}

			.right-wrap {
				position: absolute;
				right: 0;
				top: 0;
				text-align: right;

				.num {
					font-size: $font-size-toolbar;
				}
			}
		}
	}
}
</style>
