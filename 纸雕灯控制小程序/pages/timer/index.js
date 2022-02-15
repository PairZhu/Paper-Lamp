// pages/timer/index.js
const app = getApp();
const ecBLE = require('../../utils/ecBLE.js');
const {
  formatSeconds,
} = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    sleepTime: 0,
    sleepTimeText:"",
    time: 60,
    countTimeText: formatSeconds(60,'hh 时 mm 分 ss 秒'),
    setTimeText: '未设置',
    multiArray: [
      Array.from({length:49}, (_,k) => (k<10?'0'+k.toString():k.toString())),
      Array.from({length:60}, (_,k) => (k<10?'0'+k.toString():k.toString())),
      Array.from({length:60}, (_,k) => (k<10?'0'+k.toString():k.toString())),
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.watch('sleepTime',this.sleepTimeOnChange);
  },
  sleepTimeOnChange: function (value) {
    this.setData({
      sleepTime: value,
      sleepTimeText: formatSeconds(value,'hh 时 mm 分 ss 秒'),
    });
  },
  countTimeOnChange(e) {
    const [hours,minutes,seconds] = e.detail.value;
    const totalTime = ((hours*60)+minutes)*60+seconds;
    this.setData({
      time: totalTime,
      setTimeText: '未设置',
      countTimeText: formatSeconds(totalTime,'hh 时 mm 分 ss 秒'),
    });
  },
  setTimeOnChange(e) {
    const [hourStr,minuteStr] = e.detail.value.split(':');
    const nowDate = new Date();
    const seletTime = new Date(nowDate.toDateString()+' '+e.detail.value);
    if(seletTime<nowDate) {
      seletTime.setDate(seletTime.getDate()+1);
    }
    const seconds = parseInt((seletTime-nowDate)/1000);
    this.setData({
      time: seconds,
      countTimeText: '未设置',
      setTimeText: `${hourStr} : ${minuteStr} `,
    });
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.sleepTimeOnChange(app.globalData.sleepTime);
  },
  showModal(title, content) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false
    });
  },
  cancelPowerDown: async function() {
    wx.showLoading({
      title: '取消中',
      mask:true,
    });
    const dealResult = str => {
      if(str==='OK'){
        return true;
      } else {
        return false;
      }
    }
    const result = ecBLE.receiveUtil(dealResult,1000);
    ecBLE.easySendData('D');
    if(await result) {
      app.globalData.sleepTime=0;
      this.showModal("提示","取消成功");
    } else {
      this.showModal("错误","取消失败");
    }
    wx.hideLoading();
  },
  powerDown: async function(e) {
    const seconds = Math.max(e.currentTarget.dataset.time,1);
    wx.showLoading({
      title: '设置中',
      mask:true,
    });
    const dealResult = str => {
      if(str===seconds.toString()){
        return true;
      } else {
        return false;
      }
    }
    const result = ecBLE.receiveUtil(dealResult,1000);
    ecBLE.easySendData('P'+seconds.toString());
    if(await result) {
      if(e.currentTarget.dataset.time!==0) {
        app.globalData.sleepTime=seconds;
        this.showModal("提示","设置成功");
      } else {
        ecBLE.closeBLEConnection();
      }
    } else {
      this.showModal("错误","设置失败");
    }
    wx.hideLoading();
  }
})