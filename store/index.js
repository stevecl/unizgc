import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import Http from '../common/js/http.js'
import colorList from '../common/js/style_color.js'

const store = new Vuex.Store({
    state: {
        tabBarList: '',
        siteState: 1,
        themeStyle: '',
        addonIsExist: {
            bundling: 0,
            coupon: 0,
            discount: 0,
            fenxiao: 0,
            gift: 0,
            groupbuy: 0,
            manjian: 0,
            memberconsume: 0,
            memberrecharge: 0,
            memberregister: 0,
            membersignin: 0,
            memberwithdraw: 0,
            memberrecommend: 0,
            pintuan: 0,
            pointexchange: 0,
            seckill: 0,
            store: 0,
            topic: 0,
            bargain: 0,
            membercancel: 0,
            servicer: 0,
            supermember: 0,
            giftcard: 0,
            divideticket: 0,
            scenefestival: 0,
            birthdaygift: 0,
            pinfan: 0
        },
        sourceMember: 0, // 来源会员
        authInfo: {}, // 授权信息
        token: null,
        flRefresh: 0,
        location: null, // 定位信息
        defaultImg: {
            goods: '',
            head: '',
            store: '',
            article: ''
        },
        cartNumber: 0,
        cartList: {},
        cartMoney: 0,
        siteInfo: null,
        cartChange: 0,
        bottomNavHidden: false, // 底部导航是否隐藏，true：隐藏，false：显示
        globalStoreConfig: null, // 门店配置
        globalStoreInfo: null, // 门店信息
        componentsLoad: {
            Search: false,
            ImageAds: false,
            RubikCube: false
        },
        cartPosition: null, // 购物车所在位置
        componentRefresh: 0, // 组件刷新
        servicerConfig: null, // 客服配置
        diySeckillInterval: null,
        diyGroupPositionObj: {},
        diyGroupShowModule: '',
        tabBarHeight: '0px'
    },
    mutations: {
        // 设置那些组件展示
        setDiyGroupShowModule(state, data) {
            state.diyGroupShowModule = data;
        },
        // 设置diyGroup中组件原有高度，通过他们来实现在首页的定位
        setDiyGroupPositionObj(state, data) {
            state.diyGroupPositionObj = Object.assign({}, state.diyGroupPositionObj, data);
        },
        setComponentState(state, val) {
            state.componentsLoad = Object.assign({}, state.componentsLoad, val);
        },
        setSiteState(state, siteStateVal) {
            state.siteState = siteStateVal;
        },
        setCartNumber(state, cartNumber) {
            state.cartNumber = cartNumber
        },
        setThemeStyle(state, value) {
            state.themeStyle = value
            uni.setStorageSync('theme_style', value);
        },
        setTabBarList(state, value) {
            state.tabBarList = value;
            uni.setStorageSync('bottomNav', value);
        },
        setAddonIsExist(state, value) {
            state.addonIsExist = value;
            uni.setStorageSync('addon_is_exist', value);
        },
        setToken(state, value) {
            state.token = value;
        },
        setAuthinfo(state, value) {
            state.authInfo = value;
        },
        setSourceMember(state, value) {
            state.sourceMember = value;
        },
        setflRefresh(state, flRefreshVal) {
            state.flRefresh = flRefreshVal;
        },
        setLocation(state, value) {
            state.location = value;
        },
        setDefaultImg(state, value) {
            uni.setStorageSync('default_img', value)
            state.defaultImg = value;
        },
        setCartList(state, value) {
            state.cartList = value;
        },
        setCartMoney(state, value) {
            state.cartMoney = value;
        },
        setSiteInfo(state, value) {
            state.siteInfo = value;
            uni.setStorageSync('siteInfo', value)
        },
        setCartChange(state) {
            state.cartChange += 1;
        },
        setBottomNavHidden(state, value) {
            state.bottomNavHidden = value;
            uni.setStorageSync('bottomNavHidden', value)
        },
        setGlobalStoreConfig(state, value) {
            state.globalStoreConfig = value;
            uni.setStorageSync('store_config', value);
        },
        setGlobalStoreInfo(state, value) {
            if (value) {
                state.globalStoreInfo = value;
                uni.setStorageSync('store_info', value);
            } else {
                uni.removeStorageSync('store_info');
            }
        },
        setCartPosition(state, value) {
            state.cartPosition = value;
        },
        setComponentRefresh(state) {
            state.componentRefresh += 1;
        },
        // 客服配置
        setServicerConfig(state, value) {
            state.servicerConfig = value;
            uni.setStorageSync('servicer_config', value);
        },
        setDiySeckillInterval(state, value) {
            state.diySeckillInterval = value;
        },
        setTabBarHeight(state, value) {
            state.tabBarHeight = value;
        }
    },
    actions: {
        init() {
            return new Promise((resolve, reject) => {
                Http.sendRequest({
                    url: '/api/config/init',
                    success: res => {
                        var data = res.data;
                        if (data) {

                            this.commit('setCartNumber', data.cart_count);

                            this.commit('setThemeStyle', colorList[data.style_theme.name]);

                            // 底部导航
                            this.commit('setTabBarList', data.diy_bottom_nav);

                            this.commit('setAddonIsExist', data.addon_is_exist);

                            this.commit('setDefaultImg', data.default_img);

                            this.commit('setSiteInfo', data.site_info);

                            this.commit('setServicerConfig', data.servicer);

                            uni.setStorageSync('copyright', data.copyright);
							
							uni.setStorageSync('map_config', data.map_config);

                            this.commit('setGlobalStoreConfig', data.store_config);

                            // 默认总店
                            if (data.store_info) {
                                uni.setStorageSync('default_store_info', data.store_info);
                            } else {
                                // 清空不存在的门店信息
                                uni.removeStorageSync('default_store_info');
                                this.commit('setGlobalStoreInfo', null);
                            }

                            resolve(data);
                        }
                    }
                });
            })
        },
        //查询购物车数量
        getCartNumber() {
            if (uni.getStorageSync("token")) {
                Http.sendRequest({
                    url: '/api/cart/lists',
                    success: res => {
                        if (res.code == 0) {
                            let cartList = {},
                                count = 0,
                                money = 0;
                            res.data.forEach(item => {
                                cartList['sku_' + item.sku_id] = item;
                                count += item.num;
                                money += item.total_money;
                            })
                            this.commit('setCartList', cartList);
                            this.commit('setCartNumber', count);
                            this.commit('setCartMoney', money);
                        }
                    }
                });
            } else {
                this.commit('setCartNumber', 0);
                this.commit('setCartList', {});
                this.commit('setCartMoney', 0);
            }
        },
        // 清空购物车 ns-goods-sku-index组件中引用
        emptyCart() {
            this.commit('setCartNumber', 0);
            this.commit('setCartList', {});
            this.commit('setCartMoney', 0);
        }
    }
})
export default store