<template>
	<view class="copyrigt-wrap" v-if="showLogo || showBeian">
		<view class="copyright-info" v-if="showLogo">
			<view class="copyright-pic" v-if="copyright.logo" @click="link(copyright.copyright_link)">
				<image :src="$util.img(copyright.logo)" @error="error" mode="widthFix"></image>
			</view>

			<!-- <view class="copyright-desc color-tip" v-if="copyright.company_name" @click="link(copyright.copyright_link)">{{ copyright.company_name }}</view> -->
			<!-- <view class="copyright-desc color-tip" v-else @click="link('http://www.niushop.com')">牛之云科技提供技术支持</view> -->
		</view>

		<!--#ifdef H5 -->
		<view class="record-info" v-if="showBeian">
			<view class="icp" v-if="copyright.icp" @click="toHref('https://beian.miit.gov.cn')">备案号：{{ copyright.icp }}
			</view>

			<view v-if="copyright.gov_record" class="gov-wrap" @click="toHref(copyright.gov_url)" target="_blank">
				<image :src="$util.img('public/uniapp/common/gov_record.png')" alt="公安备案" />
				<text>{{ copyright.gov_record }}</text>
			</view>
		</view>
		<!--#endif -->
	</view>
</template>

<script>
	export default {
		data() {
			return {
				showLogo: true,
			};
		},
		created() {},
		computed: {
			copyright() {
				let copyright = uni.getStorageSync('copyright');
				// 判断是否授权
				if (copyright && !copyright.auth) {
					copyright.logo = 'public/uniapp/common/logo_copy.png';
					copyright.copyright_link = 'http://www.niushop.com';
				}
				return copyright;
			},
			showBeian() {
				// 如果都为空，则隐藏
				if (!this.copyright.icp && !this.copyright.gov_record) {
					return false;
				}
				return true;
			}
		},
		methods: {
			link(url) {
				if (url) {
					this.$util.redirectTo('/pages_tool/webview/webview', {
						src: encodeURIComponent(url)
					});
				}
			},
			toHref(url) {
				location.href = url;
			},
			error() {
				this.showLogo = false;
			}
		}
	};
</script>

<style lang="scss">
	.copyrigt-wrap {
		margin-top: 40rpx;
		margin-bottom: 40rpx;

		>view {
			font-size: $font-size-tag;
			color: #666666;

			&:last-child {
				margin-top: 10rpx;
			}

			&:first-child {
				margin-top: 0;
			}
		}

		.copyright-info {
			width: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			flex-direction: column;

			.copyright-pic {
				image {
					width: 160rpx;
					height: 24rpx;
				}

			}

			text {
				font-size: $font-size-goods-tag;
				height: 100rpx;
				line-height: 100rpx;
				color: $color-tip !important;
			}

			.copyright-desc {
				color: lighten($color-tip, 30%);
				font-size: $font-size-goods-tag;
				text-shadow: 0 0 2rpx lighten($color-tip, 40%);
			}
		}

		.record-info {
			width: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			flex-direction: column;
			margin-top: 10rpx;

			text {
				color: #666666;
				font-size: $font-size-tag;
			}

			view {
				font-size: $font-size-tag;
				color: #666666;

				&:last-child {
					margin-top: 10rpx;
				}

				&:first-child {
					margin-top: 0;
				}
			}

			.gov-wrap {
				display: flex;
				justify-content: center;
				align-items: center;

				image {
					width: 40rpx;
					height: 40rpx;
					margin-right: 10rpx;
				}
			}

		}
	}
</style>