<template>
	<view>
		<!-- 完善会员资料 -->
		<view @touchmove.prevent.stop class="complete-info-popup">
			<uni-popup ref="completeInfoPopup" type="bottom" :maskClick="false">
				<view class="complete-info-wrap">
					<!-- #ifdef H5 -->
					<template v-if="forceBindingMobileControl">
						<view class="head">
							<text class="title">检测到您还未绑定手机号</text>
							<text class="color-tip tips">为了方便您接收订单等信息，需要绑定手机号</text>
							<text class="iconfont icon-close color-tip" @click="cancelCompleteInfo"></text>
						</view>
						<view class="item-wrap">
							<text class="label">手机号</text>
							<input type="number" placeholder="请输入手机号" v-model="formData.mobile" maxlength="11" />
						</view>
						<view class="item-wrap" v-if="captchaConfig">
							<text class="label">验证码</text>
							<input type="number" placeholder="请输入验证码" v-model="formData.vercode" maxlength="4" />
							<image :src="captcha.img" class="captcha" @click="getCaptcha"></image>
						</view>
						<view class="item-wrap">
							<text class="label">动态码</text>
							<input type="number" placeholder="请输入动态码" v-model="formData.dynacode" maxlength="4" />
							<view class="send color-base-text" @click="sendMobileCode">{{ dynacodeData.codeText }}
							</view>
						</view>
					</template>
					<button type="default" class="save-btn" @click="saveH5" :disabled="isDisabled">保存</button>
					<!-- #endif -->

					<!-- #ifdef MP -->
					<view class="head">
						<text class="title">
							获取您的昵称、头像
							<template v-if="forceBindingMobileControl">
								、手机号
							</template>
						</text>
						<text class="color-tip tips">
							获取用户头像、昵称
							<template v-if="forceBindingMobileControl">
								、手机号
							</template>
							完善个人资料，主要用于向用户提供具有辨识度的用户中心界面
						</text>
						<text class="iconfont icon-close color-tip" @click="cancelCompleteInfo"></text>
					</view>
					<!-- #ifdef MP-WEIXIN -->
					<view class="item-wrap">
						<text class="label">头像</text>
						<button open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
							<image :src="avatarUrl ? avatarUrl : $util.getDefaultImage().head"
								@error="avatarUrl = $util.getDefaultImage().head" mode="aspectFill"></image>
							<text class="iconfont icon-right color-tip"></text>
						</button>
					</view>
					<view class="item-wrap">
						<text class="label">昵称</text>
						<input type="nickname" placeholder="请输入昵称" v-model="nickName" @blur="blurNickName"
							maxlength="50" />
					</view>
					<!-- #endif  -->

					<!-- #ifdef MP-ALIPAY -->
					<view class="item-wrap">
						<text class="label">头像</text>
						<button open-type="getAuthorize" scope="userInfo" @getAuthorize="aliappGetUserinfo"
							:plain="true" class="border-0">
							<image :src="avatarUrl ? avatarUrl : $util.getDefaultImage().head"
								@error="avatarUrl = $util.getDefaultImage().head" mode="aspectFill"></image>
							<text class="iconfont icon-right color-tip"></text>
						</button>
					</view>
					<view class="item-wrap">
						<text class="label">昵称</text>
						<input type="nickname" placeholder="请输入昵称" v-model="nickName" @blur="blurNickName"
							maxlength="50" />
					</view>
					<!-- #endif  -->
					<view class="item-wrap" v-if="forceBindingMobileControl">
						<text class="label">手机号</text>
						<button open-type="getPhoneNumber" :plain="true" class="auth-login border-0"
							@getphonenumber="getPhoneNumber">
							<text class="mobile" v-if="formData.mobile">{{ formData.mobile }}</text>
							<text class="color-base-text" v-else>获取手机号</text>
						</button>
					</view>
					<button type="default" class="save-btn" @click="saveMp" :disabled="isDisabled">保存</button>
					<!-- #endif  -->
				</view>
			</uni-popup>
		</view>

		<register-reward ref="registerReward"></register-reward>
	</view>
</template>

<script>
	import uniPopup from '@/components/uni-popup/uni-popup.vue';
	import Config from 'common/js/config.js';
	import registerReward from '@/components/register-reward/register-reward.vue';
	import auth from 'common/js/auth.js';
	import validate from 'common/js/validate.js';

	export default {
		mixins: [auth],
		name: 'ns-login',
		components: {
			uniPopup,
			registerReward
		},
		data() {
			return {
				url: '',
				registerConfig: {},
				avatarUrl: '', // 头像预览路径
				headImg: '', // 头像上传路径
				nickName: '', // 昵称
				isSub: false,

				// 绑定手机号
				captchaConfig: 0,
				captcha: {
					id: '',
					img: ''
				},
				formData: {
					key: '',
					mobile: '',
					vercode: '',
					dynacode: ''
				},
				dynacodeData: {
					seconds: 120,
					timer: null,
					codeText: '获取动态码',
					isSend: false
				},
				// 小程序获取手机号所需数据
				authMobileData: {
					iv: '',
					encryptedData: ''
				}
			};
		},
		options: {
			styleIsolation: 'shared'
		},
		created() {
			this.getRegisterConfig();

			// #ifdef H5
			if (!uni.getStorageSync('token')) this.getCaptchaConfig();
			// #endif
		},
		mounted() {},
		watch: {
			'dynacodeData.seconds': {
				handler(newValue, oldValue) {
					if (newValue == 0) {
						this.refreshDynacodeData();
					}
				},
				immediate: true,
				deep: true
			}
		},
		computed: {
			// 控制按钮是否禁用
			isDisabled() {
				// #ifdef MP-WEIXIN
				if (this.nickName.length == 0) return true;
				// #endif

				// 强制绑定手机号验证
				if (this.forceBindingMobileControl) {
					if (this.formData.mobile.length == 0) return true;

					// #ifdef H5

					// 验证码
					if (this.captchaConfig == 1 && this.formData.vercode.length == 0) return true;

					// 动态码
					if (this.formData.dynacode.length == 0) return true;

					// #endif
				}
				return false;
			},
			forceBindingMobileControl() {
				if (this.registerConfig && this.registerConfig.third_party == 1 && this.registerConfig.bind_mobile == 1)
					return true;
				else return false;
			}
		},
		methods: {
			// 获取注册配置
			getRegisterConfig() {
				this.$api.sendRequest({
					url: '/api/register/config',
					success: res => {
						if (res.code >= 0) {
							this.registerConfig = res.data.value;
						}
					}
				});
			},
			open(url) {
				if (url) this.url = url;
				// #ifdef MP
				this.getCode(authData => {
					this.authLogin(authData, 'authOnlyLogin');
				});
				// #endif

				// #ifdef H5
				if (this.$util.isWeiXin()) {
					let authData = uni.getStorageSync('authInfo');
					if (authData) this.authLogin(authData);
					else this.getCode();
				} else {
					this.toLogin();
				}
				// #endif

				// #ifndef MP || H5
				this.toLogin();
				// #endif
			},
			// 跳转去登录页
			toLogin() {
				if (this.url) this.$util.redirectTo('/pages_tool/login/login', {
					back: encodeURIComponent(this.url)
				});
				else this.$util.redirectTo('/pages_tool/login/login');
			},
			cancelCompleteInfo() {
				if (this.$refs.completeInfoPopup) this.$refs.completeInfoPopup.close();
				this.$store.commit('setBottomNavHidden', false); // 显示底部导航
			},
			blurNickName(e) {
				if (e.detail.value) this.nickName = e.detail.value;
			},
			onChooseAvatar(e) {
				this.avatarUrl = e.detail.avatarUrl;
				uni.getFileSystemManager().readFile({
					filePath: this.avatarUrl, //选择图片返回的相对路径
					encoding: 'base64', //编码格式
					success: res => {
						let base64 = 'data:image/jpeg;base64,' + res.data; //不加上这串字符，在页面无法显示的哦

						this.$api.uploadBase64({
							base64,
							success: res => {
								if (res.code == 0) {
									this.headImg = res.data.pic_path;
								} else {
									this.$util.showToast({
										title: res.message
									});
								}
							},
							fail: () => {
								this.$util.showToast({
									title: '上传失败'
								});
							}
						})
					}
				});
			},
			openCompleteInfoPop() {
				this.$refs.completeInfoPopup.open(() => {
					this.$store.commit('setBottomNavHidden', false); //显示底部导航
				});
				this.$store.commit('setBottomNavHidden', true); //隐藏底部导航
			},
			// 获取验证码配置
			getCaptchaConfig() {
				this.$api.sendRequest({
					url: '/api/config/getCaptchaConfig',
					success: res => {
						if (res.code >= 0) {
							this.captchaConfig = res.data.data.value.shop_reception_login;
							if (this.captchaConfig) this.getCaptcha();
						}
					}
				});
			},
			// 获取验证码
			getCaptcha() {
				this.$api.sendRequest({
					url: '/api/captcha/captcha',
					data: {
						captcha_id: this.captcha.id
					},
					success: res => {
						if (res.code >= 0) {
							this.captcha = res.data;
							this.captcha.img = this.captcha.img.replace(/\r\n/g, '');
						}
					}
				});
			},
			// 发送手机动态码
			sendMobileCode() {
				if (this.dynacodeData.seconds != 120 || this.dynacodeData.isSend) return;
				var data = {
					mobile: this.formData.mobile,
					captcha_id: this.captcha.id,
					captcha_code: this.formData.vercode
				};
				var rule = [{
					name: 'mobile',
					checkType: 'required',
					errorMsg: '请输入手机号'
				}, {
					name: 'mobile',
					checkType: 'phoneno',
					errorMsg: '请输入正确的手机号'
				}];
				if (this.captchaConfig == 1) {
					rule.push({
						name: 'captcha_code',
						checkType: 'required',
						errorMsg: '请输入验证码'
					});
				}
				var checkRes = validate.check(data, rule);
				if (!checkRes) {
					this.$util.showToast({
						title: validate.error
					});
					return;
				}
				this.dynacodeData.isSend = true;

				if (this.dynacodeData.seconds == 120) {
					this.dynacodeData.timer = setInterval(() => {
						this.dynacodeData.seconds--;
						this.dynacodeData.codeText = this.dynacodeData.seconds + 's后可重新获取';
					}, 1000);
				}

				this.$api.sendRequest({
					url: '/api/tripartite/mobileCode',
					data: data,
					success: res => {
						if (res.code >= 0) {
							this.formData.key = res.data.key;
						} else {
							this.$util.showToast({
								title: res.message
							});
							this.refreshDynacodeData();
						}
					},
					fail: () => {
						this.$util.showToast({
							title: 'request:fail'
						});
						this.refreshDynacodeData();
					}
				});
			},
			refreshDynacodeData() {
				this.getCaptcha();
				clearInterval(this.dynacodeData.timer);
				this.dynacodeData = {
					seconds: 120,
					timer: null,
					codeText: '获取动态码',
					isSend: false
				};
			},
			// 表单验证
			verify(data) {
				let rule = [{
					name: 'mobile',
					checkType: 'required',
					errorMsg: '请输入手机号'
				}, {
					name: 'mobile',
					checkType: 'phoneno',
					errorMsg: '请输入正确的手机号'
				}];
				if (this.captchaConfig == 1) {
					if (this.captcha.id != '') rule.push({
						name: 'captcha_code',
						checkType: 'required',
						errorMsg: '请输入验证码'
					});
				}
				rule.push({
					name: 'code',
					checkType: 'required',
					errorMsg: '请输入动态码'
				});

				var checkRes = validate.check(data, rule);
				if (checkRes) {
					return true;
				} else {
					this.$util.showToast({
						title: validate.error
					});
					return false;
				}
			},
			// 微信公众号强制绑定手机号
			forceBindMobile() {
				let authData = uni.getStorageSync('authInfo');
				let data = {
					mobile: this.formData.mobile,
					key: this.formData.key,
					code: this.formData.dynacode
				};
				if (this.captcha.id != '') {
					data.captcha_id = this.captcha.id;
					data.captcha_code = this.formData.vercode;
				}

				if (authData) Object.assign(data, authData);
				if (authData.avatarUrl) data.headimg = authData.avatarUrl;
				if (authData.nickName) data.nickname = authData.nickName;

				if (uni.getStorageSync('source_member')) data.source_member = uni.getStorageSync('source_member');

				if (this.isSub) return;
				this.isSub = true;

				this.$api.sendRequest({
					url: '/api/tripartite/mobile',
					data,
					success: res => {
						if (res.code >= 0) {
							uni.setStorage({
								key: 'token',
								data: res.data.token,
								success: () => {
									this.$store.commit('setToken', res.data.token);
									this.$store.dispatch('getCartNumber');
								}
							});
							this.$refs.completeInfoPopup.close();
							this.$store.commit('setBottomNavHidden', false); // 显示底部导航
							if (res.data.is_register) this.$refs.registerReward.open(this.url);
						} else {
							this.isSub = false;
							this.getCaptcha();
							this.$util.showToast({
								title: res.message
							});
						}
					},
					fail: res => {
						this.isSub = false;
						this.getCaptcha();
					}
				});
			},
			// 微信小程序获取手机号
			getPhoneNumber(e) {
				if (e.detail.errMsg == 'getPhoneNumber:ok') {
					let authData = uni.getStorageSync('authInfo');
					if (authData) Object.assign(this.authMobileData, authData, e.detail);
					if (uni.getStorageSync('source_member')) this.authMobileData.source_member = uni.getStorageSync(
						'source_member');

					this.$api.sendRequest({
						url: '/api/tripartite/getPhoneNumber',
						data: this.authMobileData,
						success: res => {
							if (res.code >= 0) {
								this.formData.mobile = res.data.mobile;
							} else {
								this.formData.mobile = '';
								this.$util.showToast({
									title: res.message
								});
							}
						}
					});
				} else {
					this.$util.showToast({
						title: '为了保证您账户的统一性，取消授权将无法为您提供服务'
					})
				}
			},
			// 微信小程序强制绑定手机号
			bindMobile() {
				let data = this.authMobileData;
				let authData = uni.getStorageSync('authInfo');
				if (authData) Object.assign(data, authData);
				if (authData.avatarUrl) data.headimg = authData.avatarUrl;
				if (authData.nickName) data.nickname = authData.nickName;

				this.$api.sendRequest({
					url: '/api/tripartite/mobileauth',
					data,
					success: res => {
						if (res.code >= 0) {
							uni.setStorage({
								key: 'token',
								data: res.data.token,
								success: () => {
									this.$store.dispatch('getCartNumber');
									this.$store.commit('setToken', res.data.token);
									this.cancelCompleteInfo();
								}
							});
							if (res.data.is_register) this.$refs.registerReward.open(this.url);
						} else {
							this.$util.showToast({
								title: res.message
							});
						}
					},
					fail: res => {
						this.$util.showToast({
							title: 'request:fail'
						});
					}
				});
			},
			/**
			 * 授权登录
			 */
			authLogin(data, type = 'authLogin') {
				uni.showLoading({
					title: '登录中'
				});
				uni.setStorage({
					key: 'authInfo',
					data: data
				});
				if (uni.getStorageSync('source_member')) data.source_member = uni.getStorageSync('source_member');

				this.$api.sendRequest({
					url: type == 'authLogin' ? '/api/login/auth' : '/api/login/authonlylogin',
					data,
					success: res => {
						if (res.code >= 0) {
							uni.setStorage({
								key: 'token',
								data: res.data.token,
								success: () => {
									this.$store.dispatch('getCartNumber');
									this.$store.commit('setToken', res.data.token);
									if (res.data.is_register) this.$refs.registerReward.open(this.url);
									this.cancelCompleteInfo();
								}
							});
							setTimeout(() => {
								uni.hideLoading();
							}, 1000);
						} else if (res.code == -10016) {
							let register_error = res.message;
							this.$api.sendRequest({
								url: '/api/register/config',
								success: res => {
									if (res.code >= 0) {
										this.registerConfig = res.data.value;
										if (this.registerConfig.third_party == 1 && this
											.registerConfig.bind_mobile == 1) {
											uni.hideLoading();
											this.openCompleteInfoPop();
										} else if (this.registerConfig.third_party == 0) {
											uni.hideLoading();
											this.toLogin();
										} else {
											uni.hideLoading();
											this.openCompleteInfoPop();
										}
									}
								}
							});
						} else {
							uni.hideLoading();
							this.$util.showToast({
								title: res.message
							});
						}
					},
					fail: () => {
						uni.hideLoading();
						this.$util.showToast({
							title: '登录失败'
						});
					}
				});
			},
			// 微信公众号，强制绑定手机号，验证
			saveH5() {
				if (this.$util.isWeiXin() && this.forceBindingMobileControl) {
					let data = {
						mobile: this.formData.mobile,
						key: this.formData.key,
						code: this.formData.dynacode
					};
					if (this.captcha.id != '') {
						data.captcha_id = this.captcha.id;
						data.captcha_code = this.formData.vercode;
					}
					if (!this.verify(data)) return;
				}
				this.forceBindMobile();
			},
			// 微信小程序保存数据
			saveMp() {
				if (this.nickName.length == 0) {
					this.$util.showToast({
						title: '请输入昵称'
					});
					return;
				}
				let authData = uni.getStorageSync('authInfo');
				if (authData) Object.assign(authData, {
					nickName: this.nickName,
					avatarUrl: this.headImg
				});
				uni.setStorageSync('authInfo', authData);

				if (this.forceBindingMobileControl) this.bindMobile();
				else this.authLogin(authData);
			},
			// #ifdef MP-ALIPAY
			aliappGetUserinfo() {
				my.getOpenUserInfo({
					success: (res) => {
						let userInfo = JSON.parse(res.response).response
						if (userInfo.code && userInfo.code == '10000') {
							if (userInfo.avatar) {
								this.avatarUrl = userInfo.avatar;
								this.$api.pullImage({
									path: this.avatarUrl,
									success: res => {
										if (res.code == 0) {
											this.headImg = res.data.pic_path;
										} else {
											this.$util.showToast({
												title: res.message
											});
										}
									},
									fail: () => {
										this.$util.showToast({
											title: '头像拉取失败'
										});
									}
								})
							}
							this.nickName = userInfo.nickName
						} else {
							this.$util.showToast({
								title: userInfo.subMsg
							})
						}
					},
					fail: (err) => {
						this.$util.showToast({
							title: err.subMsg
						})
					}
				});
			}
			// #endif
		}
	};
</script>

<style lang="scss">
	.complete-info-popup {
		.complete-info-wrap {
			background: #fff;
			padding: 50rpx 40rpx 40rpx;

			.head {
				position: relative;
				border-bottom: 2rpx solid $color-line;
				padding-bottom: 20rpx;

				.title {
					font-size: $font-size-toolbar;
					display: block;
				}

				.tips {
					font-size: $font-size-base;
					display: block;
				}

				.iconfont {
					position: absolute;
					right: 0;
					top: -30rpx;
					display: inline-block;
					width: 56rpx;
					height: 56rpx;
					line-height: 56rpx;
					text-align: right;
					font-size: $font-size-toolbar;
					font-weight: bold;
				}
			}

			.item-wrap {
				border-bottom: 2rpx solid $color-line;
				display: flex;
				align-items: center;
				padding: 16rpx 0;

				.label {
					font-size: $font-size-toolbar;
					margin-right: 40rpx;
					width: 100rpx;
				}

				button {
					background: transparent;
					margin: 0;
					padding: 0;
					border-radius: 0;
					flex: 1;
					text-align: left;
					display: flex;
					align-items: center;
					font-size: $font-size-toolbar;
					border: none;

					image {
						width: 100rpx;
						height: 100rpx;
						border-radius: 10rpx;
						overflow: hidden;
					}
				}

				.iconfont {
					flex: 1;
					text-align: right;
					font-size: $font-size-tag;
				}

				input {
					flex: 1;
					height: 80rpx;
					box-sizing: border-box;
					font-size: $font-size-toolbar;
				}

				.send {
					border: 2rpx solid $base-color;
					height: 60rpx;
					line-height: 60rpx;
					border-radius: 60rpx;
					font-size: $font-size-tag;
					text-align: center;
					padding: 0 40rpx;
				}

				.captcha {
					height: 80rpx;
					width: 200rpx;
				}

				.auth-login {
					width: calc(100% - 100rpx);
					height: 80rpx;
					line-height: 80rpx;
					border-radius: 80rpx;
				}
			}

			.save-btn {
				width: 280rpx;
				height: 90rpx;
				line-height: 90rpx;
				background-color: #07c160;
				color: #fff;
				margin: 40rpx auto 20rpx;
			}
		}
	}
</style>
<style scoped>
	/deep/ .reward-popup .uni-popup__wrapper-box {
		background: none !important;
		max-width: unset !important;
		max-height: unset !important;
		overflow: unset !important;
	}

	.complete-info-popup /deep/ .uni-popup__wrapper.bottom,
	.complete-info-popup /deep/ .uni-popup__wrapper.bottom .uni-popup__wrapper-box {
		border-top-left-radius: 30rpx !important;
		border-top-right-radius: 30rpx !important;
	}
</style>