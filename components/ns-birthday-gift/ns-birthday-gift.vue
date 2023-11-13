<template>
	<view>
		<view @touchmove.prevent.stop v-if="birthday" class="reward-popup">
			<uni-popup ref="birthdayGift" type="center" :maskClick="false">
				<view class="reward-wrap">
					<view class="wrap" :style="{ backgroundImage: 'url(' + $util.img('public/uniapp/birthday_gift/birthday_gift_bg.png') + ')' }">
						<view class="birthday-title-name">Dear {{ birthday.nickname }}</view>
						<view class="birthday-title-desc" v-if="birthday.blessing_content">{{ birthday.blessing_content }}</view>
						<view class="birthday-title-desc" v-else>感谢您一直以来的支持，在您生日到来之际，特为您送上最真诚的祝福！</view>
						<view class="birthday-title-hint">
							<image :src="$util.img('public/uniapp/birthday_gift/birthday_gift_left.png')" mode="" class="birthday-img-all"></image>
							<view class="font-size-toolbar">生日贺礼</view>
							<image :src="$util.img('public/uniapp/birthday_gift/birthday_gift_right.png')" mode="" class="birthday-img-all"></image>
						</view>
						<scroll-view scroll-y="true" class="register-box">
							<view class="reward-content">
								<view class="content" v-if="birthday.point > 0">
									<view class="info">
										<text class="num">
											{{ parseFloat(birthday.point) }}
											<text class="type">积分</text>
										</text>
										<view class="desc">用于下单时抵现或兑换商品等</view>
									</view>
									<view class="tip" @click="closeRewardPopup('1')">立即查看</view>
								</view>
								<view class="content" v-if="birthday.balance_type == 0 && birthday.balance > 0">
									<view class="info">
										<text class="num">
											{{ parseFloat(birthday.balance) }}
											<text class="type">元红包</text>
										</text>
										<view class="desc">不可提现红包</view>
									</view>
									<view class="tip" @click="closeRewardPopup('2')">立即查看</view>
								</view>
								<view class="content" v-if="birthday.balance_type == 1 && birthday.balance_money > 0">
									<view class="info">
										<text class="num">
											{{ parseFloat(birthday.balance_money) }}
											<text class="type">元红包</text>
										</text>
										<view class="desc">可提现红包</view>
									</view>
									<view class="tip" @click="closeRewardPopup('2')">立即查看</view>
								</view>

								<block v-if="birthday.coupon_list.length > 0">
									<block v-for="(item, index) in birthday.coupon_list" :key="index">
										<view class="content">
											<view class="info">
												<block v-if="item.type == 'reward'">
													<text class="num">
														{{ parseFloat(item.money) }}
														<text class="type">元优惠劵</text>
													</text>
												</block>
												<block v-else-if="item.type == 'discount'">
													<text class="num">
														{{ item.discount }}
														<text class="type">折</text>
													</text>
												</block>
												<view class="desc">用于下单时抵现或兑换商品等</view>
											</view>
											<view class="tip" @click="closeRewardPopup('3')">立即查看</view>
										</view>
									</block>
								</block>
							</view>
						</scroll-view>
					</view>
					<view class="close-btn" @click="cancel()"><text class="iconfont icon-close btn"></text></view>
				</view>
			</uni-popup>
		</view>
	</view>
</template>

<script>
import uniPopup from '../uni-popup/uni-popup.vue';

// 注册奖励弹出层
export default {
	name: 'ns-birthday-gift',
	components: {
		uniPopup
	},
	data() {
		return {
			birthday: {
				flag: false,
				coupon_list: {}
			},
			record: false,
			leatBirthday: false
		};
	},
	computed: {
		introduction() {
			let bytesCount = 0;
			if (this.birthday.blessing_content) {
				for (let i = 0, n = this.birthday.blessing_content.length; i < n; i++) {
					let c = this.birthday.blessing_content.charCodeAt(i);
					if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
						bytesCount += 1;
					} else {
						bytesCount += 2;
					}
				}
			}
			return bytesCount;
		}
	},
	async created() {
		await this.getBirthdayGift();
		//this.getReceiveGift();
		this.getBirthdaygiftRecord();
	},

	methods: {
		getReward() {
			return this.birthday;
		},
		async open() {
			if (this.leatBirthday) {
				this.$refs.birthdayGift.open();
				await this.getReceiveGift();
			} else {
				await this.getBirthdayGift();
				await this.getReceiveGift();
				this.$refs.birthdayGift.open();
			}
		},
		cancel() {
			this.$refs.birthdayGift.close();
		},
		getRecord() {
			return this.record;
		},
		getBirthday() {
			return this.birthday;
		},
		/**
		 * 获取生日礼配置
		 */
		async getBirthdayGift() {
			var res = await this.$api.sendRequest({
				url: '/birthdaygift/api/Config/config',
				async: false
			});
			if (res.code >= 0) {
				if (res.data) {
					this.birthday = res.data;
					this.leatBirthday = true;
				}
			}
			/* await this.$api.sendRequest({
				url: '/birthdaygift/api/Config/Config',
				success: res => {
					if (res.code >= 0) {
						if(res.data){
							this.birthday = res.data;
							uni.setStorageSync('birthdayFlag',res.data.flag);
						}
					}
				}
			}); */
		},
		// 领取
		async getReceiveGift() {
			if (this.birthday.flag == true) {
				await this.$api.sendRequest({
					url: '/birthdaygift/api/Config/receive',
					data: {
						id: this.birthday.id
					},
					success: res => {
						if (res.code >= 0) {
							this.$emit('getBirthday');
							uni.removeStorageSync('birthdayFlag');
							this.$util.redirectTo('/pages/member/index');
						}
					}
				});
			}
		},
		closeRewardPopup(type) {
			if (type == 1) {
				this.$util.redirectTo('/pages_tool/member/point_detail', {});
				return;
			} else if (type == 2) {
				this.$util.redirectTo('/pages_tool/member/balance_detail', {});
				return;
			} else {
				this.$util.redirectTo('/pages_tool/member/coupon', {});
				return;
			}
		},
		getBirthdaygiftRecord() {
			this.$api.sendRequest({
				url: '/birthdaygift/api/Config/getRecord',
				data: {},
				success: res => {
					if (res.code >= 0) {
						this.record = res.data;
					}
				}
			});
		}
	}
};
</script>
<style scoped>
.register-box /deep/ .uni-scroll-view {
	background: unset !important;
}
.register-box {
	max-height: 300rpx;
	overflow-y: scroll;
	/* margin-top:350rpx; */
}
/deep/ .uni-popup__wrapper-box {
	background-color: transparent !important;
}
/deep/ .birthday-title-hint uni-image {
	width: 113rpx !important;
	height: 24rpx !important;
}
</style>

<style lang="scss">
.reward-wrap {
	width: 85vw;
	height: auto;
	.wrap {
		width: 100%;
		height: auto;
		background-size: 100%;
		background-repeat: no-repeat;
		padding-bottom: 40rpx;
		.birthday-title-name {
			font-size: $font-size-toolbar;
			font-weight: bold;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 1;
			overflow: hidden;
			padding-top: 350rpx;
			text-align: center;
			color: #fff;
			line-height: 1;
		}
		.birthday-title-desc {
			font-weight: 500;
			margin: 30rpx 70rpx 20rpx;
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			text-align: center;
			color: #fff;
		}
		.birthday-title-hint {
			font-size: $font-size-toolbar;
			font-weight: bold;
			font-family: BDZongYi-A001;
			display: flex;
			align-items: center;
			justify-content: center;
			margin: 0 0 40rpx;
			line-height: 1;
			.birthday-img-all {
				width: 100rpx;
				height: 20rpx;
			}
			& > view {
				margin: 0 20rpx;
				color: #fff;
			}
		}
	}
	.reward-content {
		margin: 0 40rpx;
	}
	.head {
		color: #fff;
		text-align: center;
		line-height: 1;
		margin: 20rpx 0;
	}
	& .content:last-child {
		margin-bottom: 0;
	}
	.content {
		display: flex;
		align-items: center;
		padding: 16rpx 26rpx;
		background: #fff;
		border-radius: 10rpx;
		margin-bottom: 20rpx;
		.info {
			flex: 1;
		}
		.tip {
			color: #fa5b14;
			padding: 10rpx 0 10rpx 20rpx;
			width: 60rpx;
			line-height: 1.5;
			letter-spacing: 2rpx;
			border-left: 2rpx dashed #e5e5e5;
		}
		.num {
			font-size: 48rpx;
			color: #fa5b14;
			font-weight: bolder;
			line-height: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			display: inline-block;
			max-width: 300rpx;
		}
		.type {
			font-size: $font-size-base;
			margin-left: 10rpx;
			line-height: 1;
			font-weight: normal;
			color: #606266;
		}
		.desc {
			margin-top: 8rpx;
			color: $color-tip;
			font-size: $font-size-tag;
			line-height: 1;
		}
	}
	.close-btn {
		text-align: center;
		margin-top: 40rpx;
		.btn {
			font-size: 40rpx;
			color: #fff;
			border: 4rpx solid #fff;
			border-radius: 50%;
			padding: 10rpx;
			font-weight: bold;
			width: 40rpx;
			height: 40rpx;
			margin: 0 auto;
			line-height: 40rpx;
			/* margin: 20rpx 140rpx;
			border: none;
			background: linear-gradient(90deg, #FF6A00, #FF3C00);
			border-radius: 40rpx;
			display: flex;
			align-items: center;
			justify-content: center; */
		}
	}
}
</style>
