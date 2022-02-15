// pages/index/index.js
const ecBLE = require('../../utils/ecBLE.js');
const app = getApp();
const {
  throttle,
  formatSeconds,
  wait,
} = require('../../utils/util.js');
const deviceName = 'Paper-Lamp';
const waitSecond = 6;
Page({
  /**
   * 页面的初始数据
   */
  loading: false,
  data: {
    state: 0,
    sleepTime: 0,
    sleepTimeText:"",
    isConnected: false,
    brightness: 0,
  },
  async bleConnect() {
    if (this.loading) {
      return;
    }
    if (this.data.isConnected) {
      const res = await wx.showModal({
        title: "提示",
        content: "确定要断开连接吗"
      })
      if (res.confirm) {
        ecBLE.closeBLEConnection();
      }
      return;
    }
    this.loading = true;
    wx.showLoading({
      title: '设备连接中',
      mask: true,
    });
    const res = await ecBLE.openBluetoothAdapter();
    if (!res.ok) {
      wx.hideLoading();
      this.showModal("错误", "打开蓝牙适配器失败: " + res.errMsg);
      this.loading = false;
      return;
    }
    const findDevice = await new Promise( async resolve => {
      ecBLE.startBluetoothDevicesDiscovery(name => {
        if (name === deviceName) {
          resolve(true);
        }
      });
      await wait(waitSecond*1000);
      resolve(false);
    });
    ecBLE.stopBluetoothDevicesDiscovery();
    if (findDevice) {
      const res = await ecBLE.easyConnect(deviceName);
      if (res.ok) {
        const success = await this.readLampData()
        if(success) {
          this.showModal("提示", "连接成功");
        } else {
          this.showModal("提示", "连接成功，但数据同步失败");
        }
        this.setData({
          isConnected: true
        });
        ecBLE.onBLEConnectionStateChange(this.disConnect);
        wx.showTabBar();
      } else {
        this.showModal("提示", "连接失败,errCode=" + res.errCode + ",errMsg=" + res.errMsg);
      }
    } else {
      this.showModal("错误", "找不到指定设备，请确保纸雕灯电源已打开");
    }
    wx.hideLoading();
    this.loading = false;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    app.watch('sleepTime',this.sleepTimeOnChange);
    if(!this.data.isConnected) {
      wx.hideTabBar();
    }
  },
  sleepTimeOnChange: function (value){
    this.setData({
      sleepTime: value,
      sleepTimeText:formatSeconds(value,'hh 时 mm 分 ss 秒'),
    });
  },

  onShow: function () {
    //获取彩灯状态数据
    this.sleepTimeOnChange(app.globalData.sleepTime);
  },

  showModal(title, content) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false
    });
  },

  switchChange(e) {
    // color[e.currentTarget.dataset.type] = e.detail.value;
    let newState = this.data.state;
    if(e.detail.value) {
      newState|=e.currentTarget.dataset.flag;
    } else {
      newState&=(~e.currentTarget.dataset.flag);
    }
    this.setData({
      state: newState,
    });
    ecBLE.easySendHex(['O'.charCodeAt(),newState]);
  },

  readLampData: async function() {
    const dealResult = str => {
      const params = str.split(',');
      if(params.length!==3) {
        return false;
      }
      this.setData({
        state:Number(params[0]),
        brightness:Number(params[1]),
      });
      app.globalData.sleepTime=Number(params[2]);
      return true;
    }
    ecBLE.easySendData("G");
    return await ecBLE.receiveUtil(dealResult,400);
  },

  disConnect() {
    wx.switchTab({
      url: '/pages/index/index'
    });
    wx.hideTabBar();
    this.showModal('提示', "已断开");
    this.setData({
      isConnected: false
    });
  },
  onBrightChanging() {
    this.setBrightness();
  },
  setBrightness: throttle(function () {
    ecBLE.easySendHex([
      'B'.charCodeAt(),
      this.data.brightness,
    ]);
  }, 100),

});