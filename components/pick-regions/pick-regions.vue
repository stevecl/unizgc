<template>
    <view class="pick-regions">
        <!-- #ifndef MP-ALIPAY -->
        <picker mode="multiSelector" :value="multiIndex" :range="multiArray" @change="handleValueChange"
            @columnchange="handleColumnChange">
            <slot></slot>
        </picker>
        <!-- #endif -->

        <!-- #ifdef MP-ALIPAY -->
        <view @click="$refs.regionsRef.open()">
            <slot></slot>
        </view>

        <uni-popup type="bottom" ref="regionsRef">
            <view class="regions-picker-container">
                <view class="picker-header">
                    <view class="picker-action cancel" @click="$refs.regionsRef.close()">取消</view>
                    <view class="picker-action confirm" @click="confirmRegions">完成</view>
                </view>
                <picker-view :value="multiIndex" @change="pickerViewColumnChange"
                    class="picker-view">
                    <picker-view-column v-if="multiArray[0]">
                        <view class="item" v-for="(item,index) in multiArray[0]" :key="index">{{item}}</view>
                    </picker-view-column>
                    <picker-view-column v-if="multiArray[1]">
                        <view class="item" v-for="(item,index) in multiArray[1]" :key="index">{{item}}</view>
                    </picker-view-column>
                    <picker-view-column v-if="multiArray[2]">
                        <view class="item" v-for="(item,index) in multiArray[2]" :key="index">{{item}}</view>
                    </picker-view-column>
                </picker-view>
            </view>
        </uni-popup>
        <!-- #endif -->
    </view>
</template>

<script>
    export default {
        props: {
            defaultRegions: {
                type: Array
            },
            selectArr: {
                type: String
            }
        },
        data() {
            return {
                pickerValueArray: [],
                cityArr: [],
                districtArr: [],
                multiIndex: [0, 0, 0],
                isInitMultiArray: false,
                // 是否加载完默认地区
                isLoadDefaultAreas: false
            };
        },
        watch: {
            defaultRegions: {
                handler(arr, oldArr = []) {
                    // 避免传的是字面量的时候重复触发
                    if (arr.length != this.selectArr || arr.join('') === oldArr.join('')) return;
                    this.isInitMultiArray = false;
                    this.handleDefaultRegions();
                },
                immediate: true
            }
        },
        computed: {
            multiArray() {
                if (!this.isLoadDefaultAreas) return;
                var arr = this.pickedArr.map(arr => arr.map(item => item.label));
                return arr;
            },
            pickedArr() {
                // 进行初始化
                if (this.isInitMultiArray) {
                    if (this.selectArr == '2') {
                        return [this.pickerValueArray[0], this.pickerValueArray[1]];
                    } else {
                        return [this.pickerValueArray[0], this.pickerValueArray[1], this.pickerValueArray[2]];
                    }
                }

                if (this.selectArr == '2') {
                    return [this.pickerValueArray[0], this.cityArr];
                } else {
                    return [this.pickerValueArray[0], this.cityArr, this.districtArr];
                }
            }
        },
        created() {
            this.getDefaultAreas(0, { level: 0 });
        },
        methods: {
            async pickerViewColumnChange(e) {
                var value = e.detail.value;
                if (value[0] != this.multiIndex[0]) {
                    await this.handleColumnChange({ detail: { column: 0, value: value[0] } })
                    this.multiIndex[1] = e.detail.value[1] || 0;
                    await this.handleColumnChange({ detail: { column: 1, value: value[1] } })
                    this.multiIndex[2] = e.detail.value[2] || 0;
                } else if (value[1] != this.multiIndex[1]) {
                    await this.handleColumnChange({ detail: { column: 1, value: value[1] } })
                    this.multiIndex[2] = e.detail.value[2] || 0;
                } else {
                    this.multiIndex = value
                }
            },
            confirmRegions() {
                this.handleValueChange({ detail: { value: this.multiIndex } })
                this.$refs.regionsRef.close()
            },
            async handleColumnChange(e) {
                this.isInitMultiArray = false;
                let col = e.detail.column;
                let row = e.detail.value;
                this.multiIndex[col] = row;
                switch (col) {
                    case 0:
                        //选择省，加载市、区县
                        this.cityArr = await this.getAreasAsync(this.pickerValueArray[0][this.multiIndex[col]]
                            .value);
                        this.districtArr = await this.getAreasAsync(this.cityArr[0].value);
                        break;
                    case 1:
                        //选择市，加载区县
                        this.districtArr = await this.getAreasAsync(this.cityArr[this.multiIndex[col]].value);
                        break;
                    case 2:
                        if (!this.cityArr.length) this.cityArr = await this.getAreasAsync(this.pickerValueArray[0][
                            0
                        ].value)
                        if (!this.districtArr.length) this.districtArr = await this.getAreasAsync(this.cityArr[0]
                            .value);
                        break;
                }
            },
            handleValueChange(e) {
                // 结构赋值
                let [index0, index1, index2] = e.detail.value;
                let [arr0, arr1, arr2] = this.pickedArr;
                let address = '';
                if (this.selectArr == '2') {
                    address = [arr0[index0], arr1[index1]];
                } else {
                    address = [arr0[index0], arr1[index1], arr2[index2]];
                }
                this.$emit('getRegions', address);
            },
            handleDefaultRegions() {
                var time = setInterval(() => {
                    // if (!this.isLoadDefaultAreas) return;
                    for (let i = 0; i < this.defaultRegions.length; i++) {
                        for (let j = 0; j < this.pickerValueArray[i].length; j++) {
                            // 匹配省
                            if ((this.defaultRegions[i] == this.pickerValueArray[i][j].value || this
                                    .defaultRegions[i] == this.pickerValueArray[i][j].label) && this
                                .pickerValueArray[i][j].level == 1) {
                                // 设置选中省
                                this.$set(this.multiIndex, i, j);

                                // 查询市
                                this.getAreas(this.pickerValueArray[i][j].value, data => {
                                    this.cityArr = data;
                                    this.$set(this.pickerValueArray, 1, data)
                                    for (let k = 0; k < this.cityArr.length; k++) {
                                        if (this.defaultRegions[1] == this.cityArr[k].value || this
                                            .defaultRegions[1] == this.cityArr[k].label) {
                                            // 设置选中市
                                            this.$set(this.multiIndex, 1, k);

                                            // 查询区县
                                            this.getAreas(this.cityArr[k].value, data => {
                                                this.districtArr = data;
                                                this.$set(this.pickerValueArray, 2, data)
                                                 
                                                // 设置选中区县
                                                for (let u = 0; u < this.districtArr
                                                    .length; u++) {
                                                    if (this.defaultRegions[2] == this
                                                        .districtArr[u].value || this
                                                        .defaultRegions[2] == this.districtArr[
                                                            u].label) {
                                                        this.$set(this.multiIndex, 2, u);
                                                        this.handleValueChange({
                                                            detail: {
                                                                value: [j, k, u]
                                                            }
                                                        });
                                                        break;
                                                    }
                                                }
                                            });

                                            break;
                                        }
                                    }
                                });
                            }
                        }
                    }
                    if (this.isLoadDefaultAreas) clearInterval(time);
                }, 100);
            },
            getDefaultAreas(pid, obj) {
                this.$api.sendRequest({
                    url: '/api/address/lists',
                    data: { pid: pid },
                    success: res => {
                        if (res.code == 0) {
                            var data = [];
                            var selected = undefined;
                            res.data.forEach((item, index) => {
                                if (obj != undefined) {
                                    if (obj.level == 0 && obj.province_id != undefined) {
                                        selected = obj.province_id;
                                    } else if (obj.level == 1 && obj.city_id != undefined) {
                                        selected = obj.city_id;
                                    } else if (obj.level == 2 && obj.district_id != undefined) {
                                        selected = obj.district_id;
                                    }
                                }

                                if (selected == undefined && index == 0) {
                                    selected = item.id;
                                }
                                data.push({
                                    value: item.id,
                                    label: item.name,
                                    level: item.level
                                });
                            });

                            this.pickerValueArray[obj.level] = data;
                            if (obj.level + 1 < 3) {
                                obj.level++;
                                this.getDefaultAreas(selected, obj);
                            } else {
                                this.isInitMultiArray = true;
                                this.isLoadDefaultAreas = true;
                                this.handleDefaultRegions()
                            }
                        }
                    }
                });
            },
            // 同步获取地区
            async getAreasAsync(pid) {
                let res = await this.$api.sendRequest({
                    url: '/api/address/lists',
                    data: { pid: pid },
                    async: false
                });
                if (res.code == 0) {
                    var data = [];
                    res.data.forEach((item, index) => {
                        data.push({
                            value: item.id,
                            label: item.name,
                            level: item.level
                        });
                    });
                    return data;
                }
            },
            // 异步获取地区
            getAreas(pid, callback) {
                this.$api.sendRequest({
                    url: '/api/address/lists',
                    data: { pid: pid },
                    success: res => {
                        if (res.code == 0) {
                            var data = [];
                            res.data.forEach((item, index) => {
                                data.push({
                                    value: item.id,
                                    label: item.name,
                                    level: item.level
                                });
                            });
                            if (callback) callback(data);
                        }
                    }
                });
            }
        }
    };
</script>

<style lang="scss" scoped>
    .regions-picker-container {
        padding-bottom: constant(safe-area-inset-bottom);
        padding-bottom: env(safe-area-inset-bottom);

        .picker-header {
            display: flex;
            height: 45px;
            align-items: center;
            border-bottom: 2rpx solid #f5f5f5;
            justify-content: space-between;

            .picker-action {
                padding: 0 28rpx;
                font-size: 34rpx;
            }

            .confirm {
                color: #007aff;
            }
        }
    }
</style>