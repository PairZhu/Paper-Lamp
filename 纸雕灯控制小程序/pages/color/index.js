// pages/color/index.js
const {
  rgbToHex
} = require('../../components/color-picker/color-picker.js');
const ecBLE = require('../../utils/ecBLE.js');
const {
  throttle
} = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInput: false,
    color: 'rgb(0,0,0)',
    begin: 1,
    end: 12,
    colorData: {
      //基础色相，即左侧色盘右上顶点的颜色，由右侧的色相条控制
      hueData: {
        colorStopRed: 255,
        colorStopGreen: 0,
        colorStopBlue: 0,
      },
      //选择点的信息（左侧色盘上的小圆点，即你选择的颜色）
      pickerData: {
        x: 0, //选择点x轴偏移量
        y: 480, //选择点y轴偏移量
        red: 0,
        green: 0,
        blue: 0,
        hex: '#000000'
      },
      //色相控制条的位置
      barY: 0
    },
    rpxRatio: 1 //此值为你的屏幕CSS像素宽度/750，单位rpx实际像素
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onLoad: async function () {
    const res = await wx.getSystemInfo();
    this.setData({
      rpxRatio: res.screenWidth / 750
    });
  },
  onChangeColor(e) {
    this.setData({
      ...e.detail
    });
    this.sendData();
  },
  changeMode() {
    this.setData({
      userInput: !this.data.userInput
    });
  },
  previewColor(e) {
    const color = this.data.colorData.pickerData;
    color[e.currentTarget.dataset.type] = e.detail.value;
    color.hex = rgbToHex(color.red, color.green, color.blue);
    this.setData({
      colorData: {
        ...this.data.colorData,
        pickerData: color,
      }
    });
    this.sendData();
  },
  resetColor: async function() {
    wx.showLoading({
      title: '恢复中',
      mask:true,
    });
    const res = await ecBLE.easySendData('R');
    if(res.ok) {
      this.showModal("提示","恢复成功");
    } else {
      this.showModal("错误","恢复失败，原因:"+res.errMsg);
    }
    wx.hideLoading();
  },
  sendData: throttle(function() {
    const color = this.data.colorData.pickerData;
    if(this.data.end<this.data.begin) {
      this.setData({end:this.data.begin});
    }
    ecBLE.easySendHex([
      'C'.charCodeAt(),
      this.data.begin - 1,
      this.data.end,
      color.red,
      color.green,
      color.blue,
    ]);
  },200),
  saveColor: async function() {
    wx.showLoading({
      title: '保存中',
      mask:true,
    });
    const res = await ecBLE.easySendHex(['S'.charCodeAt()]);
    if(res.ok) {
      this.showModal("提示","保存成功");
    } else {
      this.showModal("错误","保存失败，原因:"+res.errMsg);
    }
    wx.hideLoading();
  },
  showModal(title, content) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false
    })
  },
})